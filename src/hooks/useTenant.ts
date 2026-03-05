'use client';

import { useCallback, useMemo } from 'react';
import { useAppStore, Tenant, TenantRole } from '@/stores/app-store';
import { createClient } from '@/lib/supabase/client';

// ============================================
// useTenant Hook
// ============================================
// Provides tenant context and role-based access control
// for the current authenticated user.
//
// Usage:
//   const { currentTenant, currentRole, isOwner, isAdmin } = useTenant();
// ============================================

export function useTenant() {
  const {
    tenants,
    currentTenantId,
    currentRole,
    setTenants,
    setCurrentTenant,
    setCurrentRole,
  } = useAppStore();

  // ============================================
  // Derived State
  // ============================================

  const currentTenant = useMemo(() => {
    return tenants.find(t => t.id === currentTenantId) || null;
  }, [tenants, currentTenantId]);

  // Role checks (respecting hierarchy: owner > admin > member)
  const isOwner = currentRole === 'owner';
  const isAdmin = currentRole === 'owner' || currentRole === 'admin';
  const isMember = currentRole !== null;

  // ============================================
  // Actions
  // ============================================

  /**
   * Switch to a different tenant.
   * Note: Project loading is handled by DashboardLayout to avoid double-fetch.
   */
  const switchTenant = useCallback((tenantId: string) => {
    setCurrentTenant(tenantId);
    // Project will be loaded by dashboard-layout's effect when projectId becomes null
  }, [setCurrentTenant]);

  /**
   * Refresh role from database (useful after role changes)
   */
  const refreshRole = useCallback(async () => {
    if (!currentTenantId) return;

    const supabase = createClient();
    const { data, error } = await supabase.rpc('get_user_tenant_role', {
      p_tenant_id: currentTenantId,
    });

    if (error) {
      console.error('[Tenant] Failed to refresh role:', error);
      return;
    }

    const role = data as TenantRole | null;
    setCurrentRole(role);
    console.log('[Tenant] Role refreshed:', role);
  }, [currentTenantId, setCurrentRole]);

  /**
   * Load all tenants for the current user
   */
  const loadTenants = useCallback(async (userId: string) => {
    const supabase = createClient();

    // Fetch all tenants with user's role
    const { data, error } = await supabase
      .from('tenant_users')
      .select(`
        tenant_id,
        role,
        tenants (
          id,
          name,
          slug
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('[Tenant] Failed to load tenants:', error);
      return [];
    }

    // Transform to Tenant[]
    const tenantList: Tenant[] = (data || [])
      .filter(tu => tu.tenants)
      .map(tu => ({
        id: (tu.tenants as { id: string }).id,
        name: (tu.tenants as { name: string }).name,
        slug: (tu.tenants as { slug: string }).slug,
        role: tu.role as TenantRole,
      }));

    setTenants(tenantList);
    console.log('[Tenant] Loaded tenants:', tenantList.length);

    return tenantList;
  }, [setTenants]);

  // ============================================
  // Return
  // ============================================

  return {
    // State
    tenants,
    currentTenant,
    currentTenantId,
    currentRole,

    // Role checks
    isOwner,
    isAdmin,
    isMember,

    // Actions
    switchTenant,
    refreshRole,
    loadTenants,
    setCurrentTenant,
  };
}

// ============================================
// Role Guard Utilities
// ============================================

/**
 * Check if a role meets minimum requirement
 */
export function hasMinimumRole(
  currentRole: TenantRole | null,
  requiredRole: TenantRole
): boolean {
  if (!currentRole) return false;

  const roleHierarchy: Record<TenantRole, number> = {
    owner: 3,
    admin: 2,
    member: 1,
  };

  return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
}

/**
 * Get display label for role
 */
export function getRoleLabel(role: TenantRole): string {
  const labels: Record<TenantRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    member: 'Member',
  };
  return labels[role];
}
