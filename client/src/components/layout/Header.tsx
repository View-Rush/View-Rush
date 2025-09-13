import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, BarChart3, TrendingUp, Youtube, LogIn, LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import viewRushLogo from "@/assets/view-rush-logo.png";

interface HeaderProps {
  className?: string;
}

export const Header = ({ className }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
    { name: "Trending", href: "/trending", icon: TrendingUp },
    { name: "Analytics", href: "/analytics", icon: Youtube },
  ];

  return (
    <header className={cn("fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b", className)}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src={viewRushLogo} 
              alt="View Rush" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              View Rush
            </span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-2 text-foreground/80 hover:text-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          )}

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-foreground/80">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {user && navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="px-3 py-2 space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center space-x-2 px-3 py-2 text-sm text-foreground/80">
                      <User className="h-4 w-4" />
                      <span>{user.email}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={signOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth">
                      <Button variant="ghost" size="sm" className="w-full justify-start">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth">
                      <Button variant="hero" size="sm" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};