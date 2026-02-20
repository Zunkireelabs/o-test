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
    <header className="h-15 px-6 flex items-center justify-end border-b border-zinc-100">
      <div className="flex items-center gap-5">
        {/* API Status */}
        <div className="flex items-center gap-2 text-sm text-zinc-500 tracking-[-0.01em]">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              apiStatus === 'online' && 'bg-emerald-500',
              apiStatus === 'offline' && 'bg-red-500',
              apiStatus === 'checking' && 'bg-amber-500 animate-pulse'
            )}
          />
          <span className="font-medium">
            {apiStatus === 'online' && 'Online'}
            {apiStatus === 'offline' && 'Offline'}
            {apiStatus === 'checking' && 'Checking...'}
          </span>
        </div>

        {/* User */}
        <span className="text-sm font-medium text-zinc-900 tracking-[-0.01em]">
          {user?.name || 'User'}
        </span>

        {/* Logout */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-zinc-500 hover:text-zinc-900"
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
