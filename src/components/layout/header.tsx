'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const { user, apiStatus, logout } = useAppStore();
  const router = useRouter();

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    logout();
    router.push('/login');
  };

  return (
    <header className="h-15 px-6 flex items-center justify-end border-b border-gray-100">
      <div className="flex items-center gap-5">
        {/* API Status */}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              apiStatus === 'online' && 'bg-green-500',
              apiStatus === 'offline' && 'bg-red-500',
              apiStatus === 'checking' && 'bg-yellow-500 animate-pulse'
            )}
          />
          <span>
            {apiStatus === 'online' && 'API Online'}
            {apiStatus === 'offline' && 'API Offline'}
            {apiStatus === 'checking' && 'Checking...'}
          </span>
        </div>

        {/* User */}
        <span className="text-sm font-medium text-gray-900">
          {user?.name || 'User'}
        </span>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-gray-500 hover:text-gray-900"
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
