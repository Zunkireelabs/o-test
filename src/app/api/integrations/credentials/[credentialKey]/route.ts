import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ credentialKey: string }> }
) {
  try {
    const { credentialKey } = await params;

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (admin.from('provider_credentials') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('credential_key', credentialKey)
      .maybeSingle();

    return NextResponse.json({ exists: !!data });
  } catch (err) {
    console.error('Credential check error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ credentialKey: string }> }
) {
  try {
    const { credentialKey } = await params;
    const body = await request.json();
    const { client_id, client_secret } = body;

    if (!client_id || !client_secret) {
      return NextResponse.json(
        { error: 'client_id and client_secret are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: upsertError } = await (admin.from('provider_credentials') as any)
      .upsert(
        {
          user_id: user.id,
          credential_key: credentialKey,
          client_id,
          client_secret,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,credential_key' }
      );

    if (upsertError) {
      console.error('Credential upsert error:', upsertError);
      return NextResponse.json({ error: 'Failed to save credentials' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Credential save error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
