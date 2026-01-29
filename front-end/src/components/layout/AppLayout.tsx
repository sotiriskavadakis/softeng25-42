import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
