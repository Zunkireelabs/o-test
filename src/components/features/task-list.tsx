'use client';

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import type { ChatSession } from '@/types';
import { Plus, MessageSquare, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface TaskListProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  renamingSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onRenameSession: (sessionId: string, title: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onStartRename: (sessionId: string) => void;
  onCancelRename: () => void;
  isLoading: boolean;
  isCollapsed: boolean;
}

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  isRenaming: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onRename: (title: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
}

function SessionItem({
  session,
  isActive,
  isRenaming,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
}: SessionItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus and select input when entering rename mode
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      // Set initial value and select
      inputRef.current.value = session.title || '';
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming, session.title]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = inputRef.current?.value.trim() || '';
      if (value) {
        onRename(value);
      } else {
        onCancelRename();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancelRename();
    }
  };

  const handleBlur = () => {
    const value = inputRef.current?.value.trim() || '';
    if (value && value !== session.title) {
      onRename(value);
    } else {
      onCancelRename();
    }
  };

  const handleRenameClick = useCallback(() => {
    setDropdownOpen(false);
    // Small delay to allow dropdown to close
    setTimeout(() => {
      onStartRename();
    }, 50);
  }, [onStartRename]);

  const handleDeleteClick = useCallback(() => {
    setDropdownOpen(false);
    onDelete();
  }, [onDelete]);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'group w-full flex items-center gap-2 px-2 py-1.5 rounded-lg',
        'text-left transition-colors',
        isActive
          ? 'bg-sidebar-accent text-sidebar-foreground'
          : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
      )}
    >
      {/* AI Icon */}
      <div
        className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0 cursor-pointer"
        onClick={!isRenaming ? onSelect : undefined}
      >
        <span className="text-[10px] font-medium text-muted-foreground">
          AI
        </span>
      </div>

      {/* Title or Rename Input */}
      {isRenaming ? (
        <input
          ref={inputRef}
          defaultValue={session.title || ''}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={cn(
            'flex-1 min-w-0 bg-transparent text-sm tracking-[-0.01em]',
            'border-b border-primary outline-none',
            'text-sidebar-foreground'
          )}
          autoComplete="off"
        />
      ) : (
        <span
          onClick={onSelect}
          className="flex-1 min-w-0 text-sm truncate tracking-[-0.01em] cursor-pointer"
        >
          {session.title || 'New Task'}
        </span>
      )}

      {/* 3-dot menu - visible on hover or when active or dropdown is open */}
      {!isRenaming && (isHovered || isActive || dropdownOpen) && (
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      'w-6 h-6 flex items-center justify-center rounded flex-shrink-0',
                      'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
                      'transition-colors cursor-pointer',
                      dropdownOpen && 'bg-sidebar-accent text-sidebar-foreground'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                More options
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={handleRenameClick} className="cursor-pointer">
              <Pencil className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={handleDeleteClick}
              className="cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function TaskList({
  sessions,
  currentSessionId,
  renamingSessionId,
  onSelectSession,
  onNewSession,
  onRenameSession,
  onDeleteSession,
  onStartRename,
  onCancelRename,
  isLoading,
  isCollapsed,
}: TaskListProps) {
  const [deleteTarget, setDeleteTarget] = useState<ChatSession | null>(null);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTarget) {
      onDeleteSession(deleteTarget.id);
      setDeleteTarget(null);
    }
  }, [deleteTarget, onDeleteSession]);

  // Collapsed view - just show icon
  if (isCollapsed) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onNewSession}
              className={cn(
                'w-full flex justify-center px-2 py-2 rounded-[10px]',
                'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
                'transition-colors cursor-pointer'
              )}
            >
              <MessageSquare className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">
            <p>All tasks</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground tracking-[-0.01em]">
            All tasks
          </span>
          <button
            onClick={onNewSession}
            className={cn(
              'w-5 h-5 flex items-center justify-center rounded',
              'text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent',
              'transition-colors cursor-pointer'
            )}
            title="New task"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="px-3 space-y-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-2 py-1.5 animate-pulse"
              >
                <div className="w-6 h-6 rounded-full bg-muted/50" />
                <div
                  className="h-4 bg-muted/50 rounded"
                  style={{ width: `${60 + i * 10}%` }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && sessions.length === 0 && (
          <div className="px-3 py-4 text-center">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground/60">No tasks yet</p>
            <p className="text-[10px] text-muted-foreground/40 mt-0.5">
              Click + to start a new task
            </p>
          </div>
        )}

        {/* Sessions list */}
        {!isLoading && sessions.length > 0 && (
          <div className="px-2 space-y-0.5 max-h-[200px] overflow-y-auto">
            {sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === currentSessionId}
                isRenaming={session.id === renamingSessionId}
                onSelect={() => onSelectSession(session.id)}
                onStartRename={() => onStartRename(session.id)}
                onRename={(title) => onRenameSession(session.id, title)}
                onCancelRename={onCancelRename}
                onDelete={() => setDeleteTarget(session)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deleteTarget?.title || 'New Task'}&quot; and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
