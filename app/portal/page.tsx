import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";

export default async function PortalPage() {
  const { profile } = await getCurrentUserAndProfile();

  if (profile.role === "learner") {
    if (profile.status === "inactive" || profile.status === "deleted") {
      redirect("/account/inactive");
    }

    if (profile.must_change_password) {
      redirect("/account/change-password");
    }

    redirect("/learner/dashboard");
  }

  redirect("/teacher/dashboard");
}
