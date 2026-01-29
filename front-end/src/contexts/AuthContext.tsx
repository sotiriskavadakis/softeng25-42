import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { 
  getAuthToken, 
  setAuthToken, 
  clearAuthToken, 
  login as apiLogin, 
  register as apiRegister,
  ApiError
} from "@/lib/api/client";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  register: (email: string, password: string, metadata?: { firstName?: string; lastName?: string }) => Promise<{ error: Error | null }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const token = getAuthToken();
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await apiLogin({ email, password });
      setAuthToken(response.token);
      setIsAuthenticated(true);
      return { error: null };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error: new Error(error.message) };
      }
      return { error: error as Error };
    }
  }, []);

  const register = useCallback(async (
    email: string, 
    password: string, 
    metadata?: { firstName?: string; lastName?: string }
  ) => {
    try {
      const response = await apiRegister({ 
        email, 
        password,
        firstName: metadata?.firstName,
        lastName: metadata?.lastName,
      });
      setAuthToken(response.token);
      setIsAuthenticated(true);
      return { error: null };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error: new Error(error.message) };
      }
      return { error: error as Error };
    }
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
