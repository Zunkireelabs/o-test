'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type {
  UIPrimitive,
  TextPrimitive,
  CardPrimitive,
  TablePrimitive,
  ListPrimitive,
  GridPrimitive,
  BadgePrimitive,
  BadgeColor,
  ButtonPrimitive,
  AvatarPrimitive,
  ProgressPrimitive,
  TimelinePrimitive,
  DividerPrimitive,
  SpacerPrimitive,
  LayoutPrimitive,
  ActionsPrimitive,
  KeyValuePrimitive,
  StatPrimitive,
} from '@/types/ui-blocks';

interface PrimitiveRendererProps {
  primitive: UIPrimitive;
  onAction?: (action: string) => void;
}

// Text variant styles
const textVariantStyles: Record<TextPrimitive['variant'] & string, string> = {
  heading: 'text-lg font-semibold',
  subheading: 'text-base font-medium',
  body: 'text-sm',
  caption: 'text-xs',
  label: 'text-xs font-medium uppercase tracking-wide',
};

const textColorStyles: Record<TextPrimitive['color'] & string, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-amber-600 dark:text-amber-400',
  info: 'text-blue-600 dark:text-blue-400',
};

// Badge color styles
const badgeColorStyles: Record<BadgeColor, string> = {
  default: '',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
};

// Spacer sizes
const spacerSizes: Record<SpacerPrimitive['size'], string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-4',
  lg: 'h-6',
  xl: 'h-8',
};

// Gap sizes
const gapSizes: Record<string, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Component renderers
function TextRenderer({ primitive }: { primitive: TextPrimitive }) {
  const variant = primitive.variant || 'body';
  const color = primitive.color || 'default';

  return (
    <p className={cn(textVariantStyles[variant], textColorStyles[color])}>
      {primitive.content}
    </p>
  );
}

function CardRenderer({ primitive, onAction }: { primitive: CardPrimitive; onAction?: (action: string) => void }) {
  const variantStyles: Record<string, string> = {
    default: '',
    success: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30',
    error: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30',
    warning: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30',
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30',
  };

  return (
    <Card className={cn(variantStyles[primitive.variant || 'default'])}>
      {(primitive.header || primitive.description) && (
        <CardHeader className="pb-2">
          {primitive.header && <CardTitle className="text-base">{primitive.header}</CardTitle>}
          {primitive.description && <CardDescription>{primitive.description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className={primitive.header ? 'pt-0' : ''}>
        <div className="space-y-2">
          {primitive.children.map((child, index) => (
            <PrimitiveRenderer key={index} primitive={child} onAction={onAction} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function TableRenderer({ primitive }: { primitive: TablePrimitive }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            {primitive.columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-2 text-left text-xs font-medium text-muted-foreground"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {primitive.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-muted/30">
              {primitive.columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-2 text-sm', primitive.compact && 'py-1.5')}>
                  {String(row[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ListRenderer({ primitive }: { primitive: ListPrimitive }) {
  const Tag = primitive.ordered ? 'ol' : 'ul';

  return (
    <Tag className={cn('space-y-2', primitive.ordered && 'list-decimal list-inside')}>
      {primitive.items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          {!primitive.ordered && <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />}
          <div className="flex-1">
            <span className="text-sm font-medium">{item.primary}</span>
            {item.secondary && (
              <span className="text-sm text-muted-foreground ml-1">— {item.secondary}</span>
            )}
            {item.badge && (
              <Badge variant="secondary" className={cn('ml-2 text-xs', badgeColorStyles[item.badge.color || 'default'])}>
                {item.badge.label}
              </Badge>
            )}
          </div>
        </li>
      ))}
    </Tag>
  );
}

function GridRenderer({ primitive, onAction }: { primitive: GridPrimitive; onAction?: (action: string) => void }) {
  const colClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div className={cn('grid', colClasses[primitive.columns], gapSizes[primitive.gap || 'md'])}>
      {primitive.children.map((child, index) => (
        <PrimitiveRenderer key={index} primitive={child} onAction={onAction} />
      ))}
    </div>
  );
}

function BadgeRenderer({ primitive }: { primitive: BadgePrimitive }) {
  return (
    <Badge variant="secondary" className={cn('text-xs', badgeColorStyles[primitive.color || 'default'])}>
      {primitive.label}
    </Badge>
  );
}

function ButtonRenderer({ primitive, onAction }: { primitive: ButtonPrimitive; onAction?: (action: string) => void }) {
  return (
    <Button
      variant={primitive.variant || 'default'}
      size={primitive.size === 'lg' ? 'lg' : primitive.size === 'sm' ? 'sm' : 'default'}
      onClick={() => onAction?.(primitive.action)}
    >
      {primitive.label}
    </Button>
  );
}

function AvatarRenderer({ primitive }: { primitive: AvatarPrimitive }) {
  const sizeClasses: Record<string, string> = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base',
  };

  if (primitive.image) {
    return (
      <img
        src={primitive.image}
        alt={primitive.name}
        className={cn('rounded-full object-cover', sizeClasses[primitive.size || 'md'])}
      />
    );
  }

  return (
    <div className={cn(
      'rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium',
      sizeClasses[primitive.size || 'md']
    )}>
      {getInitials(primitive.name)}
    </div>
  );
}

function ProgressRenderer({ primitive }: { primitive: ProgressPrimitive }) {
  const percentage = Math.round((primitive.current / primitive.total) * 100);

  return (
    <div className="space-y-1">
      {primitive.label && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{primitive.label}</span>
          {primitive.showPercentage && <span className="font-medium">{percentage}%</span>}
        </div>
      )}
      <Progress value={percentage} className="h-2" />
    </div>
  );
}

function TimelineRenderer({ primitive }: { primitive: TimelinePrimitive }) {
  return (
    <div className="space-y-3">
      {primitive.events.map((event, index) => (
        <div key={index} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className={cn(
              'w-2.5 h-2.5 rounded-full',
              event.status === 'completed' && 'bg-emerald-500',
              event.status === 'current' && 'bg-blue-500 ring-4 ring-blue-100 dark:ring-blue-900',
              event.status === 'pending' && 'bg-muted-foreground/30',
              !event.status && 'bg-muted-foreground',
            )} />
            {index < primitive.events.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{event.title}</span>
              <span className="text-xs text-muted-foreground">{event.date}</span>
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DividerRenderer({ primitive }: { primitive: DividerPrimitive }) {
  if (primitive.label) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{primitive.label}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }
  return <div className="h-px bg-border" />;
}

function SpacerRenderer({ primitive }: { primitive: SpacerPrimitive }) {
  return <div className={spacerSizes[primitive.size]} />;
}

function LayoutRenderer({ primitive, onAction }: { primitive: LayoutPrimitive; onAction?: (action: string) => void }) {
  const directionClass = primitive.direction === 'horizontal' ? 'flex-row' : 'flex-col';
  const alignClass = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  }[primitive.align || 'stretch'];
  const justifyClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
  }[primitive.justify || 'start'];

  return (
    <div className={cn('flex', directionClass, alignClass, justifyClass, gapSizes[primitive.gap || 'md'])}>
      {primitive.children.map((child, index) => (
        <PrimitiveRenderer key={index} primitive={child} onAction={onAction} />
      ))}
    </div>
  );
}

function ActionsRenderer({ primitive, onAction }: { primitive: ActionsPrimitive; onAction?: (action: string) => void }) {
  const alignClass = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
  }[primitive.align || 'start'];

  return (
    <div className={cn('flex flex-wrap gap-2', alignClass)}>
      {primitive.buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.variant || 'outline'}
          size="sm"
          onClick={() => onAction?.(button.action)}
        >
          {button.label}
        </Button>
      ))}
    </div>
  );
}

function KeyValueRenderer({ primitive }: { primitive: KeyValuePrimitive }) {
  const layoutClass = {
    horizontal: 'flex flex-wrap gap-x-6 gap-y-2',
    vertical: 'space-y-2',
    grid: 'grid grid-cols-2 gap-2',
  }[primitive.layout || 'vertical'];

  return (
    <div className={layoutClass}>
      {primitive.items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{item.key}:</span>
          <span className="text-sm font-medium">{String(item.value ?? '—')}</span>
        </div>
      ))}
    </div>
  );
}

function StatRenderer({ primitive }: { primitive: StatPrimitive }) {
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">{primitive.label}</p>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-2xl font-semibold">{primitive.value}</span>
        {primitive.change && (
          <span className={cn(
            'text-sm font-medium',
            primitive.change.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
          )}>
            {primitive.change.direction === 'up' ? '↑' : '↓'} {Math.abs(primitive.change.value)}%
          </span>
        )}
      </div>
    </div>
  );
}

// Main renderer
export function PrimitiveRenderer({ primitive, onAction }: PrimitiveRendererProps) {
  switch (primitive.type) {
    case 'text':
      return <TextRenderer primitive={primitive} />;
    case 'card':
      return <CardRenderer primitive={primitive} onAction={onAction} />;
    case 'table':
      return <TableRenderer primitive={primitive} />;
    case 'list':
      return <ListRenderer primitive={primitive} />;
    case 'grid':
      return <GridRenderer primitive={primitive} onAction={onAction} />;
    case 'badge':
      return <BadgeRenderer primitive={primitive} />;
    case 'button':
      return <ButtonRenderer primitive={primitive} onAction={onAction} />;
    case 'avatar':
      return <AvatarRenderer primitive={primitive} />;
    case 'progress':
      return <ProgressRenderer primitive={primitive} />;
    case 'timeline':
      return <TimelineRenderer primitive={primitive} />;
    case 'divider':
      return <DividerRenderer primitive={primitive} />;
    case 'spacer':
      return <SpacerRenderer primitive={primitive} />;
    case 'layout':
      return <LayoutRenderer primitive={primitive} onAction={onAction} />;
    case 'actions':
      return <ActionsRenderer primitive={primitive} onAction={onAction} />;
    case 'key-value':
      return <KeyValueRenderer primitive={primitive} />;
    case 'stat':
      return <StatRenderer primitive={primitive} />;
    default:
      return null;
  }
}
