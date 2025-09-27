import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('Handling Supabase auth callback...');
      
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        if (data.session) {
          console.log('Authentication successful:', data.session.user.email);
          toast({
            title: "Welcome!",
            description: "You have been successfully signed in.",
          });
          navigate('/dashboard');
        } else {
          console.log('No session found after callback');
          navigate('/auth');
        }
      } catch (error) {
        console.error('Auth callback failed:', error);
        toast({
          title: "Authentication Failed",
          description: "There was an error processing your authentication.",
          variant: "destructive",
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg text-gray-600">Processing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;