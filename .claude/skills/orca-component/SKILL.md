---
name: orca-component
description: Generate new UI components for Orca following project conventions. Use when creating new React components.
allowed-tools: Write, Read, Glob, Bash(npx shadcn@latest add *)
---

# Orca Component Generator

Create new React components following Orca's conventions.

## Component Types

### 1. UI Component (shadcn)
Add from shadcn registry:
```bash
npx shadcn@latest add $ARGUMENTS[0]
```

### 2. Feature Section Component
Create at `src/components/features/$ARGUMENTS-section.tsx`

Template:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function ${PascalCase}Section() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load data
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">$ARGUMENTS</h1>
        <p className="text-sm text-gray-500 mt-1">
          Description here.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {/* Content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Layout Component
Create at `src/components/layout/$ARGUMENTS.tsx`

### 4. Auth Component
Create at `src/components/auth/$ARGUMENTS.tsx`

## Conventions

1. **File naming**: kebab-case for files (`my-component.tsx`)
2. **Component naming**: PascalCase for components (`MyComponent`)
3. **'use client'**: Add at top for client components
4. **Imports**: Use `@/` alias for src imports
5. **Styling**: Use Tailwind CSS classes
6. **Icons**: Import from `lucide-react`
7. **Animations**: Use `framer-motion` for animations

## Adding to Navigation

After creating a feature section, add to sidebar:

1. Edit `src/components/layout/sidebar.tsx`
2. Add to `mainNavItems` array
3. Add to `NavSection` type in `src/types/index.ts`
4. Add case in `src/components/features/dashboard-content.tsx`
