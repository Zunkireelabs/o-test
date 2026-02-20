'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, MessageCircle, Settings, LogOut } from 'lucide-react';

export function Header() {
  const { user, apiStatus, logout, setCurrentSection } = useAppStore();
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

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <header className="h-14 px-6 flex items-center justify-end border-b border-zinc-100">
      <div className="flex items-center gap-4">
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

        {/* Feedback Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-[13px] font-medium text-zinc-700 border-zinc-200 hover:bg-[#EFEFF0] hover:text-zinc-900 rounded-[10px]"
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
          Feedback
        </Button>

        {/* Talk to Kiree Button */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-[13px] font-medium text-zinc-700 border-zinc-200 hover:bg-[#EFEFF0] hover:text-zinc-900 rounded-[10px]"
        >
          <MessageCircle className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
          Talk to Kiree
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1 rounded-full hover:bg-[#EFEFF0] transition-colors">
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarFallback className="bg-zinc-200 text-zinc-600 text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* User Info */}
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-zinc-900 tracking-[-0.01em]">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-zinc-500 tracking-[-0.01em]">
                {user?.email || ''}
              </p>
            </div>
            <DropdownMenuSeparator />

            {/* Settings */}
            <DropdownMenuItem
              className="cursor-pointer text-[14px] tracking-[-0.01em]"
              onClick={() => setCurrentSection('profile')}
            >
              <Settings className="w-4 h-4 mr-2" strokeWidth={1.75} />
              Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Sign Out */}
            <DropdownMenuItem
              className="cursor-pointer text-[14px] tracking-[-0.01em] text-red-600 focus:text-red-600 focus:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" strokeWidth={1.75} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
