export const lessonBlockTypes = [
  "heading",
  "paragraph",
  "image",
  "definition",
  "safety",
  "procedure",
  "tools_materials",
  "formula",
  "embed",
  "module",
  "activity",
  "glossary",
  "references"
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
  image: "Image",
  definition: "Definition",
  safety: "Safety Callout",
  procedure: "Procedure",
  tools_materials: "Tools and Materials",
  formula: "Formula",
  embed: "Embed",
  module: "Module / File Link",
  activity: "Activity",
  glossary: "Glossary",
  references: "References"
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
