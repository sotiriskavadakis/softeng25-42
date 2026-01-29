import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "user";

export function useUserRole() {
  return useQuery({
    queryKey: ["user-role"],
    queryFn: async (): Promise<AppRole | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return (data?.role as AppRole) || "user";
    },
  });
}

export function useIsAdmin() {
  const { data: role, isLoading } = useUserRole();
  return { isAdmin: role === "admin", isLoading };
}
