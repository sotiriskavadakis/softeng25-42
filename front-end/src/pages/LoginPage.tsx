import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Zap, Mail, Lock, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { PageContainer } from "@/components/layout";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the redirect destination
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  const validateForm = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return null;
    } catch (err) {
      if (err instanceof z.ZodError) {
        return err.errors[0].message;
      }
      return "Validation error";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    
    const { error } = await login(email, password);
    
    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    }
    // Navigation happens automatically via useEffect when isAuthenticated becomes true
  };

  if (authLoading) {
    return (
      <PageContainer className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </PageContainer>
    );
  }

  return (
    <PageContainer className="flex items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-hero shadow-glow mb-4">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-gradient">EMPower</h1>
          <p className="text-muted-foreground mt-2">Find. Charge. Go.</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center pb-2">
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </motion.div>
    </PageContainer>
  );
}
