import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const SignInTest = () => {
  const { signIn, user, loading } = useAuth();
  const [testEmail, setTestEmail] = useState('test@example.com');
  const [testPassword, setTestPassword] = useState('password123');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTestSignIn = async () => {
    setIsSubmitting(true);
    try {
      console.log('Test sign-in attempt:', testEmail);
      const result = await signIn(testEmail, testPassword);
      console.log('Test sign-in result:', result);
    } catch (error) {
      console.error('Test sign-in error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          Auth Test Tool
          <Badge variant={user ? "default" : "secondary"}>
            {user ? "Authenticated" : "Not Authenticated"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Input
            type="email"
            placeholder="Test Email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="text-sm"
          />
        </div>
        <div>
          <Input
            type="password"
            placeholder="Test Password"
            value={testPassword}
            onChange={(e) => setTestPassword(e.target.value)}
            className="text-sm"
          />
        </div>
        <Button
          onClick={handleTestSignIn}
          disabled={isSubmitting || loading}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {isSubmitting ? 'Testing...' : 'Test Sign In'}
        </Button>
        <div className="text-xs text-muted-foreground">
          Note: This is a development tool and will not appear in production.
        </div>
      </CardContent>
    </Card>
  );
};
