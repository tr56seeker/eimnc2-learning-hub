const fs = require("fs");
const path = "original/xl/worksheets/sheet6.xml";
let xml = fs.readFileSync(path, "utf-8");

// ---- Step 1: fix the AC<row> array formulas + drop the XFD mirror cells ----
// Every XFD<row> cell is exactly "=Z<row>" (a pure mirror at Excel's absolute
// last column, 16384) and its only reader is AC<row>'s remark formula.
// Verify that invariant before touching anything.
{
  const xfdCellRe = /<c r="XFD(\d+)"[^>]*>(?:<f>([^<]*)<\/f>)?/g;
  let match;
  let mirrorCount = 0;
  let emptyCount = 0;
  const badMatches = [];
  while ((match = xfdCellRe.exec(xml)) !== null) {
    const [, row, formula] = match;
    if (formula === undefined) emptyCount++;
    else if (formula === `Z${row}`) mirrorCount++;
    else badMatches.push(`XFD${row} -> ${formula}`);
  }
  console.log(`XFD cells: ${mirrorCount} mirror-formula, ${emptyCount} empty, ${badMatches.length} unexpected`);
  if (badMatches.length > 0) {
    console.error("ABORTING: unexpected XFD formulas found:", badMatches);
    process.exit(1);
  }

  xml = xml.replace(/(<f t="array" ref="AC(\d+)">)([^<]*)(<\/f>)/g, (whole, open, row, body, close) => {
    const fixedBody = body.split(`XFD${row}`).join(`Z${row}`);
    return `${open}${fixedBody}${close}`;
  });

  xml = xml.replace(/<c r="XFD\d+"[^/]*?\/>/g, "");
  xml = xml.replace(/<c r="XFD\d+"[^>]*>.*?<\/c>/g, "");

  xml = xml.replace('<dimension ref="A1:XFD120"/>', '<dimension ref="A1:BE120"/>');
}

// ---- Step 2: strip the garbage dataValidation ranges ----
// This sheet's used range is A1:BE120. A large number of dataValidation
// rules on this sheet contain range tokens far outside that (rows repeating
// every 65536 — the old Excel 97-2003 row-limit boundary — out past row
// 900,000, and columns out past "XFD"). This is leftover corruption, not
// intentional design: legitimate content never referenced those cells.
// Match each *whole* <dataValidation>...</dataValidation> or self-closing
// <dataValidation .../> element (not just its opening tag), so dropping a
// garbage rule can't orphan a closing tag or child <formula1> content.
function colToNum(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
const MAX_ROW = 500;
const MAX_COL = 150;
function tokenWithinBounds(token) {
  const cellRefRe = /([A-Z]+)(\d+)/g;
  let m;
  while ((m = cellRefRe.exec(token)) !== null) {
    const [, col, row] = m;
    if (Number(row) > MAX_ROW || colToNum(col) > MAX_COL) return false;
  }
  return true;
}

const dvElementRe = /<dataValidation\b[^>]*?sqref="[^"]*"[^>]*?(?:\/>|>[\s\S]*?<\/dataValidation>)/g;
let removedTokens = 0;
let keptTokens = 0;
let droppedRules = 0;
let keptRules = 0;

xml = xml.replace(dvElementRe, (whole) => {
  const sqrefMatch = whole.match(/sqref="([^"]*)"/);
  if (!sqrefMatch) return whole; // shouldn't happen, leave untouched
  const tokens = sqrefMatch[1].split(" ").filter(Boolean);
  const kept = tokens.filter(tokenWithinBounds);
  removedTokens += tokens.length - kept.length;
  keptTokens += kept.length;

  if (kept.length === 0) {
    droppedRules++;
    return ""; // whole element (opening tag + any children + closing tag) removed
  }
  keptRules++;
  return whole.replace(/sqref="[^"]*"/, `sqref="${kept.join(" ")}"`);
});

fs.writeFileSync(path, xml);

console.log(`dataValidation rules kept: ${keptRules}, dropped: ${droppedRules}`);
console.log(`sqref tokens kept: ${keptTokens}, removed: ${removedTokens}`);
console.log("final file size:", fs.statSync(path).size, "bytes");

// ---- Step 3: well-formedness sanity check using the real XML parser exceljs itself uses ----
const saxes = require("../node_modules/saxes");
const parser = new saxes.SaxesParser();
let errorCount = 0;
parser.on("error", (e) => {
  errorCount++;
  if (errorCount <= 5) console.error("PARSE ERROR:", e.message);
});
parser.write(xml).close();
if (errorCount > 0) {
  console.error(`ABORTING: XML is malformed after edits (${errorCount} parse errors).`);
  process.exit(1);
}
console.log("XML is well-formed (verified with saxes, the same parser exceljs uses).");
