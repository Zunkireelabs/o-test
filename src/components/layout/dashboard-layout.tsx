'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useAppStore } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, setApiStatus, logout } = useAppStore();

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

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
  }, [supabase, router, setUser, setApiStatus, logout]);

  return (
    <div className="flex h-screen bg-white">
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
