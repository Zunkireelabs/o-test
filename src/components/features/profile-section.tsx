'use client';

import { useAppStore } from '@/stores/app-store';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Building, Calendar } from 'lucide-react';

export function ProfileSection() {
  const { user } = useAppStore();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your account information.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-8">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-xl bg-gray-900 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{user?.name || 'User'}</h2>
              <Badge variant="outline" className="mt-1">Admin</Badge>
            </div>
          </div>

          <div className="space-y-4">
            <ProfileField
              icon={User}
              label="Name"
              value={user?.name || '-'}
            />
            <ProfileField
              icon={Mail}
              label="Email"
              value={user?.email || '-'}
            />
            <ProfileField
              icon={Building}
              label="Site ID"
              value={user?.site_id || '-'}
            />
            <ProfileField
              icon={Calendar}
              label="Member Since"
              value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-gray-600" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-900 font-medium">{value}</p>
      </div>
    </div>
  );
}
