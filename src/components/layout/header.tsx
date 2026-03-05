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
import { MessageSquare, MessageCircle, Settings, LogOut, Menu } from 'lucide-react';

export function Header() {
  const { user, apiStatus, logout, setCurrentSection, toggleMobileSidebar } = useAppStore();
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
    <header className="h-14 px-4 md:px-6 flex items-center justify-between border-b border-border bg-background">
      {/* Left side - Hamburger menu (mobile only) */}
      <div className="flex items-center">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 -ml-2 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors md:hidden"
          title="Open menu"
        >
          <Menu className="w-5 h-5" strokeWidth={1.75} />
        </button>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* API Status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground tracking-[-0.01em]">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              apiStatus === 'online' && 'bg-emerald-500',
              apiStatus === 'offline' && 'bg-red-500',
              apiStatus === 'checking' && 'bg-amber-500 animate-pulse'
            )}
          />
          <span className="font-medium hidden sm:inline">
            {apiStatus === 'online' && 'Online'}
            {apiStatus === 'offline' && 'Offline'}
            {apiStatus === 'checking' && 'Checking...'}
          </span>
        </div>

        {/* Feedback Button - hidden on mobile */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-[13px] font-medium text-muted-foreground border-border hover:bg-accent hover:text-foreground rounded-[10px] hidden md:flex"
        >
          <MessageSquare className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
          Feedback
        </Button>

        {/* Talk to Kiree Button - hidden on mobile */}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-3 text-[13px] font-medium text-muted-foreground border-border hover:bg-accent hover:text-foreground rounded-[10px] hidden md:flex"
        >
          <MessageCircle className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.75} />
          Talk to Kiree
        </Button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1 rounded-full hover:bg-accent transition-colors">
              <Avatar className="w-8 h-8 cursor-pointer">
                <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* User Info */}
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-foreground tracking-[-0.01em]">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground tracking-[-0.01em]">
                {user?.email || ''}
              </p>
            </div>
            <DropdownMenuSeparator />

            {/* Settings */}
            <DropdownMenuItem
              className="cursor-pointer text-[14px] tracking-[-0.01em]"
              onClick={() => setCurrentSection('settings')}
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
