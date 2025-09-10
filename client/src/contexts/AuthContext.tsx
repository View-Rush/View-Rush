import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../lib/api-client';

interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  youtube_channel_id?: string;
  youtube_channel_name?: string;
  youtube_subscriber_count?: number;
  youtube_connected_at?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: (googleToken?: string) => Promise<void>;
  signOut: () => Promise<void>;
  connectYouTube: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const clearError = () => setError(null);

  const checkUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
        const profile = await apiClient.getCurrentUser();
        setUser(profile);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      localStorage.removeItem('auth_token');
      setError('Session expired. Please sign in again.');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (googleToken?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!googleToken) {
        // Mock implementation for demonstration
        const mockUser: User = {
          id: 'mock-user-123',
          email: 'user@example.com',
          full_name: 'Test User',
          avatar_url: 'https://via.placeholder.com/150'
        };
        
        const mockToken = 'mock-jwt-token-' + Date.now();
        apiClient.setToken(mockToken);
        setUser(mockUser);
        return;
      }
      
      const response = await apiClient.loginWithGoogle(googleToken);
      setUser(response.user);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      apiClient.clearToken();
      setUser(null);
    }
  };

  const connectYouTube = async () => {
    try {
      setError(null);
      // Mock YouTube connection
      const mockYouTubeData = {
        youtube_channel_id: 'UCmockchannelid',
        youtube_channel_name: 'Mock Channel',
        youtube_subscriber_count: 1500,
        youtube_connected_at: new Date().toISOString()
      };
      
      if (user) {
        setUser({ ...user, ...mockYouTubeData });
      }
    } catch (error) {
      console.error('Error connecting YouTube:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect YouTube');
      throw error;
    }
  };

  const refreshProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const profile = await apiClient.getCurrentUser();
        setUser(profile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh profile');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      setError(null);
      const updatedUser = await apiClient.updateUserProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
      throw error;
    }
  };

  const value = {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
    connectYouTube,
    refreshProfile,
    updateProfile,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
