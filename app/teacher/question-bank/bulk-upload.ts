export const BULK_QUESTION_COLUMNS = [
  "competency_code",
  "question_type",
  "difficulty",
  "question_text",
  "choice_a",
  "choice_b",
  "choice_c",
  "choice_d",
  "correct_answer",
  "points",
  "explanation",
  "is_active"
] as const;

export type BulkQuestionColumn = (typeof BULK_QUESTION_COLUMNS)[number];
export type BulkQuestionRow = Record<BulkQuestionColumn, string> & { sourceRow: number };

type CompetencyReference = { id: string; code: string };
type ExistingQuestionReference = {
  competencyId: string | null;
  questionText: string;
  questionType: string;
};

export type ValidatedBulkQuestion = {
  sourceRow: number;
  row: BulkQuestionRow;
  status: "valid" | "error" | "duplicate";
  messages: string[];
  payload: {
    competencyId: string;
    questionType: "multiple_choice" | "true_false" | "identification" | "essay";
    difficulty: "easy" | "average" | "hots";
    questionText: string;
    choices: { key: string; text: string }[] | null;
    correctAnswer: string | null;
    points: number;
    explanation: string | null;
    isActive: boolean;
  } | null;
};

const questionTypes = ["multiple_choice", "true_false", "identification", "essay"] as const;
const difficulties = ["easy", "average", "hots"] as const;

function textValue(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function createBulkQuestionRow(values: Partial<Record<BulkQuestionColumn, unknown>>, sourceRow: number): BulkQuestionRow {
  return {
    competency_code: textValue(values.competency_code),
    question_type: textValue(values.question_type),
    difficulty: textValue(values.difficulty),
    question_text: textValue(values.question_text),
    choice_a: textValue(values.choice_a),
    choice_b: textValue(values.choice_b),
    choice_c: textValue(values.choice_c),
    choice_d: textValue(values.choice_d),
    correct_answer: textValue(values.correct_answer),
    points: textValue(values.points),
    explanation: textValue(values.explanation),
    is_active: textValue(values.is_active),
    sourceRow
  };
}

function normalizedText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function duplicateKey(questionText: string, competencyId: string, questionType: string) {
  return `${competencyId}::${questionType}::${normalizedText(questionText)}`;
}

function parseActive(value: string) {
  if (!value) return { value: true, error: null };
  const normalized = value.toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return { value: true, error: null };
  if (["false", "no", "0"].includes(normalized)) return { value: false, error: null };
  return { value: true, error: "is_active must be TRUE or FALSE." };
}

export function validateBulkQuestionRows(
  rows: BulkQuestionRow[],
  competencies: CompetencyReference[],
  existingQuestions: ExistingQuestionReference[]
): ValidatedBulkQuestion[] {
  const competenciesByCode = new Map(
    competencies.map((competency) => [competency.code.trim().toUpperCase(), competency])
  );
  const existingKeys = new Set(
    existingQuestions.flatMap((question) =>
      question.competencyId
        ? [duplicateKey(question.questionText, question.competencyId, question.questionType)]
        : []
    )
  );
  const uploadKeys = new Set<string>();

  return rows.map((row) => {
    const messages: string[] = [];
    const competencyCode = row.competency_code.trim().toUpperCase();
    const competency = competenciesByCode.get(competencyCode);
    const questionType = row.question_type.trim().toLowerCase();
    const difficulty = row.difficulty.trim().toLowerCase();
    const questionText = row.question_text.trim();

    if (!competencyCode) messages.push("competency_code is required.");
    else if (!competency) messages.push("Competency code not found.");

    if (!questionType) messages.push("question_type is required.");
    else if (!questionTypes.includes(questionType as (typeof questionTypes)[number])) {
      messages.push("question_type must be multiple_choice, true_false, identification, or essay.");
    }

    if (!difficulty) messages.push("difficulty is required.");
    else if (!difficulties.includes(difficulty as (typeof difficulties)[number])) {
      messages.push("difficulty must be easy, average, or hots.");
    }

    if (!questionText) messages.push("question_text is required.");

    const points = row.points ? Number(row.points) : 1;
    if (!Number.isFinite(points) || points <= 0) messages.push("points must be a number greater than 0.");

    const active = parseActive(row.is_active);
    if (active.error) messages.push(active.error);

    let choices: { key: string; text: string }[] | null = null;
    let correctAnswer: string | null = row.correct_answer.trim() || null;

    if (questionType === "multiple_choice") {
      const choiceEntries = [row.choice_a, row.choice_b, row.choice_c, row.choice_d];
      const missingChoices = choiceEntries.flatMap((choice, index) => choice.trim() ? [] : [String.fromCharCode(65 + index)]);
      if (missingChoices.length) messages.push(`Multiple choice requires choice_${missingChoices.join(", choice_").toLowerCase()}.`);

      choices = choiceEntries.map((choice, index) => {
        const key = String.fromCharCode(65 + index);
        return { key, text: choice.trim() };
      });

      if (!correctAnswer) {
        messages.push("correct_answer is required for multiple_choice.");
      } else {
        const answer = correctAnswer.trim();
        const letter = answer.toUpperCase();
        if (["A", "B", "C", "D"].includes(letter)) {
          correctAnswer = letter;
        } else {
          const matchingIndex = choiceEntries.findIndex((choice) => normalizedText(choice) === normalizedText(answer));
          if (matchingIndex < 0) messages.push("correct_answer must be A, B, C, D, or exact choice text.");
          else correctAnswer = String.fromCharCode(65 + matchingIndex);
        }
      }
    } else if (questionType === "true_false") {
      choices = [
        { key: "true", text: "True" },
        { key: "false", text: "False" }
      ];
      if (!correctAnswer) messages.push("correct_answer is required for true_false.");
      else if (!["true", "false"].includes(correctAnswer.toLowerCase())) messages.push("correct_answer must be True or False.");
      else correctAnswer = correctAnswer.toLowerCase();
    } else if (questionType === "identification") {
      if (!correctAnswer) messages.push("correct_answer is required for identification.");
      choices = null;
    } else if (questionType === "essay") {
      choices = null;
      correctAnswer = null;
    }

    const hasValidEnums = questionTypes.includes(questionType as (typeof questionTypes)[number]) && difficulties.includes(difficulty as (typeof difficulties)[number]);
    const payload = competency && questionText && hasValidEnums && Number.isFinite(points) && points > 0 && !active.error
      ? {
          competencyId: competency.id,
          questionType: questionType as "multiple_choice" | "true_false" | "identification" | "essay",
          difficulty: difficulty as "easy" | "average" | "hots",
          questionText,
          choices,
          correctAnswer,
          points,
          explanation: row.explanation.trim() || null,
          isActive: active.value
        }
      : null;

    if (messages.length || !payload) {
      return { sourceRow: row.sourceRow, row, status: "error" as const, messages, payload: null };
    }

    const key = duplicateKey(payload.questionText, payload.competencyId, payload.questionType);
    if (existingKeys.has(key)) {
      return { sourceRow: row.sourceRow, row, status: "duplicate" as const, messages: ["Duplicate question already exists."], payload };
    }
    if (uploadKeys.has(key)) {
      return { sourceRow: row.sourceRow, row, status: "duplicate" as const, messages: ["Duplicate question appears earlier in this upload."], payload };
    }

    uploadKeys.add(key);
    return { sourceRow: row.sourceRow, row, status: "valid" as const, messages: [], payload };
  });
}
