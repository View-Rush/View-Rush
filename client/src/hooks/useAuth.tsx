import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { authService, SignUpData} from '@/services/auth';
import { authHelper } from '@/services/authHelper';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ data: any; error: any }>;
  updatePassword: (newPassword: string) => Promise<{ data: any; error: any }>;
  updateProfile: (updates: any) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function declaration instead of arrow function for better Fast Refresh compatibility
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
          
          // Clear authHelper cache
          authHelper.clearCache();
          
          // Clear auth-related storage when signed out
          const authKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('supabase.auth.') || 
            key.includes('auth') || 
            key.includes('token') ||
            key.includes('session')
          );
          authKeys.forEach(key => localStorage.removeItem(key));
          
          // Clear session storage selectively to preserve OAuth states
          const sessionKeys = Object.keys(sessionStorage).filter(key =>
            key.startsWith('supabase.auth.') ||
            (key.includes('auth') && !key.includes('oauth')) ||
            (key.includes('token') && !key.includes('oauth')) ||
            (key.includes('session') && !key.includes('oauth'))
          );
          sessionKeys.forEach(key => sessionStorage.removeItem(key));
          
          // Only navigate away if this is an actual SIGNED_OUT event (not just no session)
          // and we're currently on a protected route
          if (event === 'SIGNED_OUT') {
            setTimeout(() => {
              const protectedRoutes = ['/dashboard', '/analytics', '/profile', '/settings', '/trending'];
              const currentPath = window.location.pathname;
              
              // Navigate to home only if we're on a protected route
              if (protectedRoutes.some(route => currentPath.startsWith(route))) {
                console.log('Navigating from protected route to home after sign out');
                navigate('/', { replace: true });
              }
            }, 50);
          }
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Handling SIGNED_IN event for:', session.user.email);
          setSession(session);
          setUser(session.user);
          setLoading(false);
          
          // Update authHelper with the authenticated user
          authHelper.setUserFromContext(session.user);
          
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
    const { user, session, error } = await authService.signIn({ email, password });
    
    if (!error && user && session) {
      setUser(user);
      setSession(session);
    }
    
    return { data: error ? { user: null, session: null } : { user, session }, error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const signUpData: SignUpData = {
      email,
      password,
      displayName,
    };
    
    const { user, error } = await authService.signUp(signUpData);
    return { data: error ? null : { user }, error };
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
        
        // Clear session storage selectively to preserve OAuth states
        const sessionKeys = Object.keys(sessionStorage).filter(key =>
          key.startsWith('supabase.auth.') ||
          (key.includes('auth') && !key.includes('oauth')) ||
          (key.includes('token') && !key.includes('oauth')) ||
          (key.includes('session') && !key.includes('oauth'))
        );
        sessionKeys.forEach(key => sessionStorage.removeItem(key));
        
        // Clear YouTube OAuth states on sign-out since user is leaving
        const youtubeOAuthKeys = ['youtube_oauth_state', 'youtube_oauth_user_id'];
        youtubeOAuthKeys.forEach(key => {
          if (sessionStorage.getItem(key)) {
            sessionStorage.removeItem(key);
            console.log('Cleared YouTube OAuth key on sign-out:', key);
          }
        });
        
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

      console.log('All cleanup completed. Navigation will be handled by auth state listener...');
      
      // Let the auth state listener handle navigation, but add a fallback
      setTimeout(() => {
        // Fallback navigation if auth state listener doesn't fire
        const currentPath = window.location.pathname;
        const protectedRoutes = ['/dashboard', '/analytics', '/profile', '/settings', '/trending'];
        
        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          console.log('Fallback navigation: moving from protected route to home');
          navigate('/', { replace: true });
        }
      }, 200); // Give auth state listener time to fire first
      
    } catch (error) {
      console.error('Critical sign out error:', error);
      
      // Emergency cleanup - force clear everything except OAuth states
      try {
        localStorage.clear();
        // Preserve OAuth states in session storage during emergency cleanup
        const oauthStates: { [key: string]: string } = {};
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('oauth')) {
            oauthStates[key] = sessionStorage.getItem(key) || '';
          }
        });
        sessionStorage.clear();
        // Restore OAuth states
        Object.entries(oauthStates).forEach(([key, value]) => {
          sessionStorage.setItem(key, value);
        });
        setUser(null);
        setSession(null);
        setLoading(false);
      } catch (e) {
        console.error('Emergency cleanup failed:', e);
      }
      
      // Emergency navigation only if auth state listener fails
      navigate('/', { replace: true });
      return { error };
    }
    
    return { error: null };
  };

  const resetPassword = async (email: string) => {
    const { error } = await authService.resetPassword({ email });
    return { data: error ? null : {}, error };
  };

  const updatePassword = async (newPassword: string) => {
    const response = await authService.updatePassword({ password: '', newPassword });
    console.log('Update password response:', response);
    return { data: response.error ? null : {}, error: response.error };
  };

  const updateProfile = async (updates: any) => {
    const response = await authService.updateProfile(updates);
    return { data: response.error ? null : { user: response.user || null }, error: response.error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.displayName = 'AuthProvider';