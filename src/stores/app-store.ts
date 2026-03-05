import { create } from 'zustand';
import type { User, NavSection } from '@/types';

// ============================================
// Tenant Types
// ============================================

export type TenantRole = 'owner' | 'admin' | 'member';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
}

// ============================================
// App State Interface
// ============================================

interface AppState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;

  // Multi-Tenant Context
  tenants: Tenant[];
  currentTenantId: string | null;
  currentRole: TenantRole | null;
  projectId: string | null;
  tenantReady: boolean; // True only after tenants loaded + tenant selected + role resolved

  // Legacy compatibility (maps to currentTenantId)
  tenantId: string | null;

  // UI
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  currentSection: NavSection;
  apiStatus: 'online' | 'offline' | 'checking';

  // Auth Actions
  setUser: (user: User | null) => void;
  logout: () => void;

  // Tenant Actions
  setTenants: (tenants: Tenant[]) => void;
  setCurrentTenant: (tenantId: string) => void;
  setCurrentRole: (role: TenantRole | null) => void;
  setProjectId: (projectId: string | null) => void;
  setTenantReady: (ready: boolean) => void;

  // Legacy compatibility
  setTenantId: (tenantId: string | null) => void;
  setTenantAndProject: (tenantId: string | null, projectId: string | null) => void;

  // UI Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  setCurrentSection: (section: NavSection) => void;
  setApiStatus: (status: 'online' | 'offline' | 'checking') => void;
}

// ============================================
// LocalStorage Keys
// ============================================

const STORAGE_KEY_TENANT = 'orca_current_tenant_id';

// ============================================
// Initialize from localStorage
// ============================================

const getInitialTenantId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY_TENANT);
};

// ============================================
// Store Implementation
// ============================================

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,

  // Multi-tenant state
  tenants: [],
  currentTenantId: null, // Don't restore from localStorage until tenants are loaded
  currentRole: null,
  projectId: null,
  tenantReady: false,

  // Legacy compatibility
  tenantId: null,

  // UI state
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  currentSection: 'newtask',
  apiStatus: 'checking',

  // ============================================
  // Auth Actions
  // ============================================

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  logout: () => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY_TENANT);
    }
    set({
      user: null,
      isAuthenticated: false,
      tenants: [],
      currentTenantId: null,
      currentRole: null,
      projectId: null,
      tenantId: null,
      tenantReady: false,
    });
  },

  // ============================================
  // Tenant Actions
  // ============================================

  setTenants: (tenants) => {
    if (tenants.length === 0) {
      // No tenants - mark as ready but with no selection
      set({ tenants, tenantReady: true });
      console.log('[Tenant] No tenants available');
      return;
    }

    // Try to restore from localStorage first
    const storedTenantId = getInitialTenantId();
    const storedTenant = tenants.find(t => t.id === storedTenantId);

    if (storedTenant) {
      // Restore previous selection
      set({
        tenants,
        currentTenantId: storedTenant.id,
        currentRole: storedTenant.role,
        tenantId: storedTenant.id,
        tenantReady: true,
      });
      console.log('[Tenant] Restored from localStorage:', storedTenant.name, `(${storedTenant.role})`);
    } else {
      // Select first tenant as default
      const defaultTenant = tenants[0];
      set({
        tenants,
        currentTenantId: defaultTenant.id,
        currentRole: defaultTenant.role,
        tenantId: defaultTenant.id,
        tenantReady: true,
      });
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TENANT, defaultTenant.id);
      }
      console.log('[Tenant] Selected default:', defaultTenant.name, `(${defaultTenant.role})`);
    }
  },

  setCurrentTenant: (tenantId) => {
    const state = get();
    const tenant = state.tenants.find(t => t.id === tenantId);

    if (tenant) {
      set({
        currentTenantId: tenantId,
        currentRole: tenant.role,
        tenantId: tenantId,
        projectId: null, // Reset project when switching tenants
      });

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_TENANT, tenantId);
      }

      console.log('[Tenant] Switched to:', tenant.name, `(${tenant.role})`);
    } else {
      console.warn('[Tenant] Tenant not found:', tenantId);
    }
  },

  setCurrentRole: (role) => set({ currentRole: role }),

  setProjectId: (projectId) => set({ projectId }),

  setTenantReady: (ready) => set({ tenantReady: ready }),

  // ============================================
  // Legacy Compatibility
  // ============================================

  setTenantId: (tenantId) => set({ tenantId, currentTenantId: tenantId }),

  setTenantAndProject: (tenantId, projectId) => {
    set({
      tenantId,
      currentTenantId: tenantId,
      projectId,
    });

    // Persist tenant to localStorage
    if (typeof window !== 'undefined' && tenantId) {
      localStorage.setItem(STORAGE_KEY_TENANT, tenantId);
    }
  },

  // ============================================
  // UI Actions
  // ============================================

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
  toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
  setCurrentSection: (section) => set({ currentSection: section }),
  setApiStatus: (status) => set({ apiStatus: status }),
}));
