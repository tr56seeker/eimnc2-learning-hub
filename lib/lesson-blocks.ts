export const lessonBlockTypes = [
  "heading",
  "paragraph",
  "objectives",
  "image",
  "video",
  "definition",
  "safety",
  "procedure",
  "tools_materials",
  "formula",
  "embed",
  "module",
  "module_pdf",
  "activity",
  "checklist",
  "quick_question",
  "reflection",
  "glossary",
  "references",
  "resources"
] as const;

export type LessonBlockType = (typeof lessonBlockTypes)[number];

export type LessonBlock = {
  id: string;
  lesson_id: string;
  block_type: LessonBlockType;
  title: string | null;
  body: string | null;
  image_url: string | null;
  caption: string | null;
  alt_text: string | null;
  metadata: Record<string, unknown> | null;
  display_order: number | null;
  is_active: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export const lessonBlockLabels: Record<LessonBlockType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  objectives: "Objectives",
  image: "Image",
  video: "Video",
  definition: "Definition",
  safety: "Safety Note",
  procedure: "Procedure",
  tools_materials: "Tools and Materials",
  formula: "Formula",
  embed: "Embed / PowerPoint",
  module: "Module / File Link",
  module_pdf: "Module PDF",
  activity: "Activity",
  checklist: "Checklist",
  quick_question: "Quick Question",
  reflection: "Reflection",
  glossary: "Glossary",
  references: "References",
  resources: "Resources"
};

export const lessonBlockDescriptions: Record<LessonBlockType, string> = {
  heading: "Start a new lesson section with a clear heading.",
  paragraph: "Add explanatory lesson text or supporting discussion.",
  objectives: "List what learners should know or be able to do.",
  image: "Add an instructional image with accessible alt text.",
  video: "Embed a playable lesson video from an embed URL or iframe.",
  definition: "Highlight an important technical term and its meaning.",
  safety: "Call attention to hazards, PPE, and safe work practices.",
  procedure: "Create an ordered, step-by-step procedure.",
  tools_materials: "List the tools, equipment, and materials learners need.",
  formula: "Present a formula or calculation in a focused panel.",
  embed: "Embed PowerPoint, OneDrive, Google Drive, YouTube, or another provider.",
  module: "Link or embed a legacy module or file resource.",
  module_pdf: "Embed a PDF learning module inside the lesson.",
  activity: "Give learners an activity, practice task, or external activity link.",
  checklist: "Provide a compact checklist with one item per line.",
  quick_question: "Add a short check-for-understanding question.",
  reflection: "Prompt learners to connect and reflect on what they learned.",
  glossary: "List lesson terms and short definitions.",
  references: "List legacy references or source materials.",
  resources: "List supporting links, references, or further reading."
};

export function isLessonBlockType(value: string): value is LessonBlockType {
  return lessonBlockTypes.includes(value as LessonBlockType);
}

export function extractEmbedSrc(input: string) {
  const value = input.trim();
  if (!value) return "";

  let candidate = value;

  if (/<iframe\b/i.test(value)) {
    const iframeSrc = value.match(
      /<iframe\b[^>]*\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i
    );

    candidate = (iframeSrc?.[1] ?? iframeSrc?.[2] ?? iframeSrc?.[3] ?? "")
      .replace(/&(?:amp|#0*38|#x0*26);/gi, "&")
      .trim();
  }

  if (!candidate) return "";

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? candidate : "";
  } catch {
    return "";
  }
}
