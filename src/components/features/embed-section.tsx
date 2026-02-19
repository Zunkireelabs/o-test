'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Copy, Check, Loader2, Code } from 'lucide-react';

export function EmbedSection() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadEmbedCode = async () => {
      try {
        const data = await api.getEmbedCode();
        setCode(data.code || '');
      } catch (err) {
        console.error('Failed to load embed code:', err);
      } finally {
        setLoading(false);
      }
    };
    loadEmbedCode();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Embed Code</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add this code to your website to display the chat widget.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : code ? (
            <div className="space-y-4">
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm">
                  <code>{code}</code>
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-1">How to use</h3>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Copy the code above</li>
                  <li>Paste it before the closing <code className="bg-blue-100 px-1 rounded">&lt;/body&gt;</code> tag</li>
                  <li>The widget will appear on your website</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Code className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No embed code available.</p>
              <p className="text-sm text-gray-400">Configure your widget first.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
