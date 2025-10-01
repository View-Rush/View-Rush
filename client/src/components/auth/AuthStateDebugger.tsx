import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const AuthStateDebugger = () => {
  const { user, session, loading } = useAuth();
  const location = useLocation();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 bg-white/95 backdrop-blur-sm shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Auth State Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span>Loading:</span>
          <Badge variant={loading ? "destructive" : "secondary"}>
            {loading ? "True" : "False"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>User:</span>
          <Badge variant={user ? "default" : "secondary"}>
            {user ? "Authenticated" : "None"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>Session:</span>
          <Badge variant={session ? "default" : "secondary"}>
            {session ? "Active" : "None"}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span>Route:</span>
          <Badge variant="outline" className="text-xs">
            {location.pathname}
          </Badge>
        </div>
        {user && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              Email: {user.email}
            </div>
            <div className="text-xs text-muted-foreground">
              ID: {user.id.slice(-6)}...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
