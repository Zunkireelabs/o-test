import { create } from 'zustand';
import type { User, NavSection } from '@/types';

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;

  // UI
  sidebarCollapsed: boolean;
  currentSection: NavSection;
  apiStatus: 'online' | 'offline' | 'checking';

  // Actions
  setUser: (user: User | null) => void;
  logout: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentSection: (section: NavSection) => void;
  setApiStatus: (status: 'online' | 'offline' | 'checking') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  sidebarCollapsed: false,
  currentSection: 'newtask',
  apiStatus: 'checking',

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentSection: (section) => set({ currentSection: section }),
  setApiStatus: (status) => set({ apiStatus: status }),
}));
