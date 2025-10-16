/**
 * Secure Token Service
 * Handles encrypted OAuth token storage and retrieval for social media connections
 * 
 * SECURITY FEATURES:
 * - Database-level encryption using pgcrypto
 * - Separate encrypted storage table
 * - Audit logging for all token access
 * - Row Level Security (RLS) enforcement
 * - Secure key management
 */

import { supabase } from '@/integrations/supabase/client';

// Extend the type definition for Supabase RPC calls
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc(
      procedure: 'insert_encrypted_tokens_direct',
      parameters: {
        p_connection_id: string;
        p_access_token: string;
        p_refresh_token?: string;
      }
    ): Promise<{ data: any; error: any }>;
    rpc(
      procedure: 'get_decrypted_tokens',
      parameters: {
        p_connection_id: string;
      }
    ): Promise<{ data: any; error: any }>;
  }
}
import { toast } from '@/hooks/use-toast';

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export interface DecryptedTokens {
  access_token: string | null;
  refresh_token: string | null;
}

export class SecureTokenService {
  /**
   * Store OAuth tokens securely with encryption
   */
  static async storeTokens(
    connectionId: string,
    tokenData: TokenData
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate input
      if (!connectionId || !tokenData.access_token) {
        throw new Error('Connection ID and access token are required');
      }

      const { error } = await supabase.rpc('insert_encrypted_tokens_direct', {
        p_connection_id: connectionId,
        p_access_token: tokenData.access_token,
        p_refresh_token: tokenData.refresh_token
      });

      if (error) {
        toast({
          title: "Token Storage Failed",
          description: "Failed to securely store authentication tokens.",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Security Error",
        description: "Failed to store tokens securely.",
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Retrieve decrypted OAuth tokens for a connection
   */
  static async getTokens(connectionId: string): Promise<DecryptedTokens | null> {
    try {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      // Get tokens from the encrypted_channel_tokens table
      const { data, error } = await supabase.rpc('get_decrypted_tokens', {
        p_connection_id: connectionId
      });

      if (error) {
        toast({
          title: "Token Retrieval Failed",
          description: "Failed to retrieve authentication tokens.",
          variant: "destructive",
        });
        return null;
      }

      if (!data) {
        return null;
      }
      return {
        access_token: data[0].access_token,
        refresh_token: data[0].refresh_token,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast({
        title: "Security Error",
        description: "Failed to retrieve tokens securely.",
        variant: "destructive",
      });
      return null;
    }
  }

  /**
   * Update access token after refresh (keeps refresh token unchanged)
   */
  static async updateAccessToken(
    connectionId: string,
    newAccessToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First get the current refresh token
      const currentTokens = await this.getTokens(connectionId);
      if (!currentTokens) {
        throw new Error('Could not retrieve current tokens');
      }

      // Store updated tokens
      return await this.storeTokens(connectionId, {
        access_token: newAccessToken,
        refresh_token: currentTokens.refresh_token || undefined
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Delete encrypted tokens for a connection
   */
  static async deleteTokens(connectionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!connectionId) {
        throw new Error('Connection ID is required');
      }

      const { error } = await supabase
        .from('encrypted_tokens')
        .delete()
        .eq('connection_id', connectionId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Validate that a connection has encrypted tokens stored
   */
  static async hasTokens(connectionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('encrypted_tokens')
        .select('connection_id')
        .eq('connection_id', connectionId)
        .single();

      return !error && !!data;

    } catch (error) {
      return false;
    }
  }

  /**
   * Get connection information with decrypted tokens (for authorized operations only)
   */
  //   static async getConnectionWithTokens(connectionId: string) {
  //     try {
  //       const { data, error } = await supabase
  //         .from('channel_connections_with_tokens')
  //         .select('*')
  //         .eq('id', connectionId)
  //         .single();

  //       if (error) {
  //         console.error('Error fetching connection with tokens:', error);
  //         return null;
  //       }

  //       return data;

  //     } catch (error) {
  //       console.error('Get connection with tokens error:', error);
  //       return null;
  //     }
  //   }

  //   /**
  //    * Audit token access for security monitoring
  //    */
  //   static async getTokenAccessAudit(connectionId?: string) {
  //     try {
  //       let query = supabase
  //         .from('token_access_audit')
  //         .select('*')
  //         .order('timestamp', { ascending: false });

  //       if (connectionId) {
  //         query = query.eq('connection_id', connectionId);
  //       }

  //       const { data, error } = await query.limit(100);

  //       if (error) {
  //         console.error('Error fetching token audit:', error);
  //         return [];
  //       }

  //       return data || [];

  //     } catch (error) {
  //       console.error('Get token audit error:', error);
  //       return [];
  //     }
  //   }
}

export default SecureTokenService;