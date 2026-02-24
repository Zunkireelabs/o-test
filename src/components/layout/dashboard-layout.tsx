'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useAppStore } from '@/stores/app-store';
import { useChatStore } from '@/stores/chat-store';
import { createClient } from '@/lib/supabase/client';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, setApiStatus, logout, setTenantAndProject, tenantId, projectId } = useAppStore();
  const { setSessionId } = useChatStore();

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  // Load session from localStorage when tenant/project changes
  useEffect(() => {
    if (tenantId && projectId) {
      const storedSessionId = localStorage.getItem(`orca_session_${tenantId}_${projectId}`);
      if (storedSessionId) {
        setSessionId(storedSessionId);
      }
    }
  }, [tenantId, projectId, setSessionId]);

  useEffect(() => {
    if (!supabase) {
      router.push('/login');
      return;
    }

    // Load user data from Supabase Auth
    const loadUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          logout();
          router.push('/login');
          return;
        }

        // Get profile data
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const profileData = profile as { name?: string; avatar_url?: string } | null;

        setUser({
          id: user.id,
          email: user.email || '',
          name: profileData?.name || user.email?.split('@')[0] || 'User',
          avatar_url: profileData?.avatar_url,
          created_at: user.created_at,
        });

        // Load tenant and project for this user
        const { data: tenantUser } = await supabase
          .from('tenant_users')
          .select('tenant_id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (tenantUser?.tenant_id) {
          // Get the default project for this tenant
          const { data: project } = await supabase
            .from('projects')
            .select('id')
            .eq('tenant_id', tenantUser.tenant_id)
            .limit(1)
            .single();

          setTenantAndProject(tenantUser.tenant_id, project?.id || null);
        }
      } catch {
        logout();
        router.push('/login');
      }
    };

    loadUser();

    // Check Supabase connection status
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        setApiStatus(error ? 'offline' : 'online');
      } catch {
        setApiStatus('offline');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        logout();
        router.push('/login');
      }
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [supabase, router, setUser, setApiStatus, logout, setTenantAndProject]);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-10 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
