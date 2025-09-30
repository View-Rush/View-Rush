// // Storage service for managing user data, preferences, and app state
// import { supabase } from '@/integrations/supabase/client';
// import { toast } from '@/hooks/use-toast';
// import { connectionStateManager } from '../src/services/connectionStateManager';
// import type { Database } from '@/integrations/supabase/types';

// type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];

// export interface UserPreferences {
//   theme: 'light' | 'dark' | 'system';
//   language: string;
//   timezone: string;
//   notifications: {
//     email: boolean;
//     push: boolean;
//     analytics: boolean;
//     recommendations: boolean;
//   };
//   dashboard_layout: Record<string, any>;
//   analytics_settings: {
//     default_time_range: string;
//     auto_refresh: boolean;
//     refresh_interval: number;
//   };
// }

// export interface UserProfile {
//   id?: string;
//   user_id: string;
//   display_name: string | null;
//   avatar_url: string | null;
//   created_at?: string;
//   updated_at?: string;
// }

// // Export the type from Database for consistency
// export type { ChannelConnection };

// class StorageService {
//   private readonly STORAGE_KEYS = {
//     USER_PREFERENCES: 'view_rush_user_preferences',
//     ANALYTICS_CACHE: 'view_rush_analytics_cache',
//   };

//   // User Preferences Management (localStorage)
//   getUserPreferences(): UserPreferences {
//     try {
//       const saved = localStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
//       if (saved) {
//         return JSON.parse(saved);
//       }
      
//       // Default preferences
//       return {
//         theme: 'system',
//         language: 'en',
//         timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
//         notifications: {
//           email: true,
//           push: true,
//           analytics: true,
//           recommendations: true,
//         },
//         dashboard_layout: {},
//         analytics_settings: {
//           default_time_range: '30d',
//           auto_refresh: true,
//           refresh_interval: 300000, // 5 minutes
//         },
//       };
//     } catch (error) {
//       console.error('Error getting user preferences:', error);
//       return this.getUserPreferences(); // Return defaults
//     }
//   }

//   updateUserPreferences(preferences: Partial<UserPreferences>): void {
//     try {
//       const current = this.getUserPreferences();
//       const updated = { ...current, ...preferences };
      
//       localStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
      
//       toast({
//         title: "Preferences saved",
//         description: "Your preferences have been updated successfully.",
//       });
//     } catch (error) {
//       console.error('Error updating user preferences:', error);
//       toast({
//         title: "Failed to save preferences",
//         description: "There was an error saving your preferences.",
//         variant: "destructive",
//       });
//     }
//   }

//   // User Profile Management (Supabase profiles table)
//   async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('user_id', userId)
//         .single();

//       if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
//         console.error('Error fetching user profile:', error);
//         return { data: null, error };
//       }

//       return { data: data || null, error: null };
//     } catch (error) {
//       console.error('Get user profile error:', error);
//       return { data: null, error };
//     }
//   }

//   async updateUserProfile(profile: Partial<UserProfile> & { user_id: string }): Promise<{ data: UserProfile | null; error: any }> {
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .upsert({
//           user_id: profile.user_id,
//           display_name: profile.display_name,
//           avatar_url: profile.avatar_url,
//           updated_at: new Date().toISOString(),
//         }, { onConflict: 'user_id' })
//         .select()
//         .single();

//       if (error) {
//         toast({
//           title: "Failed to update profile",
//           description: error.message,
//           variant: "destructive",
//         });
//         return { data: null, error };
//       }

//       toast({
//         title: "Profile updated",
//         description: "Your profile has been updated successfully.",
//       });

//       return { data, error: null };
//     } catch (error) {
//       console.error('Update user profile error:', error);
//       return { data: null, error };
//     }
//   }

//   // Channel Connections Management (Supabase)
//   async getChannelConnections(): Promise<ChannelConnection[]> {
//     try {
//       // Check if connection process is in progress and block if so
//       if (connectionStateManager.isConnecting()) {
//         console.log('🔒 getChannelConnections() blocked - connection in progress');
//         return [];
//       }
      
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return [];

//       const { data: connections, error } = await supabase
//         .from('channel_connections')
//         .select('*')
//         .eq('user_id', user.id)
//         .eq('is_active', true)
//         .order('created_at', { ascending: false });

//       if (error) {
//         console.error('Error fetching channel connections:', error);
//         return [];
//       }

//       return connections || [];
//     } catch (error) {
//       console.error('Error getting channel connections:', error);
//       return [];
//     }
//   }

//   async addChannelConnection(connection: Omit<ChannelConnection, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) {
//         toast({
//           title: "Authentication required",
//           description: "Please sign in to connect a channel.",
//           variant: "destructive",
//         });
//         return false;
//       }

//       // Deactivate existing connections for the same platform and channel
//       await supabase
//         .from('channel_connections')
//         .update({ is_active: false })
//         .eq('user_id', user.id)
//         .eq('platform', connection.platform)
//         .eq('channel_id', connection.channel_id);

//       // Insert new connection
//       const { error } = await supabase
//         .from('channel_connections')
//         .insert({
//           ...connection,
//           user_id: user.id,
//         });

//       if (error) {
//         console.error('Error adding channel connection:', error);
//         toast({
//           title: "Failed to connect channel",
//           description: error.message,
//           variant: "destructive",
//         });
//         return false;
//       }

//       toast({
//         title: "Channel connected",
//         description: `Successfully connected ${connection.channel_name}`,
//       });
//       return true;
//     } catch (error) {
//       console.error('Error adding channel connection:', error);
//       toast({
//         title: "Failed to connect channel",
//         description: "There was an error connecting the channel.",
//         variant: "destructive",
//       });
//       return false;
//     }
//   }

//   async removeChannelConnection(connectionId: string): Promise<boolean> {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return false;

//       const { error } = await supabase
//         .from('channel_connections')
//         .update({ is_active: false })
//         .eq('id', connectionId)
//         .eq('user_id', user.id);

//       if (error) {
//         console.error('Error removing channel connection:', error);
//         toast({
//           title: "Failed to disconnect channel",
//           description: error.message,
//           variant: "destructive",
//         });
//         return false;
//       }

//       toast({
//         title: "Channel disconnected",
//         description: "Channel has been disconnected successfully.",
//       });
//       return true;
//     } catch (error) {
//       console.error('Error removing channel connection:', error);
//       toast({
//         title: "Failed to disconnect channel",
//         description: "There was an error disconnecting the channel.",
//         variant: "destructive",
//       });
//       return false;
//     }
//   }

//   // Analytics Cache Management (localStorage)
//   getCachedAnalytics(key: string): any {
//     try {
//       const cache = localStorage.getItem(`${this.STORAGE_KEYS.ANALYTICS_CACHE}_${key}`);
//       if (!cache) return null;

//       const { data, timestamp } = JSON.parse(cache);
//       const preferences = this.getUserPreferences();
//       const cacheAge = Date.now() - timestamp;

//       // Check if cache is still valid based on user preferences
//       if (cacheAge > preferences.analytics_settings.refresh_interval) {
//         this.clearCachedAnalytics(key);
//         return null;
//       }

//       return data;
//     } catch (error) {
//       console.error('Error getting cached analytics:', error);
//       return null;
//     }
//   }

//   setCachedAnalytics(key: string, data: any): void {
//     try {
//       const cache = {
//         data,
//         timestamp: Date.now(),
//       };
      
//       localStorage.setItem(
//         `${this.STORAGE_KEYS.ANALYTICS_CACHE}_${key}`,
//         JSON.stringify(cache)
//       );
//     } catch (error) {
//       console.error('Error setting cached analytics:', error);
//     }
//   }

//   clearCachedAnalytics(key?: string): void {
//     try {
//       if (key) {
//         localStorage.removeItem(`${this.STORAGE_KEYS.ANALYTICS_CACHE}_${key}`);
//       } else {
//         // Clear all analytics cache
//         const keys = Object.keys(localStorage);
//         keys.forEach(k => {
//           if (k.startsWith(this.STORAGE_KEYS.ANALYTICS_CACHE)) {
//             localStorage.removeItem(k);
//           }
//         });
//       }
//     } catch (error) {
//       console.error('Error clearing cached analytics:', error);
//     }
//   }

//   // Data Export
//   async exportUserData(): Promise<any> {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return null;

//       const [profile, connections] = await Promise.all([
//         this.getUserProfile(user.id),
//         this.getChannelConnections(),
//       ]);

//       return {
//         user: {
//           id: user.id,
//           email: user.email,
//           created_at: user.created_at,
//         },
//         profile: profile.data,
//         preferences: this.getUserPreferences(),
//         channelConnections: connections,
//         exportedAt: new Date().toISOString(),
//       };
//     } catch (error) {
//       console.error('Error exporting user data:', error);
//       throw error;
//     }
//   }

//   // Data Clear
//   async clearAllUserData(): Promise<void> {
//     try {
//       const { data: { user } } = await supabase.auth.getUser();
//       if (!user) return;

//       // Clear Supabase data
//       await Promise.all([
//         supabase.from('channel_connections').delete().eq('user_id', user.id),
//         supabase.from('profiles').delete().eq('user_id', user.id),
//       ]);

//       // Clear localStorage
//       Object.values(this.STORAGE_KEYS).forEach(key => {
//         localStorage.removeItem(key);
//       });

//       // Clear analytics cache
//       this.clearCachedAnalytics();

//       toast({
//         title: "Data cleared",
//         description: "All your data has been permanently deleted.",
//       });
//     } catch (error) {
//       console.error('Error clearing user data:', error);
//       toast({
//         title: "Failed to clear data",
//         description: "There was an error clearing your data.",
//         variant: "destructive",
//       });
//     }
//   }
// }

// export const storageService = new StorageService();
