import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { youtubeService } from '@/services/youtube';
import { connectionStateManager } from '@/services/connectionStateManager';
import type { Database } from '@/integrations/supabase/types';

type ChannelConnection = Database['public']['Tables']['channel_connections']['Row'];

export function useChannelConnections() {
  const [connections, setConnections] = useState<ChannelConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const { user, loading: authLoading } = useAuth();

  // Computed properties to help components make decisions
  const hasConnections = connections.length > 0;
  const hasActiveConnections = connections.some(conn => conn.is_active);
  const activeConnectionsCount = connections.filter(conn => conn.is_active).length;

  const loadConnections = async (forceRefresh = false) => {
    try {
      console.log('Loading connections...');
      console.log('Auth state - User:', user?.email, 'Auth loading:', authLoading);
      
      // Don't proceed if auth is still loading or user is not authenticated
      if (authLoading) {
        console.log('Auth still loading, skipping connection load');
        return;
      }
      
      if (!user) {
        console.log('No authenticated user, clearing connections');
        setConnections([]);
        setLoading(false);
        return;
      }
      
      // Prevent redundant calls within 3 seconds unless forced
      const now = Date.now();
      if (!forceRefresh && (now - lastLoadTime) < 3000) {
        console.log('Skipping connection load, recent data available');
        setLoading(false);
        return;
      }
      
      // Check if connection process is in progress and block if so
      if (connectionStateManager.isConnecting()) {
        console.log('loadConnections() blocked - connection in progress');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      // Create a promise that rejects after 2 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Channel connections loading timeout after 2 seconds'));
        }, 2000);
      });

      try {
        // Race the API call against the timeout
        const userConnections = await Promise.race([
          youtubeService.getUserConnections(),
          timeoutPromise
        ]);
        
        console.log('Connections loaded:', userConnections.length);
        setConnections(userConnections);
        setLastLoadTime(Date.now()); // Update cache timestamp
      } catch (timeoutError) {
        if (timeoutError instanceof Error && timeoutError.message.includes('timeout')) {
          console.warn('Channel connections loading timed out after 2 seconds');
          setConnections([]); // Set empty array on timeout
          toast({
            title: "Loading timeout",
            description: "Channel connections are taking longer than expected. Please try refreshing.",
            variant: "destructive",
          });
        } else {
          throw timeoutError; // Re-throw non-timeout errors
        }
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      toast({
        title: "Error",
        description: "Failed to load channel connections.",
        variant: "destructive",
      });
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const connectChannel = async () => {
    try {
      console.log('Connect channel button clicked');
      setConnecting(true);
      
      const connectionTimeout = setTimeout(() => {
        console.log('Connection timeout reached, resetting connecting state');
        setConnecting(false);
      }, 5000);

      console.log('Calling youtubeService.connectAccount()');
      await youtubeService.connectAccount();
      console.log('youtubeService.connectAccount() completed');
      
      // Clear the timeout if we reach this point successfully
      clearTimeout(connectionTimeout);
    } catch (error) {
      console.error('YouTube connection error:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect YouTube channel. Please try again.",
        variant: "destructive",
      });
    } finally {
      console.log('Setting connecting to false');
      setConnecting(false);
    }
  };

  const disconnectChannel = async (connectionId: string) => {
    try {
      await youtubeService.disconnectAccount(connectionId);
      await loadConnections(true); // Force refresh after disconnect
      toast({
        title: "Channel Disconnected",
        description: "YouTube channel has been disconnected successfully.",
      });
    } catch (error) {
      console.error('Error disconnecting channel:', error);
      toast({
        title: "Disconnection Failed",
        description: "Failed to disconnect channel. Please try again.",
        variant: "destructive",
      });
    }
  };

  const refreshConnection = async () => {
    try {
      await youtubeService.syncChannelAnalytics();
      await loadConnections(true); // Force refresh after sync
      toast({
        title: "Data Refreshed",
        description: "Channel data has been refreshed successfully.",
      });
    } catch (error) {
      console.error('Error refreshing connection:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh channel data.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('useChannelConnections useEffect triggered - User:', user?.email, 'Auth loading:', authLoading);
    
    // Reset connecting state on mount in case we returned from OAuth redirect
    setConnecting(false);
    
    loadConnections();
  }, [user, authLoading]); // Depend on user and authLoading state

  return {
    connections,
    loading,
    connecting,
    loadConnections,
    connectChannel,
    disconnectChannel,
    refreshConnection,
    hasConnections,
    hasActiveConnections,
    activeConnectionsCount
  };
}
