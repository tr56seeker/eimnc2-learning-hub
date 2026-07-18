import type JSZip from "jszip";

// Direct XML-level editing of .xlsx worksheet parts.
//
// Why not just use exceljs to load, mutate cells, and write back? Because exceljs's
// writer rebuilds styles.xml from scratch on every write, renumbering and losing style
// records in the process (verified: a 174KB styles.xml round-tripped down to 130KB, with
// the same cell's style index changing from s="634" to s="119"). For a hand-built DepEd
// template with hundreds of styled cells, that's enough drift that Excel treats the
// result as damaged and strips formatting on open. Editing the raw <c> XML nodes directly
// — and never touching styles.xml/theme.xml at all — sidesteps that entirely.

function getAttr(tagXml: string, attrName: string): string | null {
  const match = tagXml.match(new RegExp(`${attrName}="([^"]*)"`));
  return match ? match[1] : null;
}

/** Maps sheet name (e.g. "TERM 1") to its worksheet XML path (e.g. "xl/worksheets/sheet3.xml"). */
export async function mapSheetNameToPath(zip: JSZip): Promise<Record<string, string>> {
  const workbookXml = await zip.file("xl/workbook.xml")!.async("string");
  const relsXml = await zip.file("xl/_rels/workbook.xml.rels")!.async("string");

  const relTargetById = new Map<string, string>();
  for (const tag of relsXml.match(/<Relationship\b[^>]*\/>/g) ?? []) {
    const id = getAttr(tag, "Id");
    const target = getAttr(tag, "Target");
    if (id && target) relTargetById.set(id, target.replace(/^\//, ""));
  }

  const nameToPath: Record<string, string> = {};
  for (const tag of workbookXml.match(/<sheet\b[^>]*\/>/g) ?? []) {
    const name = getAttr(tag, "name");
    const rId = getAttr(tag, "r:id");
    const target = rId ? relTargetById.get(rId) : null;
    if (name && target) nameToPath[name] = target.startsWith("xl/") ? target : `xl/${target}`;
  }
  return nameToPath;
}

function cellRegexes(ref: string) {
  return {
    // The negative lookbehind before the final ">" is load-bearing: without it, "[^>]*"
    // can swallow a self-closing tag's trailing "/" and this "opening tag" pattern would
    // then greedily consume everything up to the *next* "</c>" anywhere later in the
    // document — silently destroying every cell in between. Caught this via a live export
    // test where only the first cell written actually landed and everything after it in
    // the sheet came back empty.
    full: new RegExp(`<c r="${ref}"([^>]*)(?<!/)>((?:(?!</c>)[\\s\\S])*)</c>`),
    selfClosing: new RegExp(`<c r="${ref}"([^>]*)/>`)
  };
}

function stylePart(attrs: string): string {
  const match = attrs.match(/\bs="(\d+)"/);
  return match ? ` s="${match[1]}"` : "";
}

function escapeXmlText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Blanks a cell's value while preserving its style index. Leaves formula cells untouched. */
export function clearCell(xml: string, ref: string): string {
  const { full, selfClosing } = cellRegexes(ref);
  if (full.test(xml)) {
    return xml.replace(full, (whole, attrs: string, inner: string) => {
      if (inner.includes("<f>") || inner.includes("<f ")) return whole;
      return `<c r="${ref}"${stylePart(attrs)}/>`;
    });
  }
  if (selfClosing.test(xml)) {
    return xml.replace(selfClosing, (whole, attrs: string) => `<c r="${ref}"${stylePart(attrs)}/>`);
  }
  return xml;
}

/** Writes a numeric value into a cell, preserving its style index. Leaves formula cells untouched. */
export function setNumberCell(xml: string, ref: string, value: number): string {
  const { full, selfClosing } = cellRegexes(ref);
  if (full.test(xml)) {
    return xml.replace(full, (whole, attrs: string, inner: string) => {
      if (inner.includes("<f>") || inner.includes("<f ")) return whole;
      return `<c r="${ref}"${stylePart(attrs)}><v>${value}</v></c>`;
    });
  }
  if (selfClosing.test(xml)) {
    return xml.replace(selfClosing, (whole, attrs: string) => `<c r="${ref}"${stylePart(attrs)}><v>${value}</v></c>`);
  }
  return xml;
}

/** Writes a text value into a cell (as an inline string), preserving its style index. */
export function setStringCell(xml: string, ref: string, value: string): string {
  const escaped = escapeXmlText(value);
  const { full, selfClosing } = cellRegexes(ref);
  if (full.test(xml)) {
    return xml.replace(full, (whole, attrs: string, inner: string) => {
      if (inner.includes("<f>") || inner.includes("<f ")) return whole;
      return `<c r="${ref}"${stylePart(attrs)} t="inlineStr"><is><t xml:space="preserve">${escaped}</t></is></c>`;
    });
  }
  if (selfClosing.test(xml)) {
    return xml.replace(selfClosing, (whole, attrs: string) => `<c r="${ref}"${stylePart(attrs)} t="inlineStr"><is><t xml:space="preserve">${escaped}</t></is></c>`);
  }
  return xml;
}

/** 1-based column index to spreadsheet column letters (1 -> "A", 27 -> "AA"). */
export function columnLetters(index: number): string {
  let name = "";
  let n = index;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}
