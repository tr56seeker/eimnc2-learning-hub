import { FlashMessage } from "@/components/FlashMessage";
import { PortalShell } from "@/components/PortalShell";
import { SectionHeader } from "@/components/SectionHeader";
import { requireAdmin } from "@/lib/auth";
import type { ProfileStatus, UserRole } from "@/lib/types";
import { TeachersManagementClient } from "./TeachersManagementClient";

export type TeacherAccount = {
  id: string;
  fullName: string;
  email: string | null;
  role: UserRole;
  status: ProfileStatus | null;
};

export default async function TeachersAdminPage({
  searchParams
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { profile, supabase } = await requireAdmin();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, status")
    .in("role", ["teacher", "admin"])
    .order("full_name")
    .returns<{ id: string; full_name: string; email: string | null; role: UserRole; status: ProfileStatus | null }[]>();

  const teachers: TeacherAccount[] = (data ?? []).map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status
  }));

  return (
    <PortalShell profile={profile}>
      <SectionHeader
        eyebrow="Administration"
        title="Teacher &amp; Admin Accounts"
        description="Create and manage staff accounts. Newly created accounts must change their temporary password on first login."
      />

      <FlashMessage message={params.error} variant="error" className="mb-7" />
      <FlashMessage message={params.message} variant="success" className="mb-7" />

      <TeachersManagementClient teachers={teachers} currentUserId={profile.id} />
    </PortalShell>
  );
}
