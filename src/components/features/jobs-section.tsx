'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  source_type: string;
  source: string;
  status: string;
  chunk_count: number;
  created_at: string;
}

export function JobsSection() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await api.getJobs();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-zinc-100 text-zinc-700';
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-[-0.025em]">Ingestion Jobs</h1>
          <p className="text-sm text-zinc-500 mt-1.5 tracking-[-0.01em]">
            Track the status of your data ingestion jobs.
          </p>
        </div>
        <Button variant="outline" onClick={loadJobs} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading && jobs.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm tracking-[-0.01em]">
              No ingestion jobs yet. Start by ingesting some data.
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {jobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {job.source_type}
                      </Badge>
                      <Badge className={cn('text-xs capitalize font-medium', getStatusColor(job.status))}>
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-900 mt-1 truncate tracking-[-0.01em]">{job.source}</p>
                    <p className="text-xs text-zinc-500 mt-0.5 tracking-[-0.01em]">
                      {job.chunk_count} chunks &middot; {new Date(job.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
