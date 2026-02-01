import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { User, LogOut, Loader2, BarChart3, Map } from "lucide-react";
import empowerLogo from "@/assets/empower-logo.png";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface TopNavProps {
  isAdmin?: boolean;
}

export function TopNav({ isAdmin = false }: TopNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = () => {
    setIsSigningOut(true);
    logout();
    setShowMenu(false);
    navigate("/login");
    setIsSigningOut(false);
  };

  const currentPath = location.pathname;

  const userTabs = [
    { label: "Map", path: "/", icon: Map },
    { label: "Stats", path: "/stats", icon: BarChart3 },
  ];

  return (
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-3 md:px-6 py-2.5 md:py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center group shrink-0">
          <img 
            src={empowerLogo} 
            alt="EMPower" 
            className="h-7 md:h-8 w-auto transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1">
          {/* Desktop tabs */}
          <div className="hidden md:flex items-center gap-1">
            {userTabs.map((tab) => {
              const isActive = tab.path === currentPath || 
                (tab.path === "/" && currentPath === "/map");
              
              return (
                <Link key={tab.label} to={tab.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "font-medium px-4",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    {tab.label.toUpperCase()}
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Mobile tabs - icon only */}
          <div className="flex md:hidden items-center gap-0.5">
            {userTabs.map((tab) => {
              const isActive = tab.path === currentPath || 
                (tab.path === "/" && currentPath === "/map");
              const Icon = tab.icon;
              
              return (
                <Link key={tab.label} to={tab.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-9 w-9 p-0",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Auth Button */}
          {isLoading ? (
            <Button variant="ghost" size="sm" className="ml-1 md:ml-2 h-9 w-9 p-0" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          ) : isAuthenticated ? (
            <Popover open={showMenu} onOpenChange={setShowMenu}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium ml-1 md:ml-2 h-9 px-2.5 md:px-4 gap-2"
                >
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">Account</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                  <Link to="/profile" onClick={() => setShowMenu(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2" size="sm">
                      <User className="h-4 w-4" />
                      My Profile
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive hover:bg-destructive/10" 
                    size="sm"
                    onClick={handleLogout}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    Log out
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Link to="/login">
              <Button
                variant="default"
                size="sm"
                className="font-medium ml-1 md:ml-2 h-9 px-3 md:px-4"
              >
                <span className="hidden md:inline">LOG IN</span>
                <span className="md:hidden">Login</span>
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
