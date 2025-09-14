// Storage service for managing user data, preferences, and app state
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    analytics: boolean;
    recommendations: boolean;
  };
  dashboard_layout: Record<string, any>;
  analytics_settings: {
    default_time_range: string;
    auto_refresh: boolean;
    refresh_interval: number;
  };
}

export interface UserProfile {
  id?: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ChannelConnection {
  id: string;
  platform: 'youtube' | 'tiktok' | 'instagram';
  channel_id: string;
  channel_name: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  connected_at: string;
}

class StorageService {
  private readonly STORAGE_KEYS = {
    USER_PREFERENCES: 'view_rush_user_preferences',
    CHANNEL_CONNECTIONS: 'view_rush_channel_connections',
    ANALYTICS_CACHE: 'view_rush_analytics_cache',
  };

  // User Preferences Management (localStorage)
  getUserPreferences(): UserPreferences {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.USER_PREFERENCES);
      if (saved) {
        return JSON.parse(saved);
      }
      
      // Default preferences
      return {
        theme: 'system',
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        notifications: {
          email: true,
          push: true,
          analytics: true,
          recommendations: true,
        },
        dashboard_layout: {},
        analytics_settings: {
          default_time_range: '30d',
          auto_refresh: true,
          refresh_interval: 300000, // 5 minutes
        },
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getUserPreferences(); // Return defaults
    }
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    try {
      const current = this.getUserPreferences();
      const updated = { ...current, ...preferences };
      
      localStorage.setItem(this.STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
      
      toast({
        title: "Preferences saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      toast({
        title: "Failed to save preferences",
        description: "There was an error saving your preferences.",
        variant: "destructive",
      });
    }
  }

  // User Profile Management (Supabase)
  async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user profile:', error);
        return { data: null, error };
      }

      return { data: data || null, error: null };
    } catch (error) {
      console.error('Get user profile error:', error);
      return { data: null, error };
    }
  }

  async updateUserProfile(profile: Partial<UserProfile> & { user_id: string }): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: profile.user_id,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        toast({
          title: "Failed to update profile",
          description: error.message,
          variant: "destructive",
        });
        return { data: null, error };
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      return { data, error: null };
    } catch (error) {
      console.error('Update user profile error:', error);
      return { data: null, error };
    }
  }

  // Channel Connections Management (localStorage)
  getChannelConnections(): ChannelConnection[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEYS.CHANNEL_CONNECTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error getting channel connections:', error);
      return [];
    }
  }

  addChannelConnection(connection: Omit<ChannelConnection, 'id' | 'connected_at'>): void {
    try {
      const connections = this.getChannelConnections();
      const newConnection: ChannelConnection = {
        ...connection,
        id: `${connection.platform}_${connection.channel_id}_${Date.now()}`,
        connected_at: new Date().toISOString(),
      };
      
      // Remove existing connection for same channel if exists
      const filtered = connections.filter(
        c => !(c.platform === connection.platform && c.channel_id === connection.channel_id)
      );
      
      filtered.push(newConnection);
      localStorage.setItem(this.STORAGE_KEYS.CHANNEL_CONNECTIONS, JSON.stringify(filtered));
      
      toast({
        title: "Channel connected",
        description: `Successfully connected ${connection.channel_name}`,
      });
    } catch (error) {
      console.error('Error adding channel connection:', error);
      toast({
        title: "Failed to connect channel",
        description: "There was an error connecting the channel.",
        variant: "destructive",
      });
    }
  }

  updateChannelConnection(id: string, updates: Partial<ChannelConnection>): void {
    try {
      const connections = this.getChannelConnections();
      const index = connections.findIndex(c => c.id === id);
      
      if (index !== -1) {
        connections[index] = { ...connections[index], ...updates };
        localStorage.setItem(this.STORAGE_KEYS.CHANNEL_CONNECTIONS, JSON.stringify(connections));
      }
    } catch (error) {
      console.error('Error updating channel connection:', error);
    }
  }

  removeChannelConnection(id: string): void {
    try {
      const connections = this.getChannelConnections();
      const filtered = connections.filter(c => c.id !== id);
      
      localStorage.setItem(this.STORAGE_KEYS.CHANNEL_CONNECTIONS, JSON.stringify(filtered));
      
      toast({
        title: "Channel disconnected",
        description: "Channel has been disconnected successfully.",
      });
    } catch (error) {
      console.error('Error removing channel connection:', error);
      toast({
        title: "Failed to disconnect channel",
        description: "There was an error disconnecting the channel.",
        variant: "destructive",
      });
    }
  }

  // Analytics Cache Management (localStorage)
  getCachedAnalytics(key: string): any | null {
    try {
      const cache = localStorage.getItem(this.STORAGE_KEYS.ANALYTICS_CACHE);
      const parsedCache = cache ? JSON.parse(cache) : {};
      
      const cached = parsedCache[key];
      if (cached && cached.expiry > Date.now()) {
        return cached.data;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting cached analytics:', error);
      return null;
    }
  }

  setCachedAnalytics(key: string, data: any, ttlMinutes: number = 30): void {
    try {
      const cache = localStorage.getItem(this.STORAGE_KEYS.ANALYTICS_CACHE);
      const parsedCache = cache ? JSON.parse(cache) : {};
      
      parsedCache[key] = {
        data,
        expiry: Date.now() + (ttlMinutes * 60 * 1000),
      };
      
      localStorage.setItem(this.STORAGE_KEYS.ANALYTICS_CACHE, JSON.stringify(parsedCache));
    } catch (error) {
      console.error('Error setting cached analytics:', error);
    }
  }

  clearCachedAnalytics(key?: string): void {
    try {
      if (key) {
        const cache = localStorage.getItem(this.STORAGE_KEYS.ANALYTICS_CACHE);
        const parsedCache = cache ? JSON.parse(cache) : {};
        delete parsedCache[key];
        localStorage.setItem(this.STORAGE_KEYS.ANALYTICS_CACHE, JSON.stringify(parsedCache));
      } else {
        localStorage.removeItem(this.STORAGE_KEYS.ANALYTICS_CACHE);
      }
    } catch (error) {
      console.error('Error clearing cached analytics:', error);
    }
  }

  // File Storage
  async uploadFile(
    bucket: string,
    fileName: string,
    file: File,
    options?: { upsert?: boolean; contentType?: string }
  ): Promise<{ data: { path: string } | null; error: any }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          upsert: options?.upsert || false,
          contentType: options?.contentType || file.type,
        });

      if (error) {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive",
        });
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Upload file error:', error);
      return { data: null, error };
    }
  }

  async getFileUrl(bucket: string, fileName: string): Promise<{ data: { publicUrl: string } | null; error: any }> {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return { data, error: null };
    } catch (error) {
      console.error('Get file URL error:', error);
      return { data: null, error };
    }
  }

  async deleteFile(bucket: string, fileName: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error('Error deleting file:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Delete file error:', error);
      return { error };
    }
  }

  // Data management utilities
  clearAllLocalData(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      toast({
        title: "Data cleared",
        description: "All local data has been cleared successfully.",
      });
    } catch (error) {
      console.error('Error clearing local data:', error);
      toast({
        title: "Failed to clear data",
        description: "There was an error clearing local data.",
        variant: "destructive",
      });
    }
  }

  exportUserData(): string {
    try {
      const data = {
        preferences: this.getUserPreferences(),
        channelConnections: this.getChannelConnections(),
        exportedAt: new Date().toISOString(),
      };
      
      return JSON.stringify(data, null, 2);
    } catch (error) {
      console.error('Error exporting user data:', error);
      throw error;
    }
  }

  importUserData(dataString: string): void {
    try {
      const data = JSON.parse(dataString);
      
      if (data.preferences) {
        this.updateUserPreferences(data.preferences);
      }
      
      if (data.channelConnections) {
        localStorage.setItem(this.STORAGE_KEYS.CHANNEL_CONNECTIONS, JSON.stringify(data.channelConnections));
      }
      
      toast({
        title: "Data imported",
        description: "User data has been imported successfully.",
      });
    } catch (error) {
      console.error('Error importing user data:', error);
      toast({
        title: "Import failed",
        description: "There was an error importing the data.",
        variant: "destructive",
      });
    }
  }
}

export const storageService = new StorageService();
