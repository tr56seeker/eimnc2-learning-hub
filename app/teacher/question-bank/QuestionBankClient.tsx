"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { createQuestionAction, deleteQuestionAction, updateQuestionAction } from "./actions";
import { BulkQuestionUpload } from "./BulkQuestionUpload";

type Choice = { label: string; value: string } | { key: string; text: string };
type CompetencyOption = { id: string; code: string; title: string };

export type QuestionBankItem = {
  id: string;
  competencyId: string | null;
  competencyCode: string | null;
  competencyTitle: string | null;
  questionText: string;
  questionType: string;
  choices: Choice[] | null;
  correctAnswer: string | null;
  points: number;
  difficulty: string;
  explanation: string | null;
  isActive: boolean;
};

type ModalState =
  | { mode: "add" }
  | { mode: "bulk" }
  | { mode: "view" | "edit"; question: QuestionBankItem }
  | null;

const fieldClass = "focus-ring min-h-11 w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm font-normal text-slate-900 shadow-sm shadow-slate-200/30";
const filterClass = "focus-ring min-h-11 w-full rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 shadow-sm shadow-slate-200/30";

const typeLabels: Record<string, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  identification: "Identification",
  essay: "Essay"
};

const difficultyLabels: Record<string, string> = {
  easy: "Easy",
  average: "Average",
  hots: "HOTS"
};

function choicesText(choices: Choice[] | null) {
  return (choices ?? [])
    .map((choice) => {
      const value = "value" in choice ? choice.value : choice.key;
      const label = "label" in choice ? choice.label.replace(new RegExp(`^${value}\\.\\s*`), "") : choice.text;
      return `${value}|${label}`;
    })
    .join("\n");
}

function difficultyClass(difficulty: string) {
  if (difficulty === "easy") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (difficulty === "hots") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-sm font-semibold text-slate-700">{children}</span>;
}

function QuestionForm({
  action,
  competencies,
  question,
  submitLabel
}: {
  action: (formData: FormData) => void;
  competencies: CompetencyOption[];
  question?: QuestionBankItem;
  submitLabel: string;
}) {
  const [questionType, setQuestionType] = useState(question?.questionType ?? "multiple_choice");
  const isMultipleChoice = questionType === "multiple_choice";
  const isTrueFalse = questionType === "true_false";
  const isIdentification = questionType === "identification";
  const isEssay = questionType === "essay";

  return (
    <form action={action} className="grid gap-5">
      <label className="grid gap-2">
        <FieldLabel>Competency</FieldLabel>
        <select name="competency_id" defaultValue={question?.competencyId ?? ""} className={fieldClass}>
          <option value="">No competency</option>
          {competencies.map((competency) => (
            <option key={competency.id} value={competency.id}>
              {competency.code ? `${competency.code} - ` : ""}{competency.title}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <FieldLabel>Question</FieldLabel>
        <textarea
          name="question_text"
          required
          rows={4}
          defaultValue={question?.questionText ?? ""}
          className={`${fieldClass} resize-y py-3`}
          placeholder="Write a clear, reusable assessment question."
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="grid gap-2">
          <FieldLabel>Type</FieldLabel>
          <select
            name="question_type"
            required
            value={questionType}
            onChange={(event) => setQuestionType(event.target.value)}
            className={fieldClass}
          >
            <option value="multiple_choice">Multiple Choice</option>
            <option value="true_false">True / False</option>
            <option value="identification">Identification</option>
            <option value="essay">Essay</option>
          </select>
        </label>
        <label className="grid gap-2">
          <FieldLabel>Difficulty</FieldLabel>
          <select name="difficulty" required defaultValue={question?.difficulty ?? "average"} className={fieldClass}>
            <option value="easy">Easy</option>
            <option value="average">Average</option>
            <option value="hots">HOTS</option>
          </select>
        </label>
        <label className="grid gap-2">
          <FieldLabel>Points</FieldLabel>
          <input name="points" type="number" min="1" step="1" required defaultValue={question?.points ?? 1} className={fieldClass} />
        </label>
      </div>

      {isMultipleChoice ? (
        <label className="grid gap-2">
          <FieldLabel>Choices</FieldLabel>
          <textarea
            name="choices"
            required
            rows={5}
            defaultValue={choicesText(question?.choices ?? null)}
            className={`${fieldClass} resize-y py-3 font-mono text-[13px] leading-6`}
            placeholder={"A|Safety goggles\nB|Bare hands\nC|Wet floor\nD|Damaged wire"}
          />
          <span className="text-xs leading-5 text-slate-500">
            Enter one choice per line using <strong>A|Choice text</strong>. Example:
            <code className="mt-1 block whitespace-pre-line font-mono text-[11px] text-slate-600">{"A|Safety goggles\nB|Bare hands\nC|Wet floor\nD|Damaged wire"}</code>
          </span>
        </label>
      ) : null}

      {isTrueFalse ? (
        <label className="grid gap-2">
          <FieldLabel>Correct answer</FieldLabel>
          <select name="correct_answer" required defaultValue={question?.correctAnswer?.toLowerCase() ?? "true"} className={fieldClass}>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
          <span className="text-xs leading-5 text-slate-500">True and False choices are generated automatically.</span>
        </label>
      ) : null}

      {isMultipleChoice || isIdentification ? (
        <label className="grid gap-2">
          <FieldLabel>Correct answer</FieldLabel>
          <input
            name="correct_answer"
            required
            defaultValue={question?.correctAnswer ?? ""}
            className={fieldClass}
            placeholder={isMultipleChoice ? "Enter the choice value, such as A" : "Enter the exact identification answer"}
          />
        </label>
      ) : null}

      <label className="grid gap-2">
        <FieldLabel>{isEssay ? "Teacher notes / rubric guide" : "Explanation"}</FieldLabel>
        <textarea
          name="explanation"
          rows={3}
          defaultValue={question?.explanation ?? ""}
          className={`${fieldClass} resize-y py-3`}
          placeholder={isEssay ? "Optional scoring notes or rubric guidance" : "Optional answer feedback or teaching note"}
        />
      </label>

      {isEssay ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-blue-800">
          Essay responses are checked and scored by the teacher. A correct answer is not required.
        </div>
      ) : null}

      <label className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
        <input name="is_active" type="checkbox" defaultChecked={question?.isActive ?? true} className="h-4 w-4 accent-teal-700" />
        Active in question bank
      </label>

      <button className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700">
        {submitLabel}
      </button>
    </form>
  );
}

function Modal({ title, description, children, onClose, wide = false, extraWide = false }: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  extraWide?: boolean;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-modal-title"
        className={`max-h-[92vh] w-full overflow-y-auto rounded-[1.5rem] border border-white/80 bg-white shadow-2xl shadow-slate-950/20 ${extraWide ? "max-w-6xl" : wide ? "max-w-3xl" : "max-w-2xl"}`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur sm:px-7">
          <div>
            <h2 id="question-modal-title" className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
            {description ? <p className="mt-1.5 text-sm leading-6 text-slate-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 text-xl leading-none text-slate-500 hover:bg-slate-50 hover:text-slate-950"
          >
            ×
          </button>
        </div>
        <div className="p-6 sm:p-7">{children}</div>
      </section>
    </div>
  );
}

function PreviewItem({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</dt>
      <dd className="mt-1.5 text-sm font-medium leading-6 text-slate-800">{children}</dd>
    </div>
  );
}

function QuestionPreview({ question }: { question: QuestionBankItem }) {
  const hasChoices = question.questionType === "multiple_choice" || question.questionType === "true_false";

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Question prompt</p>
        <p className="mt-3 whitespace-pre-wrap text-base font-semibold leading-7 text-slate-950">{question.questionText}</p>
      </div>

      {hasChoices && question.choices?.length ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-950">Choices</h3>
          <ol className="mt-3 grid gap-2">
            {question.choices.map((choice) => (
              <li key={"value" in choice ? `${choice.value}-${choice.label}` : `${choice.key}-${choice.text}`} className="flex gap-3 rounded-xl border border-slate-200/80 px-4 py-3 text-sm text-slate-700">
                <span className="font-semibold text-teal-700">{"value" in choice ? choice.value : choice.key}</span>
                <span>{"label" in choice ? choice.label.replace(new RegExp(`^${choice.value}\\.\\s*`), "") : choice.text}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <dl className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
        <PreviewItem label="Competency">
          {question.competencyCode ? `${question.competencyCode}${question.competencyTitle ? ` - ${question.competencyTitle}` : ""}` : "Unassigned"}
        </PreviewItem>
        <PreviewItem label="Type">{typeLabels[question.questionType] ?? question.questionType}</PreviewItem>
        <PreviewItem label="Difficulty">{difficultyLabels[question.difficulty] ?? question.difficulty}</PreviewItem>
        <PreviewItem label="Points">{question.points} point{question.points === 1 ? "" : "s"}</PreviewItem>
        <PreviewItem label="Status">{question.isActive ? "Active" : "Inactive"}</PreviewItem>
        <PreviewItem label="Correct answer">
          {question.questionType === "essay" ? "Teacher-checked response" : question.correctAnswer || "Not provided"}
        </PreviewItem>
        {question.explanation ? (
          <PreviewItem label={question.questionType === "essay" ? "Teacher notes / rubric guide" : "Explanation"} className="sm:col-span-2">
            <span className="whitespace-pre-wrap">{question.explanation}</span>
          </PreviewItem>
        ) : null}
      </dl>
    </div>
  );
}

export function QuestionBankClient({ questions, competencies, message }: {
  questions: QuestionBankItem[];
  competencies: CompetencyOption[];
  message?: string;
}) {
  const [search, setSearch] = useState("");
  const [competencyFilter, setCompetencyFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modal, setModal] = useState<ModalState>(null);

  const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return questions.filter((question) => {
      const searchableText = [
        question.questionText,
        question.competencyCode,
        question.competencyTitle,
        question.correctAnswer,
        question.explanation
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        (!query || searchableText.includes(query)) &&
        (!competencyFilter || (competencyFilter === "unassigned" ? !question.competencyId : question.competencyId === competencyFilter)) &&
        (!typeFilter || question.questionType === typeFilter) &&
        (!difficultyFilter || question.difficulty === difficultyFilter) &&
        (!statusFilter || (statusFilter === "active" ? question.isActive : !question.isActive))
      );
    });
  }, [competencyFilter, difficultyFilter, questions, search, statusFilter, typeFilter]);

  const hasFilters = Boolean(search || competencyFilter || typeFilter || difficultyFilter || statusFilter);
  const clearFilters = () => {
    setSearch("");
    setCompetencyFilter("");
    setTypeFilter("");
    setDifficultyFilter("");
    setStatusFilter("");
  };

  const confirmDelete = (event: FormEvent<HTMLFormElement>) => {
    if (!window.confirm("Delete this question? It cannot be used in future exams.")) event.preventDefault();
  };

  return (
    <>
      <header className="mb-7 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Teacher</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-5xl">Question Bank</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Search, organize, and reuse EIM assessment questions.</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setModal({ mode: "bulk" })}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-teal-200 hover:text-teal-700"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path d="M12 16V4m0 0L8 8m4-4 4 4M5 15v4h14v-4" /></svg>
            Bulk Upload
          </button>
          <button
            type="button"
            onClick={() => setModal({ mode: "add" })}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:-translate-y-0.5 hover:bg-teal-700"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            Add Question
          </button>
        </div>
      </header>

      {message ? (
        <div role="status" className="mb-6 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm font-semibold text-teal-800">
          {message}
        </div>
      ) : null}

      <section className="overflow-visible rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/50">
        <div className="border-b border-slate-200 bg-slate-50/60 p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(240px,1.5fr)_repeat(4,minmax(140px,0.75fr))]">
            <label className="relative block">
              <span className="sr-only">Search questions</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400">
                <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className={`${filterClass} pl-10`}
                placeholder="Search questions..."
              />
            </label>
            <label>
              <span className="sr-only">Filter by competency</span>
              <select value={competencyFilter} onChange={(event) => setCompetencyFilter(event.target.value)} className={filterClass}>
                <option value="">All competencies</option>
                <option value="unassigned">Unassigned</option>
                {competencies.map((competency) => (
                  <option key={competency.id} value={competency.id}>{competency.code || competency.title}</option>
                ))}
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by question type</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className={filterClass}>
                <option value="">All types</option>
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="identification">Identification</option>
                <option value="essay">Essay</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by difficulty</span>
              <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)} className={filterClass}>
                <option value="">All difficulties</option>
                <option value="easy">Easy</option>
                <option value="average">Average</option>
                <option value="hots">HOTS</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter by status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={filterClass}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex items-center justify-between gap-4 text-xs text-slate-500">
            <p><span className="font-semibold text-slate-700">{filteredQuestions.length}</span> of {questions.length} question{questions.length === 1 ? "" : "s"}</p>
            {hasFilters ? (
              <button type="button" onClick={clearFilters} className="font-semibold text-teal-700 hover:text-teal-900">Clear filters</button>
            ) : null}
          </div>
        </div>

        {filteredQuestions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-white text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  <th className="w-[35%] border-b border-slate-200 px-5 py-3">Question</th>
                  <th className="w-[14%] border-b border-slate-200 px-4 py-3">Competency</th>
                  <th className="border-b border-slate-200 px-4 py-3">Type</th>
                  <th className="border-b border-slate-200 px-4 py-3">Difficulty</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Points</th>
                  <th className="border-b border-slate-200 px-4 py-3">Status</th>
                  <th className="border-b border-slate-200 px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((question) => (
                  <tr key={question.id} className="align-middle text-slate-700 hover:bg-slate-50/70">
                    <td className="border-b border-slate-100 px-5 py-3.5">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: "view", question })}
                        className="line-clamp-2 max-w-xl text-left font-semibold leading-5 text-slate-950 hover:text-teal-700"
                        title={question.questionText}
                      >
                        {question.questionText}
                      </button>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <span className="font-semibold text-slate-700" title={question.competencyTitle ?? undefined}>{question.competencyCode || "Unassigned"}</span>
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-100 px-4 py-3.5 text-slate-600">{typeLabels[question.questionType] ?? question.questionType}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyClass(question.difficulty)}`}>
                        {difficultyLabels[question.difficulty] ?? question.difficulty}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-4 py-3.5 text-center font-semibold tabular-nums text-slate-700">{question.points}</td>
                    <td className="border-b border-slate-100 px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${question.isActive ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${question.isActive ? "bg-teal-500" : "bg-slate-400"}`} />
                        {question.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="border-b border-slate-100 px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button type="button" onClick={() => setModal({ mode: "view", question })} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-700">View</button>
                        <button type="button" onClick={() => setModal({ mode: "edit", question })} className="rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-teal-700">Edit</button>
                        <form action={deleteQuestionAction.bind(null, question.id)} onSubmit={confirmDelete}>
                          <button className="rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-500">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M6 3h9l3 3v15H6z" /><path d="M14 3v4h4M9 12h6M9 16h4" /></svg>
            </div>
            <p className="mt-4 font-semibold text-slate-800">
              {questions.length ? "No questions match your filters." : "No questions yet. Add your first reusable EIM question."}
            </p>
            {questions.length && hasFilters ? (
              <button type="button" onClick={clearFilters} className="mt-3 text-sm font-semibold text-teal-700 hover:text-teal-900">Clear filters</button>
            ) : null}
          </div>
        )}
      </section>

      {modal?.mode === "add" ? (
        <Modal title="Add Question" description="Create a reusable question for quizzes and exams." onClose={() => setModal(null)} wide>
          <QuestionForm action={createQuestionAction} competencies={competencies} submitLabel="Add Question" />
        </Modal>
      ) : null}

      {modal?.mode === "bulk" ? (
        <Modal
          title="Bulk Upload Questions"
          description="Upload an Excel or CSV file, review every row, then import the valid questions."
          onClose={() => setModal(null)}
          extraWide
        >
          <BulkQuestionUpload competencies={competencies} existingQuestions={questions} />
        </Modal>
      ) : null}

      {modal?.mode === "edit" ? (
        <Modal title="Edit Question" description="Update this repository item without leaving the question bank." onClose={() => setModal(null)} wide>
          <QuestionForm
            key={modal.question.id}
            action={updateQuestionAction.bind(null, modal.question.id)}
            competencies={competencies}
            question={modal.question}
            submitLabel="Save Changes"
          />
        </Modal>
      ) : null}

      {modal?.mode === "view" ? (
        <Modal title="Question Preview" description="Review the full reusable question and answer details." onClose={() => setModal(null)} wide>
          <QuestionPreview question={modal.question} />
        </Modal>
      ) : null}
    </>
  );
}
