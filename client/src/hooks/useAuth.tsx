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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_OUT' || !session) {
          setSession(null);
          setUser(null);
          setLoading(false);
          
          authHelper.clearCache();
          
          const authKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('supabase.auth.') || 
            key.includes('auth') || 
            key.includes('token') ||
            key.includes('session')
          );
          authKeys.forEach(key => localStorage.removeItem(key));
          
          const sessionKeys = Object.keys(sessionStorage).filter(key =>
            key.startsWith('supabase.auth.') ||
            (key.includes('auth') && !key.includes('oauth')) ||
            (key.includes('token') && !key.includes('oauth')) ||
            (key.includes('session') && !key.includes('oauth'))
          );
          sessionKeys.forEach(key => sessionStorage.removeItem(key));
          
          // and we're currently on a protected route
          if (event === 'SIGNED_OUT') {
            setTimeout(() => {
              const protectedRoutes = ['/dashboard', '/analytics', '/profile', '/settings', '/trending'];
              const currentPath = window.location.pathname;
              
              // Navigate to home only if we're on a protected route
              if (protectedRoutes.some(route => currentPath.startsWith(route))) {
                navigate('/', { replace: true });
              }
            }, 50);
          }
          return;
        }
        
        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session);
          setUser(session.user);
          setLoading(false);
          
          authHelper.setUserFromContext(session.user);
          
          if (window.location.pathname === '/auth') {
            navigate('/dashboard');
          }
          return;
        }
        
        if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
          setUser(session.user);
          setLoading(false);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    authService.getSession().then(({ session, error }) => {
      if (!mounted) return;
      
      if (error) {
        setSession(null);
        setUser(null);
      } else {
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
      setUser(null);
      setSession(null);
      setLoading(false);
      
      try {
        // Get all localStorage keys before clearing
        const allKeys = Object.keys(localStorage);
        
        // Clear specific Supabase auth keys instead of everything
        const authKeys = allKeys.filter(key => 
          key.startsWith('supabase.auth.') || 
          key.includes('auth') || 
          key.includes('token') ||
          key.includes('session')
        );
        
        authKeys.forEach(key => {
          localStorage.removeItem(key);
        });
        
        const sessionKeys = Object.keys(sessionStorage).filter(key =>
          key.startsWith('supabase.auth.') ||
          (key.includes('auth') && !key.includes('oauth')) ||
          (key.includes('token') && !key.includes('oauth')) ||
          (key.includes('session') && !key.includes('oauth'))
        );
        sessionKeys.forEach(key => sessionStorage.removeItem(key));
        
        const youtubeOAuthKeys = ['youtube_oauth_state', 'youtube_oauth_user_id'];
        youtubeOAuthKeys.forEach(key => {
          if (sessionStorage.getItem(key)) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (storageError) {
        console.error('Error clearing storage:', storageError);
      }

      authService.signOut().catch(error => {
        console.error('Supabase signOut failed (non-blocking):', error);
      });

      try {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
          }
        }
      } catch (swError) {
      }

      try {
        if ('indexedDB' in window) {
          const databases = await indexedDB.databases();
          for (const db of databases) {
            if (db.name && db.name.includes('supabase')) {
              indexedDB.deleteDatabase(db.name);
            }
          }
        }
      } catch (idbError) {
      }

      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });

      setTimeout(() => {
        const currentPath = window.location.pathname;
        const protectedRoutes = ['/dashboard', '/analytics', '/profile', '/settings', '/trending'];
        
        if (protectedRoutes.some(route => currentPath.startsWith(route))) {
          navigate('/', { replace: true });
        }
      }, 200); // Give auth state listener time to fire first
      
    } catch (error) {
      try {
        localStorage.clear();
        const oauthStates: { [key: string]: string } = {};
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('oauth')) {
            oauthStates[key] = sessionStorage.getItem(key) || '';
          }
        });
        sessionStorage.clear();
        Object.entries(oauthStates).forEach(([key, value]) => {
          sessionStorage.setItem(key, value);
        });
        setUser(null);
        setSession(null);
        setLoading(false);
      } catch (e) {
        console.error('Emergency cleanup failed:', e);
      }
      
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
