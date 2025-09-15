import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { authService, SignUpData, SignInData } from '@/services/auth';
import { storageService } from '@/services/storageService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'github' | 'discord') => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use function declaration instead of arrow function for better Fast Refresh compatibility
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Use function declaration for the component as well for better Fast Refresh compatibility
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session?.user?.email || 'no user');
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('Handling SIGNED_OUT event');
          setSession(null);
          setUser(null);
          setLoading(false);
          
          // Clear auth-related storage when signed out
          const authKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('supabase.auth.') || 
            key.includes('auth') || 
            key.includes('token') ||
            key.includes('session')
          );
          authKeys.forEach(key => localStorage.removeItem(key));
          sessionStorage.clear();
          
          // Navigate to home only if we're on a protected route
          setTimeout(() => {
            const protectedRoutes = ['/dashboard', '/analytics', '/profile', '/settings', '/trending'];
            if (protectedRoutes.some(route => window.location.pathname.startsWith(route))) {
              navigate('/');
            }
          }, 100);
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Handling SIGNED_IN event for:', session.user.email);
          setSession(session);
          setUser(session.user);
          setLoading(false);
          
          // Initialize user profile in Supabase
          try {
            await storageService.updateUserProfile({
              user_id: session.user.id,
              display_name: session.user.user_metadata?.display_name || null,
              avatar_url: session.user.user_metadata?.avatar_url || null,
            });
          } catch (error) {
            console.error('Error updating user profile:', error);
          }
          
          // Only navigate if we're currently on auth page
          if (window.location.pathname === '/auth') {
            navigate('/dashboard');
          }
          return;
        }
        
        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('Token refreshed for:', session.user?.email);
          setSession(session);
          setUser(session.user);
          setLoading(false);
          return;
        }
        
        // For any other event, just update the state
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    authService.getSession().then(({ session, error }) => {
      if (!mounted) return;
      
      if (error) {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
      } else {
        console.log('Initial session check:', session?.user?.email || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    const { error } = await authService.signIn({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const signUpData: SignUpData = {
      email,
      password,
      displayName,
    };
    
    const { error } = await authService.signUp(signUpData);
    return { error };
  };

  const signOut = async () => {
    try {
      console.log('SignOut started - Current user:', user?.email);
      console.log('Current localStorage keys:', Object.keys(localStorage));
      
      // First, clear local state to immediately update UI
      setUser(null);
      setSession(null);
      setLoading(false);
      
      // Clear auth-related storage items selectively
      try {
        console.log('Clearing auth-related storage...');
        
        // Get all localStorage keys before clearing
        const allKeys = Object.keys(localStorage);
        console.log('LocalStorage keys before clearing:', allKeys);
        
        // Clear specific Supabase auth keys instead of everything
        const authKeys = allKeys.filter(key => 
          key.startsWith('supabase.auth.') || 
          key.includes('auth') || 
          key.includes('token') ||
          key.includes('session')
        );
        
        authKeys.forEach(key => {
          localStorage.removeItem(key);
          console.log('Removed localStorage key:', key);
        });
        
        // Clear all sessionStorage as it's typically temporary
        sessionStorage.clear();
        
        console.log('Auth storage cleared. Remaining localStorage keys:', Object.keys(localStorage));
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }

      // Try to sign out from Supabase (but don't wait for it)
      console.log('Attempting Supabase signOut...');
      authService.signOut().catch(error => {
        console.error('Supabase signOut failed (non-blocking):', error);
      });

      // Clear any service worker cache or other persistent storage
      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }
      } catch (swError) {
        console.error('Service worker cleanup failed:', swError);
      }

      // Clear IndexedDB (where Supabase might store data)
      try {
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && db.name.includes('supabase')) {
              console.log('Deleting IndexedDB:', db.name);
              indexedDB.deleteDatabase(db.name);
            }
          }
        }
      } catch (idbError) {
        console.error('IndexedDB cleanup failed:', idbError);
      }

      // Force clear cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });

      console.log('All cleanup completed. Forcing navigation...');
      
      // Force a complete page reload to ensure clean state
      window.location.replace('/');
      
    } catch (error) {
      console.error('Critical sign out error:', error);
      
      // Emergency cleanup - force clear everything
      try {
        localStorage.clear();
        sessionStorage.clear();
        setUser(null);
        setSession(null);
        setLoading(false);
      } catch (e) {
        console.error('Emergency cleanup failed:', e);
      }
      
      // Force navigation even if everything fails
      window.location.replace('/');
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'github' | 'discord') => {
    return await authService.signInWithOAuth(provider);
  };

  const resetPassword = async (email: string) => {
    return await authService.resetPassword({ email });
  };

  const updatePassword = async (newPassword: string) => {
    return await authService.updatePassword({ password: '', newPassword });
  };

  const updateProfile = async (updates: any) => {
    const { error } = await authService.updateProfile(updates);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Add display name for better debugging and Fast Refresh compatibility
AuthProvider.displayName = 'AuthProvider';