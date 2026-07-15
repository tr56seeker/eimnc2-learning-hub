"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireTeacher } from "@/lib/auth";

function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text || null;
}

function parseRubric(raw: string) {
  const criteria = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, pointsRaw] = line.split("|").map((part) => part.trim());
      const points = Number(pointsRaw);
      return { name: name || "Criterion", points: Number.isFinite(points) ? points : 0 };
    });

  return criteria.length ? { criteria } : null;
}

function revalidateProject(projectId: string) {
  revalidatePath("/teacher/projects");
  revalidatePath(`/teacher/projects/${projectId}`);
  revalidatePath("/learner/projects");
}

export async function createProjectAction(formData: FormData) {
  const { profile, supabase } = await requireTeacher();
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    redirect("/teacher/projects?error=Project title is required.");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      title,
      overview: nullableText(formData.get("overview")),
      competency_id: nullableText(formData.get("competency_id")),
      due_at: nullableText(formData.get("due_at")) ? new Date(String(formData.get("due_at"))).toISOString() : null,
      rubric: parseRubric(String(formData.get("rubric") ?? "")),
      created_by: profile.id
    })
    .select("id")
    .single();

  if (error || !data) redirect(`/teacher/projects?error=${encodeURIComponent(error?.message ?? "Unable to create project.")}`);

  revalidatePath("/teacher/projects");
  redirect(`/teacher/projects/${data.id}?message=Project created.`);
}

export async function updateProjectAction(projectId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    redirect(`/teacher/projects/${projectId}?error=Project title is required.`);
  }

  const { error } = await supabase
    .from("projects")
    .update({
      title,
      overview: nullableText(formData.get("overview")),
      competency_id: nullableText(formData.get("competency_id")),
      due_at: nullableText(formData.get("due_at")) ? new Date(String(formData.get("due_at"))).toISOString() : null,
      rubric: parseRubric(String(formData.get("rubric") ?? "")),
      updated_at: new Date().toISOString()
    })
    .eq("id", projectId);

  if (error) redirect(`/teacher/projects/${projectId}?error=${encodeURIComponent(error.message)}`);

  revalidateProject(projectId);
  redirect(`/teacher/projects/${projectId}?message=Project updated.`);
}

export async function setProjectActiveAction(projectId: string, isActive: boolean) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("projects").update({ is_active: isActive }).eq("id", projectId);

  if (error) redirect(`/teacher/projects?error=${encodeURIComponent(error.message)}`);

  revalidateProject(projectId);
  redirect(`/teacher/projects?message=${encodeURIComponent(isActive ? "Project restored." : "Project archived.")}`);
}

export async function addMilestoneAction(projectId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    redirect(`/teacher/projects/${projectId}?error=Milestone title is required.`);
  }

  const { error } = await supabase.from("project_milestones").insert({
    project_id: projectId,
    title,
    description: nullableText(formData.get("description")),
    due_at: nullableText(formData.get("due_at")) ? new Date(String(formData.get("due_at"))).toISOString() : null,
    display_order: Number(formData.get("display_order") ?? 0)
  });

  if (error) redirect(`/teacher/projects/${projectId}?error=${encodeURIComponent(error.message)}`);

  revalidateProject(projectId);
  redirect(`/teacher/projects/${projectId}?message=Milestone added.`);
}

export async function deleteMilestoneAction(projectId: string, milestoneId: string) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("project_milestones").delete().eq("id", milestoneId).eq("project_id", projectId);

  if (error) redirect(`/teacher/projects/${projectId}?error=${encodeURIComponent(error.message)}`);

  revalidateProject(projectId);
  redirect(`/teacher/projects/${projectId}?message=Milestone removed.`);
}

export async function assignLearnerAction(projectId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const learnerId = String(formData.get("learner_id") ?? "").trim();

  if (!learnerId) {
    redirect(`/teacher/projects/${projectId}?error=Select a learner to assign.`);
  }

  const { error } = await supabase.from("project_assignments").insert({ project_id: projectId, learner_id: learnerId });

  if (error) redirect(`/teacher/projects/${projectId}?error=${encodeURIComponent(error.message)}`);

  revalidateProject(projectId);
  redirect(`/teacher/projects/${projectId}?message=Learner assigned.`);
}

export async function updateAssignmentAction(projectId: string, assignmentId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const status = String(formData.get("status") ?? "on_track");
  const progressPercentage = Math.max(0, Math.min(100, Number(formData.get("progress_percentage") ?? 0)));
  const finalScoreRaw = String(formData.get("final_score") ?? "").trim();
  const finalScore = finalScoreRaw ? Number(finalScoreRaw) : null;

  const { error } = await supabase
    .from("project_assignments")
    .update({
      status,
      progress_percentage: progressPercentage,
      final_score: finalScore,
      teacher_comments: nullableText(formData.get("teacher_comments")),
      updated_at: new Date().toISOString()
    })
    .eq("id", assignmentId)
    .eq("project_id", projectId);

  if (error) redirect(`/teacher/projects/${projectId}?error=${encodeURIComponent(error.message)}`);

  revalidateProject(projectId);
  redirect(`/teacher/projects/${projectId}?message=Learner progress updated.`);
}

export async function removeAssignmentAction(projectId: string, assignmentId: string) {
  const { supabase } = await requireTeacher();
  const { error } = await supabase.from("project_assignments").delete().eq("id", assignmentId).eq("project_id", projectId);

  if (error) redirect(`/teacher/projects/${projectId}?error=${encodeURIComponent(error.message)}`);

  revalidateProject(projectId);
  redirect(`/teacher/projects/${projectId}?message=Learner removed from project.`);
}

export async function scoreMilestoneSubmissionAction(projectId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const submissionId = String(formData.get("submission_id") ?? "");
  const score = Number(formData.get("score") ?? 0);
  const feedback = String(formData.get("feedback") ?? "").trim();

  const { error } = await supabase
    .from("milestone_submissions")
    .update({ score, feedback, status: "checked" })
    .eq("id", submissionId);

  if (error) redirect(`/teacher/projects/${projectId}?error=${encodeURIComponent(error.message)}`);

  revalidateProject(projectId);
  redirect(`/teacher/projects/${projectId}?message=Milestone scored.`);
}

export async function returnMilestoneSubmissionAction(projectId: string, formData: FormData) {
  const { supabase } = await requireTeacher();
  const submissionId = String(formData.get("submission_id") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim();

  if (!feedback) {
    redirect(`/teacher/projects/${projectId}?error=${encodeURIComponent("Add feedback explaining what needs revision before returning it.")}`);
  }

  const { error } = await supabase.from("milestone_submissions").update({ status: "returned", feedback }).eq("id", submissionId);

  if (error) redirect(`/teacher/projects/${projectId}?error=${encodeURIComponent(error.message)}`);

  revalidateProject(projectId);
  redirect(`/teacher/projects/${projectId}?message=Returned to learner for revision.`);
}
