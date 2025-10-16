import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";
import viewRushLogo from "@/assets/view-rush-logo.png";
import { YouTubeConnectStep } from "@/components/auth/YouTubeConnectStep";
import { SignupProgress } from "@/components/auth/SignupProgress";

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showYouTubeConnect, setShowYouTubeConnect] = useState(false);
  const [signupData, setSignupData] = useState<{
    email: string;
    password: string;
    displayName: string;
  } | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const clearSignupDataTimeout = useRef<number | null>(null);

  // Handle navigation when user is authenticated
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  // Load saved signup data on mount
  useEffect(() => {
    const saved = localStorage.getItem("signupData");
    if (saved) {
      setSignupData(JSON.parse(saved));
      // if there's saved signup data, show the signup tab when returning
      setActiveTab("signup");
    }
  }, []);

  // Handle signup data cleanup timer
  useEffect(() => {
    // clear any existing timer
    if (clearSignupDataTimeout.current) {
      clearTimeout(clearSignupDataTimeout.current);
      clearSignupDataTimeout.current = null;
    }

    if (signupData) {
      clearSignupDataTimeout.current = window.setTimeout(() => {
        setSignupData(null);
        localStorage.removeItem("signupData");
        clearSignupDataTimeout.current = null;
      }, 5000); // 5000ms = 5s
    }

    return () => {
      if (clearSignupDataTimeout.current) {
        clearTimeout(clearSignupDataTimeout.current);
        clearSignupDataTimeout.current = null;
      }
    };
  }, [signupData]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    await signIn(email, password);
    setIsSubmitting(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const displayName = formData.get("displayName") as string;

    // Ensure the tab is set to signup so returning from YouTube step shows it
    setActiveTab("signup");

    // Store signup data and show YouTube connect step
    setSignupData({ email, password, displayName });
    localStorage.setItem(
      "signupData",
      JSON.stringify({ email, password, displayName })
    );
    setCompletedSteps(["account"]);
    setShowYouTubeConnect(true);
    setIsSubmitting(false);
  };

  const handleYouTubeConnectComplete = async (connected: boolean) => {
    if (!signupData) return;

    setIsSubmitting(true);
    try {
      const result = await signUp(
        signupData.email,
        signupData.password,
        signupData.displayName
      );

      if (!result.error) {
        // Account created successfully, redirect will happen via useAuth
        if (connected) {
          setCompletedSteps((prev) => [...prev, "youtube"]);
        }
      }
    } catch (error) {
    } finally {
      setIsSubmitting(false);
      setShowYouTubeConnect(false);
      setSignupData(null);
      localStorage.removeItem("signupData");
    }
  };

  const handleYouTubeConnectSkip = () => {
    // User chose to skip YouTube connection
  };

  const handleBackToAccountDetails = () => {
    setShowYouTubeConnect(false);
    setActiveTab("signup");
    setCompletedSteps([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to Home */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-white/80 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <img
            src={viewRushLogo}
            alt="View Rush"
            className="h-12 w-12 mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-white mb-2">View Rush</h1>
          <p className="text-white/80">Your YouTube Analytics Platform</p>
        </div>

        {/* YouTube Connect Step */}
        {showYouTubeConnect ? (
          <>
            <SignupProgress
              currentStep="youtube"
              completedSteps={completedSteps}
            />
            <YouTubeConnectStep
              isVisible={showYouTubeConnect}
              onComplete={handleYouTubeConnectComplete}
              onSkip={handleYouTubeConnectSkip}
              onBack={handleBackToAccountDetails}
            />
          </>
        ) : (
          /* Regular Auth Form */
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl text-center bg-gradient-primary bg-clip-text text-transparent">
                Welcome
              </CardTitle>
              <CardDescription className="text-center text-muted-foreground">
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "signin" | "signup")}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="space-y-4 mt-6">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      variant="hero"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-6">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Display Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          name="displayName"
                          type="text"
                          placeholder="Your name"
                          className="pl-10"
                          defaultValue={signupData?.displayName ?? ""}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder="your@email.com"
                          className="pl-10"
                          required
                          defaultValue={signupData?.email ?? ""}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          placeholder="••••••••"
                          className="pl-10"
                          minLength={6}
                          required
                          defaultValue={signupData?.password ?? ""}
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full"
                      variant="hero"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardFooter className="text-center">
              <p className="text-sm text-muted-foreground">
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </p>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;