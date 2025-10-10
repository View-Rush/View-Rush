import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';
type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];
type ChannelConnectionInsert = Database['public']['Tables']['channel_connections']['Insert'];

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error("Missing Supabase environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

export interface ConnectionData {
  channel_avatar_url: string;
  channel_handle: string;
  channel_id: string;
  channel_name: string;
  metadata: {
    statistics: Record<string, any>;
    description: string;
    branding: Record<string, any>;
  };
  platform: string;
  scope_granted: string[];
  sync_status: string;
  token_expires_at: string;
  tokens_encrypted: boolean;
  user_id: string;
}

export interface TestInsertionResult {
  success: boolean;
  data: any;
  error: any;
}

export async function testChannelInsertion(customData: ChannelConnectionInsert | null = null): Promise<TestInsertionResult> {
  const connectionData = customData || {
    "channel_avatar_url": "https://yt3.ggpht.com/LchtKJqZEt6WnVIXbo55SfUp5Lc31-vnZmj_-GfvIguGarxZnKjvhfZ_gv5Ai18LwRyZFYL5gQ=s800-c-k-c0x00ffffff-no-rj",
    "channel_handle": "@madhushankhades9811",
    "channel_id": "UCbuX1ZkMOWyFU1Cw1Ei0XYA",
    "channel_name": "Madhushankhades",
    "metadata": {
        "statistics": {},
        "description": "Talking ",
        "branding": {}
    },
    "platform": "youtube",
    "scope_granted": [
        "https://www.googleapis.com/auth/youtube.readonly",
        "https://www.googleapis.com/auth/youtube.force-ssl"
    ],
    "sync_status": "pending",
    "token_expires_at": "2025-09-24T12:41:12.223Z",
    "tokens_encrypted": true,
    "user_id": "1a6acc7f-6c48-492e-9e45-5e5e6260ff97"
  };

  try {
    const { data: insertedConnection, error: insertError } = await supabase
      .from('channel_connections')
      .insert(connectionData)
      .select('*')
      .single();

    console.log('Inserted Connection:', insertedConnection);
    console.log('Insert Error:', insertError);

    return {
      success: !insertError,
      data: insertedConnection,
      error: insertError
    };
  } catch (error) {
    console.error('Test insertion failed:', error);
    return {
      success: false,
      data: null,
      error: error
    };
  }
}

export const defaultConnectionData: ChannelConnectionInsert = {
  "channel_avatar_url": "https://yt3.ggpht.com/LchtKJqZEt6WnVIXbo55SfUp5Lc31-vnZmj_-GfvIguGarxZnKjvhfZ_gv5Ai18LwRyZFYL5gQ=s800-c-k-c0x00ffffff-no-rj",
  "channel_handle": "@madhushankhades9811",
  "channel_id": "UCbuX1ZkMOWyFU1Cw1Ei0XYA",
  "channel_name": "Madhushankhades",
  "metadata": {
      "statistics": {},
      "description": "Talking ",
      "branding": {}
  },
  "platform": "youtube",
  "scope_granted": [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/youtube.force-ssl"
  ],
  "sync_status": "pending",
  "token_expires_at": "2025-09-24T12:41:12.223Z",
  "tokens_encrypted": true,
  "user_id": "1a6acc7f-6c48-492e-9e45-5e5e6260ff97"
};
