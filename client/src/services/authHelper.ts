// Auth helper to prevent concurrent supabase.auth.getUser() calls
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

class AuthHelper {
  private userPromise: Promise<User | null> | null = null;
  private lastUserCheck = 0;
  private readonly CACHE_DURATION = 5000; // 5 seconds cache
  private cachedUser: User | null = null;
  private userFromContext: User | null = null;

  // Set user from auth context (bypasses Supabase calls)
  setUserFromContext(user: User | null): void {
    console.log('🔄 Setting user from auth context:', user?.email || 'No user');
    this.userFromContext = user;
    this.cachedUser = user;
    this.lastUserCheck = Date.now();
  }

  // Get current user with caching to prevent concurrent calls
  async getUser(): Promise<User | null> {
    // If we have a user from context, use it
    if (this.userFromContext) {
      console.log('🔄 Using user from auth context:', this.userFromContext.email);
      return this.userFromContext;
    }

    const now = Date.now();
    
    // If we have a recent cached promise, return it
    if (this.userPromise && (now - this.lastUserCheck) < this.CACHE_DURATION) {
      console.log('🔄 Using cached auth promise');
      return this.userPromise;
    }
    
    // Create new promise with timeout
    console.log('🔄 Creating new auth promise');
    this.lastUserCheck = now;
    
    this.userPromise = this.createAuthPromise();
    
    return this.userPromise;
  }
  
  private async createAuthPromise(): Promise<User | null> {
    try {
      console.log('🔄 Calling supabase.auth.getUser()');
      
      // Add timeout to prevent hanging
      const authPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout after 5 seconds')), 5000)
      );
      
      const result = await Promise.race([authPromise, timeoutPromise]);
      const { data: { user }, error } = result;
      
      if (error) {
        console.error('🔥 Auth error:', error);
        return null;
      }
      
      console.log('✅ Auth successful:', user?.email || 'No user');
      return user;
    } catch (error) {
      console.error('🔥 Auth helper error:', error);
      return null;
    }
  }
  

  // Clear the cached promise (call when auth state changes)

  clearCache(): void {
    console.log('🔄 Clearing auth cache');
    this.userPromise = null;
    this.lastUserCheck = 0;
    this.userFromContext = null;
    this.cachedUser = null;
  }
}

export const authHelper = new AuthHelper();