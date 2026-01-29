import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { User, LogOut, Loader2 } from "lucide-react";
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
    { label: "MAP", path: "/" },
    { label: "STATS", path: "/stats" },
    { label: "SESSIONS", path: "/sessions" },
  ];

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto px-4 md:px-6 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center group">
          <img 
            src={empowerLogo} 
            alt="EMPower" 
            className="h-8 w-auto transition-transform group-hover:scale-105"
          />
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 md:gap-2">
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
                  {tab.label}
                </Button>
              </Link>
            );
          })}

          {/* Auth Button */}
          {isLoading ? (
            <Button variant="ghost" size="sm" className="ml-2" disabled>
              <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
          ) : isAuthenticated ? (
            <Popover open={showMenu} onOpenChange={setShowMenu}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-medium px-4 ml-2 gap-2"
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
                className="font-medium px-4 ml-2"
              >
                LOG IN
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
