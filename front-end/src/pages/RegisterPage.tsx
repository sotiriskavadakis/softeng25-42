import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Zap, Mail, Lock, User, ArrowRight, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";
import empowerLogo from "@/assets/empower-logo.png";

// Validation schemas
const emailSchema = z.string().email("Please enter a valid email address");
const nameSchema = z.string().min(2, "Name must be at least 2 characters").optional();

// Password requirements
const passwordRequirements = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "One uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "One number", test: (pw: string) => /[0-9]/.test(pw) },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, register } = useAuth();
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation state
  const passwordChecks = useMemo(() => 
    passwordRequirements.map(req => ({
      ...req,
      passed: req.test(password)
    })),
    [password]
  );

  const isPasswordValid = passwordChecks.every(check => check.passed);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const validateForm = () => {
    try {
      emailSchema.parse(email);
      if (firstName) nameSchema.parse(firstName);
      if (lastName) nameSchema.parse(lastName);
      
      if (!isPasswordValid) {
        return "Password does not meet requirements";
      }
      
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
    
    const { error } = await register(email, password, {
      firstName: firstName || undefined,
      lastName: lastName || undefined,
    });
    
    if (error) {
      setError(error.message);
      setIsSubmitting(false);
    }
    // Navigation happens automatically via useEffect when isAuthenticated becomes true
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Back button */}
      <div className="p-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate("/")}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Map
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary-glow shadow-xl mb-4 ring-4 ring-primary/20">
              <img src={empowerLogo} alt="EMPower" className="h-12 w-12 object-contain" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              EMPower
            </h1>
            <p className="text-muted-foreground mt-2">Find. Charge. Go.</p>
          </div>

          <Card className="shadow-2xl border-border/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-2 space-y-1">
              <CardTitle className="text-2xl">Create Account</CardTitle>
              <CardDescription>Join EMPower and start charging</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="first-name" className="text-sm font-medium">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="first-name"
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10 h-11"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name" className="text-sm font-medium">Last Name</Label>
                    <Input
                      id="last-name"
                      type="text"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      disabled={isSubmitting}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  {password.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-3 space-y-1.5 p-3 rounded-lg bg-muted/50 border border-border"
                    >
                      {passwordChecks.map((check, idx) => (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-2 text-xs ${
                            check.passed ? "text-success" : "text-muted-foreground"
                          }`}
                        >
                          {check.passed ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            <X className="h-3.5 w-3.5" />
                          )}
                          {check.label}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium" 
                  disabled={isSubmitting || !isPasswordValid}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                  or
                </span>
              </div>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">Already have an account? </span>
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Sign In
                </Link>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6 px-4">
            By continuing, you agree to our{" "}
            <button className="text-primary hover:underline">Terms of Service</button>
            {" "}and{" "}
            <button className="text-primary hover:underline">Privacy Policy</button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
