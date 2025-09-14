// Enhanced authentication service with full client-side auth management
import { supabase } from '@/integrations/supabase/client';
import { User, Session, AuthResponse } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
  newPassword: string;
}

class AuthService {
  // Sign up new user
  async signUp(data: SignUpData): Promise<{ user: User | null; error: any }> {
    try {
      const { email, password, displayName, firstName, lastName, metadata = {} } = data;
      
      // Prepare user metadata
      const userMetadata = {
        display_name: displayName,
        first_name: firstName,
        last_name: lastName,
        ...metadata,
      };

      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userMetadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (response.error) {
        toast({
          title: "Sign up failed",
          description: response.error.message,
          variant: "destructive",
        });
        return { user: null, error: response.error };
      }

      if (response.data.user && !response.data.user.email_confirmed_at) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
      }

      return { user: response.data.user, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { user: null, error };
    }
  }

  // Sign in existing user
  async signIn(data: SignInData): Promise<{ user: User | null; session: Session | null; error: any }> {
    try {
      const { email, password } = data;
      
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        toast({
          title: "Sign in failed",
          description: response.error.message,
          variant: "destructive",
        });
        return { user: null, session: null, error: response.error };
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return { 
        user: response.data.user, 
        session: response.data.session, 
        error: null 
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { user: null, session: null, error };
    }
  }

  // Sign out user
  async signOut(): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });

      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  }

  // OAuth sign in (Google, GitHub, etc.)
  async signInWithOAuth(provider: 'google' | 'github' | 'discord'): Promise<{ error: any }> {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: "OAuth sign in failed",
          description: error.message,
          variant: "destructive",
        });
      }

      return { error };
    } catch (error) {
      console.error('OAuth sign in error:', error);
      return { error };
    }
  }

  // Reset password
  async resetPassword(data: ResetPasswordData): Promise<{ error: any }> {
    try {
      const { email } = data;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast({
          title: "Password reset failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });

      return { error: null };
    } catch (error) {
      console.error('Password reset error:', error);
      return { error };
    }
  }

  // Update password
  async updatePassword(data: UpdatePasswordData): Promise<{ error: any }> {
    try {
      const { newPassword } = data;
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Password updated",
        description: "Your password has been updated successfully.",
      });

      return { error: null };
    } catch (error) {
      console.error('Password update error:', error);
      return { error };
    }
  }

  // Get current session
  async getSession(): Promise<{ session: Session | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { session: data.session, error };
    } catch (error) {
      console.error('Get session error:', error);
      return { session: null, error };
    }
  }

  // Get current user
  async getUser(): Promise<{ user: User | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.getUser();
      return { user: data.user, error };
    } catch (error) {
      console.error('Get user error:', error);
      return { user: null, error };
    }
  }

  // Update user profile
  async updateProfile(updates: {
    email?: string;
    display_name?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
    metadata?: Record<string, any>;
  }): Promise<{ user: User | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: updates.email,
        data: {
          display_name: updates.display_name,
          first_name: updates.first_name,
          last_name: updates.last_name,
          avatar_url: updates.avatar_url,
          ...updates.metadata,
        },
      });

      if (error) {
        toast({
          title: "Profile update failed",
          description: error.message,
          variant: "destructive",
        });
        return { user: null, error };
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Profile update error:', error);
      return { user: null, error };
    }
  }

  // Refresh session
  async refreshSession(): Promise<{ session: Session | null; error: any }> {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      return { session: data.session, error };
    } catch (error) {
      console.error('Refresh session error:', error);
      return { session: null, error };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export const authService = new AuthService();
