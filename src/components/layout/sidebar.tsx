'use client';

import { useAppStore } from '@/stores/app-store';
import type { NavSection } from '@/types';
import { cn } from '@/lib/utils';
import {
  PenSquare,
  Upload,
  ListTodo,
  BookOpen,
  Settings,
  Code,
  Puzzle,
  PanelLeftClose,
  PanelLeft,
  ChevronsUpDown,
  Check,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ElementType;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  color: string;
}

const organizations: Organization[] = [
  {
    id: 'zunkiree-test',
    name: 'Zunkiree Test Org',
    description: 'Your default organization',
    color: '#F97316', // orange
  },
];

const mainNavItems: NavItem[] = [
  { id: 'newtask', label: 'New Task', icon: PenSquare },
  { id: 'ingest', label: 'Ingest Data', icon: Upload },
  { id: 'jobs', label: 'Ingestion Jobs', icon: ListTodo },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'widget', label: 'Widget Config', icon: Settings },
  { id: 'embed', label: 'Embed Code', icon: Code },
  { id: 'connectors', label: 'Integrations', icon: Puzzle },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, currentSection, setCurrentSection } = useAppStore();
  const currentOrg = organizations[0]; // Default to first org

  return (
    <motion.aside
      className={cn(
        'h-screen flex flex-col flex-shrink-0 border-r border-zinc-100',
        'transition-all duration-200 ease-in-out'
      )}
      style={{ backgroundColor: '#FAFAFA' }}
      animate={{ width: sidebarCollapsed ? 68 : 240 }}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div
          className="flex items-center gap-2.5 cursor-pointer overflow-hidden"
          onClick={() => sidebarCollapsed && toggleSidebar()}
        >
          <Image
            src="/orca-icon.png"
            alt="Orca"
            width={28}
            height={28}
            className="flex-shrink-0"
          />
          <motion.span
            className="text-xl font-semibold text-zinc-900 whitespace-nowrap tracking-[-0.02em]"
            animate={{ opacity: sidebarCollapsed ? 0 : 1, width: sidebarCollapsed ? 0 : 'auto' }}
          >
            orca
          </motion.span>
        </div>
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-zinc-400 hover:bg-[#EFEFF0] hover:text-zinc-700 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-zinc-400 hover:bg-[#EFEFF0] hover:text-zinc-700 transition-colors absolute left-4"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4" strokeWidth={1.75} />
          </button>
        )}
      </div>

      {/* Organization Selector */}
      {!sidebarCollapsed && (
        <div className="px-3 pb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 px-3 py-2 bg-white border border-zinc-200 rounded-[10px] hover:bg-[#EFEFF0] transition-colors">
                {/* Org Icon */}
                <div
                  className="w-5 h-5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: currentOrg.color }}
                />
                {/* Org Name */}
                <span className="flex-1 text-left text-[14px] font-medium text-zinc-900 tracking-[-0.01em] truncate">
                  {currentOrg.name}
                </span>
                {/* Chevron */}
                <ChevronsUpDown className="w-4 h-4 text-zinc-400 flex-shrink-0" strokeWidth={1.75} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[280px]">
              {organizations.map((org) => (
                <DropdownMenuItem
                  key={org.id}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                >
                  {/* Org Icon */}
                  <div
                    className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: org.color }}
                  />
                  {/* Org Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-medium text-zinc-900 tracking-[-0.01em]">
                        {org.name}
                      </span>
                      {org.id === currentOrg.id && (
                        <Check className="w-4 h-4 text-emerald-500" strokeWidth={2} />
                      )}
                    </div>
                    <span className="text-[12px] text-zinc-500 tracking-[-0.01em]">
                      {org.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Collapsed Org Icon */}
      {sidebarCollapsed && (
        <div className="px-3 pb-2 flex justify-center">
          <div
            className="w-6 h-6 rounded-full cursor-pointer"
            style={{ backgroundColor: currentOrg.color }}
            title={currentOrg.name}
          />
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {mainNavItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={currentSection === item.id}
            isCollapsed={sidebarCollapsed}
            onClick={() => setCurrentSection(item.id)}
          />
        ))}
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
        'w-full flex items-center gap-3 px-3 py-2 rounded-[10px] text-[14px] font-medium tracking-[-0.01em] transition-all',
        !isActive && 'text-zinc-500 hover:text-zinc-900 hover:bg-[#EFEFF0]',
        isCollapsed && 'justify-center px-2'
      )}
      style={isActive ? { backgroundColor: '#EFEFF0', color: '#18181B' } : undefined}
    >
      <Icon className={cn(
        'w-[18px] h-[18px] flex-shrink-0',
        isActive ? 'text-zinc-900' : 'text-zinc-500'
      )} strokeWidth={1.75} />
      <motion.span
        className={cn(
          'whitespace-nowrap overflow-hidden',
          isActive && 'text-zinc-900'
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
