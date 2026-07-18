import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Deliberately not under public/ — this file must only ever reach an authenticated
// teacher/admin request, never a bare unauthenticated URL fetch. See the incident where
// an earlier copy of this template (with real learner data still in it) sat in
// public/templates and was fetchable by anyone who found the URL.
const TEMPLATE_PATH = path.join(process.cwd(), "private-assets", "templates", "eim-eclass-record-master.xlsx");

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).maybeSingle();

  if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (profile.status === "inactive" || profile.status === "deleted") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const buffer = await readFile(TEMPLATE_PATH);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Cache-Control": "private, no-store"
    }
  });
}
