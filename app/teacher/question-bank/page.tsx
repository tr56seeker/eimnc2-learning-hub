import { PortalShell } from "@/components/PortalShell";
import { requireTeacher } from "@/lib/auth";
import { firstRelation } from "@/lib/relations";
import { QuestionBankClient, type QuestionBankItem } from "./QuestionBankClient";

type Choice = { label: string; value: string } | { key: string; text: string };

type QuestionRow = {
  id: string;
  competency_id: string | null;
  question_text: string;
  question_type: string;
  choices: Choice[] | null;
  correct_answer: string | null;
  points: number | null;
  difficulty: string;
  explanation: string | null;
  is_active: boolean | null;
  competencies: { code: string | null; title: string | null } | { code: string | null; title: string | null }[] | null;
};

export default async function TeacherQuestionBankPage({ searchParams }: { searchParams: Promise<{ message?: string; error?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireTeacher();

  const [competenciesResult, questionsResult] = await Promise.all([
    supabase.from("competencies").select("id, code, title").order("order_index"),
    supabase
      .from("question_bank")
      .select("id, competency_id, question_text, question_type, choices, correct_answer, points, difficulty, explanation, is_active, competencies(code, title)")
      .order("created_at", { ascending: false })
      .returns<QuestionRow[]>()
  ]);

  const competencies = (competenciesResult.data ?? []).map((competency) => ({
    id: competency.id,
    code: competency.code ?? "",
    title: competency.title ?? "Untitled competency"
  }));

  const questions: QuestionBankItem[] = (questionsResult.data ?? []).map((question) => {
    const competency = firstRelation(question.competencies);

    return {
      id: question.id,
      competencyId: question.competency_id,
      competencyCode: competency?.code ?? null,
      competencyTitle: competency?.title ?? null,
      questionText: question.question_text,
      questionType: question.question_type,
      choices: question.choices,
      correctAnswer: question.correct_answer,
      points: question.points ?? 1,
      difficulty: question.difficulty,
      explanation: question.explanation,
      isActive: question.is_active ?? true
    };
  });

  return (
    <PortalShell profile={profile}>
      <QuestionBankClient
        competencies={competencies}
        questions={questions}
        message={params.message}
        error={params.error}
      />
    </PortalShell>
  );
}
