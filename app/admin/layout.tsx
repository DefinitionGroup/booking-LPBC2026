import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserNav } from "@/components/layout/user-nav";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check for admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    redirect("/"); // Or show a 403 Forbidden page
  }

  return (
    <AdminShell userNav={<UserNav />}>{children}</AdminShell>
  );
}
