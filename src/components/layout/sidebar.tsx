'use client';

import { useEffect, useCallback, useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { useChatStore } from '@/stores/chat-store';
import { useTenant } from '@/hooks/useTenant';
import type { NavSection } from '@/types';
import type { TenantRole } from '@/stores/app-store';
import { cn } from '@/lib/utils';
import {
  Puzzle,
  Activity,
  PanelLeftClose,
  PanelLeft,
  ChevronsUpDown,
  Check,
  Plus,
  Bot,
  BookOpen,
  BarChart3,
  Lock,
  X,
} from 'lucide-react';
import { TaskList } from '@/components/features/task-list';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ElementType;
}

// Role badge styling
const roleBadgeStyles: Record<TenantRole, string> = {
  owner: 'bg-emerald-500/20 text-emerald-600',
  admin: 'bg-blue-500/20 text-blue-600',
  member: 'bg-muted text-muted-foreground',
};

// Generate consistent color from tenant name
function getTenantColor(name: string): string {
  const colors = ['#F97316', '#8B5CF6', '#06B6D4', '#EC4899', '#10B981', '#F59E0B'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

// Beta nav items (active)
const mainNavItems: NavItem[] = [
  { id: 'connectors', label: 'Integrations', icon: Puzzle },
  { id: 'activity', label: 'Activity', icon: Activity },
];

// Phase 4+ items (coming soon)
const comingSoonItems: NavItem[] = [
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, currentSection, setCurrentSection, tenantId, projectId, mobileSidebarOpen, setMobileSidebarOpen } = useAppStore();
  const { tenants, currentTenant, switchTenant } = useTenant();
  const {
    sessions,
    sessionsLoading,
    sessionId,
    renamingSessionId,
    loadSessions,
    loadSessionMessages,
    clearMessages,
    setSessionId,
    updateSessionTitle,
    deleteSession,
    setRenamingSessionId,
  } = useChatStore();

  // Detect mobile viewport
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On mobile, always show expanded sidebar (no collapse mode)
  const isCollapsed = isMobile ? false : sidebarCollapsed;

  // Close mobile sidebar when navigating
  const handleMobileClose = useCallback(() => {
    setMobileSidebarOpen(false);
  }, [setMobileSidebarOpen]);

  // Load sessions when tenant/project changes
  useEffect(() => {
    if (tenantId && projectId) {
      loadSessions(tenantId, projectId);
    }
  }, [tenantId, projectId, loadSessions]);

  // Handle session selection
  const handleSelectSession = useCallback((selectedSessionId: string) => {
    setCurrentSection('newtask');
    loadSessionMessages(selectedSessionId);
  }, [setCurrentSection, loadSessionMessages]);

  // Handle new session
  const handleNewSession = useCallback(() => {
    clearMessages();
    setSessionId(null);
    setCurrentSection('newtask');
  }, [clearMessages, setSessionId, setCurrentSection]);

  // Handle rename session
  const handleRenameSession = useCallback(async (sessionIdToRename: string, title: string) => {
    await updateSessionTitle(sessionIdToRename, title);
    setRenamingSessionId(null);
  }, [updateSessionTitle, setRenamingSessionId]);

  // Handle delete session
  const handleDeleteSession = useCallback(async (sessionIdToDelete: string) => {
    await deleteSession(sessionIdToDelete);
  }, [deleteSession]);

  // Handle cancel rename
  const handleCancelRename = useCallback(() => {
    setRenamingSessionId(null);
  }, [setRenamingSessionId]);

  return (
    <motion.aside
      className={cn(
        'h-screen flex flex-col flex-shrink-0 border-r border-sidebar-border bg-sidebar',
        'transition-all duration-200 ease-in-out'
      )}
      animate={{ width: isCollapsed ? 68 : 240 }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          onClick={() => isCollapsed && toggleSidebar()}
        >
          <Image
            src="/orca-icon.png"
            alt="Orca"
            width={28}
            height={28}
            className="flex-shrink-0"
          />
          <motion.span
            className="text-xl font-semibold text-sidebar-foreground whitespace-nowrap tracking-[-0.02em]"
            animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
          >
            orca
          </motion.span>
        </div>
        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={handleMobileClose}
            className="p-2 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            title="Close sidebar"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
        {/* Desktop collapse button */}
        {!isMobile && !isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
        {!isMobile && isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors absolute left-4"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Workspace Selector */}
      {!isCollapsed && (
        <div className="px-3 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 bg-background border border-border rounded-[10px] hover:bg-sidebar-accent transition-colors">
                {/* Tenant Icon */}
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: currentTenant ? getTenantColor(currentTenant.name) : '#9CA3AF' }}
                />
                {/* Tenant Name */}
                <span className="flex-1 text-left text-[14px] font-medium text-sidebar-foreground tracking-[-0.01em] truncate">
                  {currentTenant?.name || 'Loading...'}
                </span>
                {/* Chevron */}
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground flex-shrink-0" strokeWidth={1.75} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px]">
              {tenants.length === 0 ? (
                <DropdownMenuItem disabled className="flex items-center gap-3 p-3 text-muted-foreground">
                  No workspaces available
                </DropdownMenuItem>
              ) : (
                <>
                  {tenants.map((tenant) => (
                    <DropdownMenuItem
                      key={tenant.id}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                      onClick={() => {
                        if (tenant.id !== currentTenant?.id) {
                          switchTenant(tenant.id);
                        }
                      }}
                    >
                      {/* Tenant Icon */}
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: getTenantColor(tenant.name) }}
                      />
                      {/* Tenant Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[14px] font-medium text-foreground tracking-[-0.01em]">
                            {tenant.name}
                          </span>
                          {/* Role Badge */}
                          <span className={cn(
                            'px-1.5 py-0.5 text-[10px] font-medium rounded capitalize',
                            roleBadgeStyles[tenant.role]
                          )}>
                            {tenant.role}
                          </span>
                          {/* Check if selected */}
                          {tenant.id === currentTenant?.id && (
                            <Check className="w-4 h-4 text-emerald-500" strokeWidth={2} />
                          )}
                        </div>
                        <span className="text-[12px] text-muted-foreground tracking-[-0.01em]">
                          {tenant.slug}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="flex items-center gap-2 p-3 cursor-pointer text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      // TODO: Open create workspace modal
                      console.log('Create workspace clicked');
                    }}
                  >
                    <Plus className="w-4 h-4" strokeWidth={1.75} />
                    <span className="text-[14px] font-medium tracking-[-0.01em]">Create workspace</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Collapsed Workspace Icon */}
      {isCollapsed && (
        <div className="px-3 pb-2 flex justify-center">
          <div
            className="w-6 h-6 rounded-full cursor-pointer"
            style={{ backgroundColor: currentTenant ? getTenantColor(currentTenant.name) : '#9CA3AF' }}
            title={currentTenant?.name || 'Loading...'}
          />
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {/* Active Beta Items */}
        {mainNavItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={currentSection === item.id}
            isCollapsed={isCollapsed}
            onClick={() => {
              setCurrentSection(item.id);
              if (isMobile) handleMobileClose();
            }}
          />
        ))}

        {/* Separator */}
        <div className="py-3">
          <div className="border-t border-sidebar-border" />
        </div>

        {/* Task List (Chat Sessions) */}
        <TaskList
          sessions={sessions}
          currentSessionId={sessionId}
          renamingSessionId={renamingSessionId}
          onSelectSession={(id) => {
            handleSelectSession(id);
            if (isMobile) handleMobileClose();
          }}
          onNewSession={() => {
            handleNewSession();
            if (isMobile) handleMobileClose();
          }}
          onRenameSession={handleRenameSession}
          onDeleteSession={handleDeleteSession}
          onStartRename={setRenamingSessionId}
          onCancelRename={handleCancelRename}
          isLoading={sessionsLoading}
          isCollapsed={isCollapsed}
        />

        {/* Separator */}
        <div className="py-3">
          <div className="border-t border-sidebar-border" />
        </div>

        {/* Coming Soon Items */}
        <TooltipProvider delayDuration={100}>
          {comingSoonItems.map((item) => (
            <ComingSoonButton
              key={item.id}
              item={item}
              isCollapsed={isCollapsed}
            />
          ))}
        </TooltipProvider>
      </nav>

    </motion.aside>
  );
}

function NavButton({
  item,
  isActive,
  isCollapsed,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      title={item.label}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[14px] font-medium tracking-[-0.01em] transition-all cursor-pointer',
        !isActive && 'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
        isActive && 'bg-sidebar-accent text-sidebar-foreground',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className={cn(
        'w-[18px] h-[18px] flex-shrink-0',
        isActive ? 'text-sidebar-foreground' : 'text-muted-foreground'
      )} strokeWidth={1.75} />
      <motion.span
        className={cn(
          'whitespace-nowrap overflow-hidden',
          isActive && 'text-sidebar-foreground'
        )}
        animate={{
          opacity: isCollapsed ? 0 : 1,
          width: isCollapsed ? 0 : 'auto',
        }}
      >
        {item.label}
      </motion.span>
    </button>
  );
}

function ComingSoonButton({
  item,
  isCollapsed,
}: {
  item: NavItem;
  isCollapsed: boolean;
}) {
  const Icon = item.icon;

  const button = (
    <div
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[14px] font-medium tracking-[-0.01em]',
        'text-muted-foreground/50 cursor-not-allowed',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="w-[18px] h-[18px] flex-shrink-0 text-muted-foreground/40" strokeWidth={1.75} />
      {!isCollapsed && (
        <>
          <span className="whitespace-nowrap overflow-hidden flex-1">{item.label}</span>
          <Lock className="w-3 h-3 text-muted-foreground/40 flex-shrink-0" strokeWidth={2} />
        </>
      )}
    </div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {button}
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        <p>Coming Soon</p>
      </TooltipContent>
    </Tooltip>
  );
}
