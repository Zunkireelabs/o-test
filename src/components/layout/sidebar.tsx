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
  User,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ElementType;
}

const mainNavItems: NavItem[] = [
  { id: 'newtask', label: 'New Task', icon: PenSquare },
  { id: 'ingest', label: 'Ingest Data', icon: Upload },
  { id: 'jobs', label: 'Ingestion Jobs', icon: ListTodo },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  { id: 'widget', label: 'Widget Config', icon: Settings },
  { id: 'embed', label: 'Embed Code', icon: Code },
  { id: 'connectors', label: 'Integrations', icon: Puzzle },
];

const footerNavItems: NavItem[] = [
  { id: 'profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, currentSection, setCurrentSection } = useAppStore();

  return (
    <motion.aside
      className={cn(
        'h-screen bg-[#f7f7f7] flex flex-col flex-shrink-0 border-r border-gray-200',
        'transition-all duration-200 ease-in-out'
      )}
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
            className="text-xl font-semibold text-gray-900 whitespace-nowrap"
            animate={{ opacity: sidebarCollapsed ? 0 : 1, width: sidebarCollapsed ? 0 : 'auto' }}
          >
            orca
          </motion.span>
        </div>
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors absolute left-4"
            title="Expand sidebar"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
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

      {/* Footer Nav */}
      <div className="px-3 py-3 border-t border-gray-200">
        {footerNavItems.map((item) => (
          <NavButton
            key={item.id}
            item={item}
            isActive={currentSection === item.id}
            isCollapsed={sidebarCollapsed}
            onClick={() => setCurrentSection(item.id)}
          />
        ))}
      </div>
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
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
        'hover:bg-gray-100',
        isActive && 'bg-gray-900 text-white hover:bg-gray-800',
        !isActive && 'text-gray-600',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <motion.span
        className="whitespace-nowrap overflow-hidden"
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
