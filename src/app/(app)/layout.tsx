import { redirect } from "next/navigation";
import type React from "react";
import { Header } from "@/components/header";
import { AppSidebar } from "@/components/app-sidebar";
import { UserInitializer } from "@/components/UserInitializer";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { createClient } from "@/lib/supabase/server";

// Revalidate auth check every 5 minutes
export const revalidate = 300;

export default async function AppPagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FAFAFB] dark:bg-background">
      <UserInitializer />
      <NavigationProgress />
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-0 mr-[17px] ml-2">{children}</main>
      </div>
    </div>
  );
}
