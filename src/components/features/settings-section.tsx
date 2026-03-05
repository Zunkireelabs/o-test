'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building, Users, Crown, Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/app-store';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

// Role icon mapping
const roleIcons: Record<string, React.ElementType> = {
  owner: Crown,
  admin: Shield,
  member: User,
};

// Role badge styles
const roleBadgeStyles: Record<string, string> = {
  owner: 'bg-emerald-500/20 text-emerald-600',
  admin: 'bg-blue-500/20 text-blue-600',
  member: 'bg-muted text-muted-foreground',
};

export function SettingsSection() {
  const { currentTenant } = useTenant();
  const { user } = useAppStore();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [workspaceName, setWorkspaceName] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  // Load initial workspace name
  useEffect(() => {
    if (currentTenant) {
      setWorkspaceName(currentTenant.name);
    }
  }, [currentTenant]);

  // Fetch team members when switching to team tab
  useEffect(() => {
    if (activeTab === 'team' && currentTenant && teamMembers.length === 0) {
      fetchTeamMembers();
    }
  }, [activeTab, currentTenant]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeamMembers = async () => {
    if (!currentTenant) return;

    setTeamLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('tenant_users')
        .select(`
          id,
          user_id,
          role,
          created_at,
          profile:profiles(id, name, email)
        `)
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Failed to fetch team members:', error);
        return;
      }

      // Transform data to handle the profile relation
      const members: TeamMember[] = (data || []).map((member) => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        created_at: member.created_at || '',
        profile: Array.isArray(member.profile) ? member.profile[0] : member.profile,
      }));

      setTeamMembers(members);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setTeamLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    if (!currentTenant || !workspaceName.trim()) return;
    if (workspaceName === currentTenant.name) return;

    // TODO: Implement workspace name update when API is ready
    setSaving(true);
    try {
      // For now, just simulate saving
      await new Promise((resolve) => setTimeout(resolve, 500));
      // In production, call API to update tenant name
    } finally {
      setSaving(false);
    }
  };

  const isOwner = currentTenant?.role === 'owner';
  const hasChanges = workspaceName !== currentTenant?.name;

  return (
    <div className="w-full max-w-3xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-[-0.025em]">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1 md:mt-1.5 tracking-[-0.01em]">
          Manage your workspace settings and team.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4 md:mb-6 w-full sm:w-auto">
          <TabsTrigger value="general" className="gap-2 flex-1 sm:flex-none">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">General</span>
            <span className="sm:hidden">General</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2 flex-1 sm:flex-none">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Team</span>
            <span className="sm:hidden">Team</span>
          </TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspace Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Workspace Name */}
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="My Workspace"
                  disabled={!isOwner || saving}
                />
                {!isOwner && (
                  <p className="text-xs text-muted-foreground">
                    Only the workspace owner can change the name.
                  </p>
                )}
              </div>

              {/* Workspace URL (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="workspace-url">Workspace URL</Label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-muted-foreground">app.orca.io/w/</span>
                  <Input
                    id="workspace-url"
                    value={currentTenant?.slug || ''}
                    disabled
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The workspace URL cannot be changed.
                </p>
              </div>

              {/* Workspace ID (for debugging) */}
              <div className="space-y-2">
                <Label>Workspace ID</Label>
                <p className="text-sm font-mono text-muted-foreground break-all">
                  {currentTenant?.id || '-'}
                </p>
              </div>

              {/* Save Button */}
              {isOwner && (
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={handleSaveGeneral}
                    disabled={saving || !hasChanges}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              {teamLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : teamMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No team members found.
                </p>
              ) : (
                <div className="space-y-3">
                  {teamMembers.map((member) => {
                    const RoleIcon = roleIcons[member.role] || User;
                    const isCurrentUser = member.user_id === user?.id;
                    const initials =
                      member.profile?.name
                        ?.split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2) || member.profile?.email?.[0]?.toUpperCase() || 'U';

                    return (
                      <div
                        key={member.id}
                        className={cn(
                          'flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border border-border',
                          isCurrentUser && 'bg-muted/50'
                        )}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          {/* Avatar */}
                          <Avatar className="w-10 h-10 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground truncate">
                                {member.profile?.name || 'Unknown'}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs text-muted-foreground">(You)</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.profile?.email || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Role Badge */}
                        <Badge
                          variant="secondary"
                          className={cn(
                            'flex items-center gap-1 capitalize self-start sm:self-auto flex-shrink-0',
                            roleBadgeStyles[member.role]
                          )}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {member.role}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Note about invite functionality */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  Team invitations and role management coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
