import { Routes, Route } from "react-router-dom";
import MapPage from "@/pages/MapPage";
import UserStatsPage from "@/pages/UserStatsPage";
import ProfilePage from "@/pages/ProfilePage";
import SessionsPage from "@/pages/SessionsPage";
import DataDictionaryPage from "@/pages/DataDictionaryPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/auth";

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<MapPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Protected routes - require authentication */}
      <Route path="/stats" element={
        <ProtectedRoute>
          <UserStatsPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/sessions" element={
        <ProtectedRoute>
          <SessionsPage />
        </ProtectedRoute>
      } />
      
      {/* Dev routes */}
      <Route path="/dev/data-dictionary" element={<DataDictionaryPage />} />
      
      {/* Legacy route redirect */}
      <Route path="/auth" element={<LoginPage />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
