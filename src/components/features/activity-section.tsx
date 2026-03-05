'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  UserPlus,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityEvent {
  id: string;
  event_type: string;
  status: string | null;
  payload: Record<string, unknown>;
  created_at: string | null;
  processed_at: string | null;
  error: string | null;
}

interface ActivityResponse {
  success: boolean;
  events: ActivityEvent[];
  total: number;
  page: number;
  limit: number;
}

type StatusFilter = 'all' | 'completed' | 'failed' | 'pending';

// Map event types to icons
function getEventIcon(eventType: string) {
  if (eventType.includes('email')) return Mail;
  if (eventType.includes('lead') || eventType.includes('contact')) return UserPlus;
  return Zap;
}

// Map status to badge styles
function getStatusBadge(status: string | null) {
  switch (status) {
    case 'completed':
      return {
        variant: 'default' as const,
        className: 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/20',
        icon: CheckCircle2,
        label: 'Completed',
      };
    case 'failed':
      return {
        variant: 'destructive' as const,
        className: 'bg-red-500/20 text-red-600 hover:bg-red-500/20',
        icon: AlertCircle,
        label: 'Failed',
      };
    case 'pending':
    case 'processing':
      return {
        variant: 'secondary' as const,
        className: 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/20',
        icon: Clock,
        label: status === 'processing' ? 'Processing' : 'Pending',
      };
    default:
      return {
        variant: 'outline' as const,
        className: '',
        icon: Clock,
        label: status || 'Unknown',
      };
  }
}

// Format relative time
function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return 'Unknown';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

// Get human-readable event description
function getEventDescription(event: ActivityEvent): string {
  const payload = event.payload || {};

  // Email events
  if (event.event_type.includes('email')) {
    const to = payload.to || payload.recipient || payload.email;
    if (to) return `Email to ${to}`;
    return 'Email sent';
  }

  // Lead events
  if (event.event_type.includes('lead')) {
    const name = payload.name || payload.lead_name;
    if (name) return `Lead: ${name}`;
    return 'Lead event';
  }

  // CRM events
  if (event.event_type.startsWith('crm.')) {
    const action = event.event_type.split('.')[1];
    return `CRM ${action?.replace(/_/g, ' ') || 'event'}`;
  }

  return event.event_type.replace(/[._]/g, ' ');
}

// Format event type for display
function formatEventType(eventType: string): string {
  return eventType.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ActivitySection() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const limit = 20;

  const fetchActivity = useCallback(async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      } else {
        setRefreshing(true);
      }
      setError(null);

      const offset = reset ? 0 : (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        status: statusFilter,
      });

      if (searchQuery.trim()) {
        params.set('event_type', searchQuery.trim());
      }

      const response = await fetch(`/api/activity?${params.toString()}`);
      const data: ActivityResponse = await response.json();

      if (!data.success) {
        throw new Error('Failed to fetch activity');
      }

      if (reset) {
        setEvents(data.events);
      } else {
        setEvents((prev) => [...prev, ...data.events]);
      }
      setTotal(data.total);
      setHasMore(data.events.length === limit && offset + data.events.length < data.total);
    } catch (err) {
      console.error('Failed to fetch activity:', err);
      setError('Failed to load activity');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter, searchQuery, page, limit]);

  // Initial load and filter changes
  useEffect(() => {
    fetchActivity(true);
  }, [statusFilter, searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    fetchActivity(true);
  };

  const handleLoadMore = () => {
    setPage((p) => p + 1);
    fetchActivity(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="w-full max-w-4xl">
      {/* Header */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground tracking-[-0.025em]">Activity</h1>
          <p className="text-sm text-muted-foreground mt-1 md:mt-1.5 tracking-[-0.01em]">
            View events and activity log for your workspace.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="h-9 self-start sm:self-auto"
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} strokeWidth={1.75} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-4">
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && events.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">No activity yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Events will appear here when actions are performed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {!loading && !error && events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => {
            const Icon = getEventIcon(event.event_type);
            const statusBadge = getStatusBadge(event.status);
            const StatusIcon = statusBadge.icon;
            const isExpanded = expandedId === event.id;

            return (
              <Card
                key={event.id}
                className={cn(
                  'transition-all cursor-pointer hover:shadow-sm',
                  isExpanded && 'ring-1 ring-border'
                )}
                onClick={() => toggleExpand(event.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.75} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">
                            {formatEventType(event.event_type)}
                          </span>
                          <Badge
                            variant={statusBadge.variant}
                            className={cn('text-[11px] px-1.5 py-0', statusBadge.className)}
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusBadge.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(event.created_at)}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {getEventDescription(event)}
                      </p>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border">
                          {event.error && (
                            <div className="mb-3 p-3 bg-red-500/10 rounded-lg">
                              <p className="text-sm text-red-600 font-medium">Error</p>
                              <p className="text-sm text-red-600/80 mt-1">{event.error}</p>
                            </div>
                          )}
                          <div className="space-y-2 text-sm">
                            <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                              <span className="text-muted-foreground sm:w-24 flex-shrink-0">Event ID:</span>
                              <span className="text-foreground font-mono text-xs break-all">{event.id}</span>
                            </div>
                            {event.processed_at && (
                              <div className="flex gap-2">
                                <span className="text-muted-foreground w-24 flex-shrink-0">Processed:</span>
                                <span className="text-foreground">
                                  {new Date(event.processed_at).toLocaleString()}
                                </span>
                              </div>
                            )}
                            <div className="mt-3">
                              <span className="text-muted-foreground text-xs uppercase tracking-wider">
                                Payload
                              </span>
                              <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-x-auto">
                                {JSON.stringify(event.payload, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Load More */}
      {hasMore && !loading && (
        <div className="mt-6 text-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={refreshing}>
            {refreshing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              <>Load More ({total - events.length} remaining)</>
            )}
          </Button>
        </div>
      )}

      {/* Stats */}
      {!loading && events.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground text-center">
          Showing {events.length} of {total} events
        </p>
      )}
    </div>
  );
}
