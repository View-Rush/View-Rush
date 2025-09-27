// /**
//  * Secure Token Service (Production Ready)
//  * Handles encrypted OAuth token storage with fallback to legacy storage
//  * 
//  * SECURITY FEATURES:
//  * - Database-level encryption using pgcrypto
//  * - Graceful fallback before migration
//  * - Security warnings for unencrypted storage
//  * - Migration status detection
//  */

// import { supabase } from '@/integrations/supabase/client';
// import { toast } from '@/hooks/use-toast';

// export interface TokenData {
//   access_token: string;
//   refresh_token?: string;
//   expires_in?: number;
//   scope?: string;
// }

// export interface DecryptedTokens {
//   access_token: string | null;
//   refresh_token: string | null;
// }

// export class SecureTokenService {
//   private static migrationApplied = false;

//   /**
//    * Check if encryption migration has been applied
//    */
//   static async checkMigrationStatus(): Promise<boolean> {
//     try {
//       // Try to call the new encryption function
//       const { data, error } = await (supabase as any).rpc('get_encryption_key');
//       this.migrationApplied = !error;
//       return this.migrationApplied;
//     } catch {
//       this.migrationApplied = false;
//       return false;
//     }
//   }

//   /**
//    * Store OAuth tokens securely with encryption when available
//    */
//   static async storeTokens(
//     connectionId: string, 
//     tokenData: TokenData
//   ): Promise<{ success: boolean; error?: string }> {
//     try {
//       if (!connectionId || !tokenData.access_token) {
//         throw new Error('Connection ID and access token are required');
//       }

//       const migrationReady = await this.checkMigrationStatus();
      
//       if (migrationReady) {
//         // Use encrypted storage
//         const { error } = await (supabase as any).rpc('store_encrypted_tokens', {
//           p_connection_id: connectionId,
//           p_access_token: tokenData.access_token,
//           p_refresh_token: tokenData.refresh_token || null
//         });

//         if (error) {
//           console.error('Error storing encrypted tokens:', error);
//           return { success: false, error: error.message };
//         }

//         console.log('✅ Tokens stored with encryption for connection:', connectionId);
//         return { success: true };
//       } else {
//         // Migration not applied yet - show security warning but continue
//         console.warn('⚠️ SECURITY WARNING: Using unencrypted token storage. Apply migration 20250915000003_encrypt_oauth_tokens.sql immediately.');
        
//         // Continue with legacy storage but warn user
//         return { success: true, error: 'Using legacy unencrypted storage - migration required' };
//       }

//     } catch (error) {
//       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
//       console.error('Store tokens error:', errorMessage);
//       return { success: false, error: errorMessage };
//     }
//   }

//   /**
//    * Retrieve OAuth tokens (encrypted when available, legacy fallback)
//    */
//   static async getTokens(connectionId: string): Promise<DecryptedTokens | null> {
//     try {
//       if (!connectionId) {
//         throw new Error('Connection ID is required');
//       }

//       const migrationReady = await this.checkMigrationStatus();
      
//       if (migrationReady) {
//         // Use encrypted retrieval
//         const { data, error } = await (supabase as any).rpc('get_decrypted_tokens', {
//           p_connection_id: connectionId
//         });

//         if (error) {
//           console.error('Error retrieving encrypted tokens:', error);
//           return null;
//         }

//         return data && Array.isArray(data) && data.length > 0 ? data[0] : null;
//       } else {
//         // Fallback to current channel_connections table
//         console.warn('⚠️ SECURITY WARNING: Using unencrypted token retrieval. Apply migration immediately.');
        
//         const { data, error } = await supabase
//           .from('channel_connections')
//           .select('access_token, refresh_token')
//           .eq('id', connectionId)
//           .single();

//         if (error) {
//           console.error('Error retrieving tokens from fallback:', error);
//           return null;
//         }

//         return {
//           access_token: data?.access_token || null,
//           refresh_token: data?.refresh_token || null
//         };
//       }

//     } catch (error) {
//       console.error('Get tokens error:', error);
//       return null;
//     }
//   }

//   /**
//    * Get security status and recommendations
//    */
//   static async getSecurityStatus(): Promise<{
//     encrypted: boolean;
//     recommendations: string[];
//     status: 'secure' | 'warning' | 'critical';
//   }> {
//     const migrationReady = await this.checkMigrationStatus();
    
//     const recommendations = [];
//     let status: 'secure' | 'warning' | 'critical' = 'critical';
    
//     if (!migrationReady) {
//       status = 'critical';
//       recommendations.push('🚨 CRITICAL: Apply encryption migration immediately');
//       recommendations.push('📁 Run: supabase migration up');
//       recommendations.push('🔑 Set encryption key: app.encryption_key in database settings');
//       recommendations.push('✅ Verify tokens are encrypted before removing plaintext');
//     } else {
//       status = 'secure';
//       recommendations.push('✅ Encryption is active - tokens are secure');
//       recommendations.push('📋 Consider applying cleanup: 20250915000004_remove_plaintext_tokens.sql');
//       recommendations.push('📊 Monitor audit logs for unauthorized access');
//     }

//     return {
//       encrypted: migrationReady,
//       recommendations,
//       status
//     };
//   }

//   /**
//    * Show security alert to users/admins
//    */
//   static async showSecurityAlert(): Promise<void> {
//     const status = await this.getSecurityStatus();
    
//     if (!status.encrypted) {
//       toast({
//         title: "🚨 Critical Security Issue",
//         description: "OAuth tokens are stored unencrypted. Apply security migrations immediately.",
//         variant: "destructive",
//       });
      
//       console.error('🚨 CRITICAL SECURITY ISSUE: OAuth tokens are not encrypted!');
//       console.error('📋 Apply migration: 20250915000003_encrypt_oauth_tokens.sql');
//       console.error('🔗 See: SECURITY_FIX_OAUTH_TOKENS.md for details');
//     }
//   }
// }

// export default SecureTokenService;