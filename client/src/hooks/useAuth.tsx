import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { authService, SignUpData, SignInData } from '@/services/auth';
import { storageService } from '@/services/storage';

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Initialize user profile in Supabase
          await storageService.updateUserProfile({
            user_id: session.user.id,
            display_name: session.user.user_metadata?.display_name || null,
            avatar_url: session.user.user_metadata?.avatar_url || null,
          });
          
          navigate('/dashboard');
        }
        
        if (event === 'SIGNED_OUT') {
          navigate('/');
        }
      }
    );

    // Check for existing session
    authService.getSession().then(({ session }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
      // Clear local state immediately
      setUser(null);
      setSession(null);
      
      // Clear any cached data in localStorage
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-authorization');
      
      // Call auth service to sign out from Supabase
      await authService.signOut();
      
      // Force reload to ensure all state is cleared
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear local state and navigate
      setUser(null);
      setSession(null);
      localStorage.removeItem('supabase.auth.token');
      localStorage.removeItem('sb-authorization');
      window.location.href = '/';
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
};