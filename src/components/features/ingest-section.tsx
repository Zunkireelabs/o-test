'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Upload, Loader2, Check, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

export function IngestSection() {
  const [activeTab, setActiveTab] = useState('url');

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 tracking-[-0.025em]">Ingest Data</h1>
        <p className="text-sm text-zinc-500 mt-1.5 tracking-[-0.01em]">
          Add content to your knowledge base via URL, text, or file upload.
        </p>
      </div>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader className="pb-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="url">URL</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="file">Files</TabsTrigger>
              <TabsTrigger value="apikeys">API Keys</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent className="pt-6">
            <TabsContent value="url" className="mt-0">
              <UrlIngestForm />
            </TabsContent>
            <TabsContent value="text" className="mt-0">
              <TextIngestForm />
            </TabsContent>
            <TabsContent value="file" className="mt-0">
              <FileIngestForm />
            </TabsContent>
            <TabsContent value="apikeys" className="mt-0">
              <ApiKeysForm />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}

function UrlIngestForm() {
  const [url, setUrl] = useState('');
  const [maxPages, setMaxPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      await api.ingestUrl(url, maxPages);
      setStatus('success');
      setMessage('URL ingestion started successfully');
      setUrl('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to ingest URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">URL to Crawl</Label>
        <Input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://yoursite.com/about"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="maxPages">Max Pages</Label>
        <Input
          id="maxPages"
          type="number"
          value={maxPages}
          onChange={(e) => setMaxPages(Number(e.target.value))}
          min={1}
          max={50}
        />
      </div>
      {status !== 'idle' && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg text-sm',
            status === 'success' && 'bg-green-50 text-green-700',
            status === 'error' && 'bg-red-50 text-red-700'
          )}
        >
          {status === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message}
        </div>
      )}
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Ingest URL
      </Button>
    </form>
  );
}

function TextIngestForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');

    try {
      await api.ingestText(title, content);
      setStatus('success');
      setMessage('Text ingested successfully');
      setTitle('');
      setContent('');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to ingest text');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="About Us"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your content here..."
          className="min-h-[150px]"
          required
        />
      </div>
      {status !== 'idle' && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg text-sm',
            status === 'success' && 'bg-green-50 text-green-700',
            status === 'error' && 'bg-red-50 text-red-700'
          )}
        >
          {status === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message}
        </div>
      )}
      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Ingest Text
      </Button>
    </form>
  );
}

function FileIngestForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setStatus('idle');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/json': ['.json'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setStatus('idle');

    try {
      await api.ingestFile(file);
      setStatus('success');
      setMessage('File uploaded successfully');
      setFile(null);
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
          isDragActive ? 'border-blue-500 bg-blue-50' : 'border-zinc-200 hover:border-zinc-300'
        )}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
        <p className="text-sm text-zinc-600 tracking-[-0.01em]">
          {isDragActive ? 'Drop the file here' : 'Drop files here or click to browse'}
        </p>
        <p className="text-xs text-zinc-400 mt-1 tracking-[-0.01em]">
          PDF, Word, Excel, PowerPoint, CSV, TXT, images
        </p>
      </div>

      {file && (
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-900 truncate tracking-[-0.01em]">{file.name}</p>
            <p className="text-xs text-zinc-500 tracking-[-0.01em]">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
            Remove
          </Button>
        </div>
      )}

      {status !== 'idle' && (
        <div
          className={cn(
            'flex items-center gap-2 p-3 rounded-lg text-sm',
            status === 'success' && 'bg-green-50 text-green-700',
            status === 'error' && 'bg-red-50 text-red-700'
          )}
        >
          {status === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message}
        </div>
      )}

      <Button onClick={handleUpload} disabled={!file || loading}>
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Upload File
      </Button>
    </div>
  );
}

function ApiKeysForm() {
  const [clientKey, setClientKey] = useState('Loading...');
  const [newKey, setNewKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load API keys on mount
  useState(() => {
    const loadKeys = async () => {
      try {
        const keys = await api.getApiKeys();
        setClientKey(keys.client_key_preview);
        setHasOpenaiKey(keys.openai_key_set);
      } catch {
        setClientKey('Error loading key');
      }
    };
    loadKeys();
  });

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const result = await api.regenerateApiKey();
      setNewKey(result.key);
    } catch {
      alert('Failed to regenerate key');
    } finally {
      setLoading(false);
    }
  };

  const handleSetOpenaiKey = async () => {
    if (!openaiKey.trim()) return;
    setLoading(true);
    try {
      await api.setOpenAIKey(openaiKey);
      setHasOpenaiKey(true);
      setOpenaiKey('');
    } catch {
      alert('Failed to set OpenAI key');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveOpenaiKey = async () => {
    setLoading(true);
    try {
      await api.removeOpenAIKey();
      setHasOpenaiKey(false);
    } catch {
      alert('Failed to remove OpenAI key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Client API Key */}
      <div>
        <h3 className="text-base font-semibold text-zinc-900 mb-1 tracking-[-0.02em]">Client API Key</h3>
        <p className="text-sm text-zinc-500 mb-3 tracking-[-0.01em]">
          Use this key for programmatic API access.
        </p>
        <div className="flex items-center gap-2">
          <Input value={clientKey} readOnly className="font-mono text-sm bg-zinc-50" />
          <Button variant="outline" onClick={() => navigator.clipboard.writeText(clientKey)}>
            Copy
          </Button>
        </div>
        {newKey && (
          <div className="mt-3 p-3 bg-emerald-50 rounded-xl">
            <p className="text-sm text-emerald-700 mb-2 tracking-[-0.01em]">New key generated. Copy it now.</p>
            <div className="flex items-center gap-2">
              <Input value={newKey} readOnly className="font-mono text-sm bg-white" />
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(newKey)}>
                Copy
              </Button>
            </div>
          </div>
        )}
        <Button
          variant="destructive"
          size="sm"
          className="mt-3"
          onClick={handleRegenerate}
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Regenerate Key
        </Button>
      </div>

      {/* OpenAI Key */}
      <div>
        <h3 className="text-base font-semibold text-zinc-900 mb-1 tracking-[-0.02em]">OpenAI API Key</h3>
        <p className="text-sm text-zinc-500 mb-3 tracking-[-0.01em]">
          {hasOpenaiKey
            ? 'Your OpenAI key is configured.'
            : 'Add your OpenAI key for enhanced features.'}
        </p>
        {hasOpenaiKey ? (
          <Button variant="destructive" size="sm" onClick={handleRemoveOpenaiKey} disabled={loading}>
            Remove OpenAI Key
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="font-mono text-sm"
            />
            <Button onClick={handleSetOpenaiKey} disabled={loading || !openaiKey.trim()}>
              Save
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
