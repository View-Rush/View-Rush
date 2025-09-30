import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, Info, User, LogOut } from 'lucide-react';

export function AuthDebugTest() {
  const { user, session, loading, signOut } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [authState, setAuthState] = useState<any>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  useEffect(() => {
    // Monitor auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      addLog(`Auth state change: ${event} - User: ${session?.user?.email || 'none'}`);
      setAuthState({ event, session: !!session, userEmail: session?.user?.email });
    });

    return () => subscription.unsubscribe();
  }, []);

  const testCurrentState = async () => {
    setLogs([]);
    addLog('Testing current auth state...');
    
    try {
      // Check useAuth hook state
      addLog(`useAuth - User: ${user?.email || 'none'}`);
      addLog(`useAuth - Session: ${session ? 'exists' : 'none'}`);
      addLog(`useAuth - Loading: ${loading}`);
      
      // Check Supabase client directly
      const { data: { session: supabaseSession }, error } = await supabase.auth.getSession();
      addLog(`Supabase getSession - Session: ${supabaseSession?.user?.email || 'none'}`);
      addLog(`Supabase getSession - Error: ${error?.message || 'none'}`);
      
      // Check localStorage
      const localStorageKeys = Object.keys(localStorage);
      addLog(`LocalStorage keys: ${localStorageKeys.length} items`);
      
      const authKeys = localStorageKeys.filter(key => 
        key.includes('auth') || key.includes('supabase') || key.startsWith('sb-')
      );
      
      if (authKeys.length > 0) {
        addLog(`Auth-related keys: ${authKeys.join(', ')}`);
      } else {
        addLog('No auth-related keys found');
      }
      
      // Check sessionStorage
      const sessionStorageKeys = Object.keys(sessionStorage);
      addLog(`SessionStorage keys: ${sessionStorageKeys.length} items`);
      
    } catch (error) {
      addLog(`Test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testSignOut = async () => {
    addLog('Starting sign out test...');
    try {
      await signOut();
      addLog('Sign out completed');
    } catch (error) {
      addLog(`Sign out failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const forceSignOut = async () => {
    addLog('Force signing out...');
    try {
      // Force sign out through Supabase client
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) {
        addLog(`Supabase signOut error: ${error.message}`);
      } else {
        addLog('Supabase signOut successful');
      }
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      addLog('Storage cleared');
      
      // Force reload
      window.location.href = '/';
    } catch (error) {
      addLog(`Force sign out failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const clearAllData = () => {
    localStorage.clear();
    sessionStorage.clear();
    addLog('All browser data cleared');
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Authentication Debugging
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={testCurrentState} size="sm">
            Test Current State
          </Button>
          <Button onClick={testSignOut} variant="outline" size="sm">
            Test Sign Out
          </Button>
          <Button onClick={forceSignOut} variant="destructive" size="sm">
            <LogOut className="h-4 w-4 mr-1" />
            Force Sign Out
          </Button>
          <Button onClick={clearAllData} variant="secondary" size="sm">
            Clear All Data
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">Current State:</h4>
            <div className="space-y-1 text-sm">
              <div>User: <Badge variant={user ? 'default' : 'secondary'}>{user?.email || 'None'}</Badge></div>
              <div>Session: <Badge variant={session ? 'default' : 'secondary'}>{session ? 'Active' : 'None'}</Badge></div>
              <div>Loading: <Badge variant={loading ? 'secondary' : 'outline'}>{loading ? 'Yes' : 'No'}</Badge></div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Auth State Events:</h4>
            <div className="text-sm">
              {authState ? (
                <div>
                  <div>Event: <Badge variant="outline">{authState.event}</Badge></div>
                  <div>Session: <Badge variant={authState.session ? 'default' : 'secondary'}>{authState.session ? 'Yes' : 'No'}</Badge></div>
                  {authState.userEmail && <div>User: {authState.userEmail}</div>}
                </div>
              ) : (
                <div className="text-muted-foreground">No events yet</div>
              )}
            </div>
          </div>
        </div>

        {logs.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Debug Logs:</h4>
            <div className="text-sm font-mono space-y-1 max-h-64 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="whitespace-pre-wrap">{log}</div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
