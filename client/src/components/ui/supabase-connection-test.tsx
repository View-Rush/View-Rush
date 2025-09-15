import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

export function SupabaseConnectionTest() {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<string>('');

  const testConnection = async () => {
    setStatus('testing');
    setResult('');
    
    try {
      // Test 1: Basic connection
      console.log('Testing basic Supabase connection...');
      const { data: healthCheck, error: healthError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (healthError) {
        throw new Error(`Health check failed: ${healthError.message}`);
      }
      
      // Test 2: Check profiles table structure
      console.log('Checking profiles table structure...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
        
      if (profilesError) {
        throw new Error(`Profiles table error: ${profilesError.message}`);
      }
      
      setStatus('success');
      setResult(`✅ Database connection successful\n✅ Profiles table accessible\n✅ Records found: ${profiles?.length || 0}`);
      
    } catch (error) {
      setStatus('error');
      setResult(`❌ Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Supabase connection test failed:', error);
    }
  };

  const testAuth = async () => {
    setStatus('testing');
    setResult('');
    
    try {
      // Test 1: Auth service basic functionality
      console.log('Testing auth service...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(`Session check failed: ${sessionError.message}`);
      }
      
      // Test 2: Check auth configuration
      console.log('Checking auth configuration...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError && userError.message !== 'No user found') {
        throw new Error(`User check failed: ${userError.message}`);
      }
      
      setStatus('success');
      setResult(`✅ Auth service working\n✅ Current session: ${session ? 'Active' : 'None'}\n✅ Current user: ${user ? user.email : 'None'}`);
      
    } catch (error) {
      setStatus('error');
      setResult(`❌ Auth test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Supabase auth test failed:', error);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>Supabase Connection Test</span>
          <Badge variant={
            status === 'success' ? 'default' : 
            status === 'error' ? 'destructive' : 
            status === 'testing' ? 'secondary' : 'outline'
          }>
            {status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={testConnection} 
            disabled={status === 'testing'}
            className="w-full"
          >
            {status === 'testing' ? 'Testing...' : 'Test Database Connection'}
          </Button>
          
          <Button 
            onClick={testAuth} 
            disabled={status === 'testing'}
            variant="outline"
            className="w-full"
          >
            {status === 'testing' ? 'Testing...' : 'Test Auth Service'}
          </Button>
        </div>
        
        {result && (
          <div className="p-3 bg-muted rounded-md">
            <pre className="text-sm whitespace-pre-wrap">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
