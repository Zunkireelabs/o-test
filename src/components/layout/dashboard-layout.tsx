'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { useAppStore } from '@/stores/app-store';
import { api } from '@/lib/api';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, setUser, setApiStatus, logout } = useAppStore();

  useEffect(() => {
    // Check if authenticated
    const storedToken = sessionStorage.getItem('orca_token');
    if (!storedToken) {
      router.push('/login');
      return;
    }

    // Load user data
    const loadUser = async () => {
      try {
        const userData = await api.getMe();
        setUser({
          id: userData.site_id,
          email: userData.email,
          name: userData.name,
          site_id: userData.site_id,
          created_at: userData.created_at,
        });
      } catch {
        logout();
        router.push('/login');
      }
    };

    loadUser();

    // Check API status periodically
    const checkApi = async () => {
      const isOnline = await api.checkHealth();
      setApiStatus(isOnline ? 'online' : 'offline');
    };

    checkApi();
    const interval = setInterval(checkApi, 30000);

    return () => clearInterval(interval);
  }, [token, router, setUser, setApiStatus, logout]);

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
