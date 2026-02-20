'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { RefreshCw, Loader2, BookOpen } from 'lucide-react';

interface KnowledgeItem {
  id: string;
  title: string;
  source_type: string;
  chunk_count: number;
  created_at: string;
}

export function KnowledgeSection() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadKnowledge = async () => {
    setLoading(true);
    try {
      const data = await api.getKnowledge();
      setItems(data.items || []);
    } catch (err) {
      console.error('Failed to load knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKnowledge();
  }, []);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 tracking-[-0.025em]">Knowledge Base</h1>
          <p className="text-sm text-zinc-500 mt-1.5 tracking-[-0.01em]">
            View all content in your knowledge base.
          </p>
        </div>
        <Button variant="outline" onClick={loadKnowledge} disabled={loading}>
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
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-10 h-10 mx-auto text-zinc-300 mb-3" />
              <p className="text-zinc-500 tracking-[-0.01em]">Your knowledge base is empty.</p>
              <p className="text-sm text-zinc-400 tracking-[-0.01em]">Start by ingesting some data.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate tracking-[-0.01em]">{item.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.source_type}
                      </Badge>
                      <span className="text-xs text-zinc-500 tracking-[-0.01em]">
                        {item.chunk_count} chunks
                      </span>
                      <span className="text-xs text-zinc-400 tracking-[-0.01em]">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
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
