import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";

export default async function PortalPage() {
  const { profile } = await getCurrentUserAndProfile();

  if (profile.role === "learner") {
    redirect("/learner/dashboard");
  }

  redirect("/teacher/dashboard");
}
