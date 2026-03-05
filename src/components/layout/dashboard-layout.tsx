'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useAppStore } from '@/stores/app-store';
import { useChatStore } from '@/stores/chat-store';
import { useTenant } from '@/hooks/useTenant';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    setUser,
    setApiStatus,
    logout,
    setProjectId,
    currentTenantId,
    projectId,
    tenantReady,
  } = useAppStore();
  const { setSessionId } = useChatStore();
  const { loadTenants, currentTenant, currentRole } = useTenant();

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  // ============================================
  // Load session from localStorage when tenant/project changes
  // ============================================
  useEffect(() => {
    if (currentTenantId && projectId) {
      const storedSessionId = localStorage.getItem(`orca_session_${currentTenantId}_${projectId}`);
      if (storedSessionId) {
        setSessionId(storedSessionId);
      }
    }
  }, [currentTenantId, projectId, setSessionId]);

  // ============================================
  // Load default project ONLY after tenant is ready
  // ============================================
  useEffect(() => {
    // Guards: Wait for tenant system to stabilize
    if (!tenantReady || !supabase || !currentTenantId) return;

    // Skip if project already loaded for this tenant
    if (projectId) return;

    const loadProject = async () => {
      console.log('[Dashboard] Loading project for tenant:', currentTenantId);
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .eq('tenant_id', currentTenantId)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (project) {
        setProjectId(project.id);
        console.log('[Dashboard] Loaded project:', project.id);
      } else {
        console.warn('[Dashboard] No active project found for tenant');
      }
    };

    loadProject();
  }, [supabase, tenantReady, currentTenantId, projectId, setProjectId]);

  // ============================================
  // Main auth + tenant loading effect
  // ============================================
  useEffect(() => {
    if (!supabase) {
      router.push('/login');
      return;
    }

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

        // ============================================
        // Load all tenants for this user (with roles)
        // ============================================
        const tenants = await loadTenants(user.id);

        if (tenants.length === 0) {
          console.warn('[Dashboard] User has no tenants — this should not happen');
        } else {
          console.log('[Dashboard] User tenants loaded:', tenants.map(t => `${t.name} (${t.role})`).join(', '));
        }

      } catch (err) {
        console.error('[Dashboard] Auth error:', err);
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
  }, [supabase, router, setUser, setApiStatus, logout, loadTenants]);

  // ============================================
  // Debug: Log tenant context changes
  // ============================================
  useEffect(() => {
    if (currentTenant && currentRole) {
      console.log('[Dashboard] Current context:', {
        tenant: currentTenant.name,
        role: currentRole,
        tenantId: currentTenantId,
        projectId,
      });
    }
  }, [currentTenant, currentRole, currentTenantId, projectId]);

  // ============================================
  // Debug: Expose tenant helpers to window (dev only)
  // ============================================
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as unknown as Record<string, unknown>).__ORCA_DEBUG__ = {
        getTenants: () => useAppStore.getState().tenants,
        getCurrentTenant: () => useAppStore.getState().tenants.find(t => t.id === useAppStore.getState().currentTenantId),
        getCurrentRole: () => useAppStore.getState().currentRole,
        switchTenant: (id: string) => useAppStore.getState().setCurrentTenant(id),
        getState: () => ({
          tenants: useAppStore.getState().tenants,
          currentTenantId: useAppStore.getState().currentTenantId,
          currentRole: useAppStore.getState().currentRole,
          projectId: useAppStore.getState().projectId,
          tenantReady: useAppStore.getState().tenantReady,
        }),
      };
      console.log('[Debug] window.__ORCA_DEBUG__ available. Try: __ORCA_DEBUG__.getState()');
    }
  }, []);

  const { mobileSidebarOpen, setMobileSidebarOpen, sidebarCollapsed } = useAppStore();

  // Close mobile sidebar on route change or section change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [currentTenantId, setMobileSidebarOpen]);

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">
            <Sidebar />
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className={cn(
          "flex-1 overflow-y-auto py-4 md:py-6",
          "px-4 md:px-10"
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
