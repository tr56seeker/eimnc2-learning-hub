const fs = require("fs");

// Every sheet in this template has the same corruption: a huge block of
// hidden (or, in sheet6/7's case, one trailing wildcard) <col> definitions
// stretching out to column 16384 (XFD), tens of thousands of style-only
// empty <c> cells scattered across that range, and dataValidation sqref
// tokens referencing rows/columns far outside the sheet's real content.
// This bloats file size, makes ExcelJS slow/hang while parsing, and (via
// stray column-16384 definitions) makes ExcelJS's data-validation range
// optimizer compute an out-of-bounds column 16385 on write.
//
// Real used-range column boundary per sheet (confirmed from the last
// non-corrupted <col> width definitions and actual export code in
// DepedClassRecordExportButton.tsx, which only ever writes within these
// bounds). Row bounds come from the sheet's real <row> elements, which are
// NOT corrupted (only dataValidation sqref rows reach into the millions).
const SHEET_BOUNDS = {
  1: { maxCol: 30, maxRow: 100 }, // INSTRUCTIONS (real content: A1:W82)
  2: { maxCol: 25, maxRow: 100 }, // INPUT DATA   (real content: A1:Q69)
  3: { maxCol: 35, maxRow: 150 }, // TERM 1       (real content: A1:AC130)
  4: { maxCol: 35, maxRow: 150 }, // TERM 2       (real content: A1:AC130)
  5: { maxCol: 35, maxRow: 150 }, // TERM 3       (real content: A1:AC130)
  6: { maxCol: 150, maxRow: 500 }, // SUMMARY      (real content: A1:BE120)
  7: { maxCol: 140, maxRow: 250 }, // Helper       (real content: A1:DZ204)
};

function colToNum(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
function numToCol(n) {
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

const saxes = require("../node_modules/saxes");
function assertWellFormed(xml, label) {
  const parser = new saxes.SaxesParser();
  let errorCount = 0;
  parser.on("error", (e) => {
    errorCount++;
    if (errorCount <= 3) console.error(`PARSE ERROR in ${label}:`, e.message);
  });
  parser.write(xml).close();
  if (errorCount > 0) {
    console.error(`ABORTING: ${label} malformed after edits.`);
    process.exit(1);
  }
}

for (const [n, {maxCol, maxRow}] of Object.entries(SHEET_BOUNDS)) {
  const path = `original/xl/worksheets/sheet${n}.xml`;
  let xml = fs.readFileSync(path, "utf-8");
  const startSize = xml.length;

  // ---- strip <c> cells outside the real bounds ----
  let cellsRemoved = 0;
  let cellsKept = 0;
  xml = xml.replace(/<c r="([A-Z]+)(\d+)"[^>]*?(?:\/>|>[\s\S]*?<\/c>)/g, (whole, col, row) => {
    if (colToNum(col) > maxCol || Number(row) > maxRow) {
      cellsRemoved++;
      return "";
    }
    cellsKept++;
    return whole;
  });

  // ---- strip / cap <col> definitions outside the real bounds ----
  let colsRemoved = 0;
  let colsCapped = 0;
  xml = xml.replace(/<col ([^>]*?)\/>/g, (whole, attrs) => {
    const minMatch = attrs.match(/min="(\d+)"/);
    const maxMatch = attrs.match(/max="(\d+)"/);
    if (!minMatch || !maxMatch) return whole;
    const min = Number(minMatch[1]);
    const max = Number(maxMatch[1]);
    if (min > maxCol) {
      colsRemoved++;
      return "";
    }
    if (max > maxCol) {
      colsCapped++;
      return `<col ${attrs.replace(/max="\d+"/, `max="${maxCol}"`)}/>`;
    }
    return whole;
  });

  // ---- strip garbage dataValidation sqref tokens outside the real bounds ----
  function tokenWithinBounds(token) {
    const cellRefRe = /([A-Z]+)(\d+)/g;
    let m;
    while ((m = cellRefRe.exec(token)) !== null) {
      const [, col, row] = m;
      if (Number(row) > maxRow || colToNum(col) > maxCol) return false;
    }
    return true;
  }
  let dvDropped = 0;
  let dvKept = 0;
  xml = xml.replace(
    /<dataValidation\b[^>]*?sqref="[^"]*"[^>]*?(?:\/>|>[\s\S]*?<\/dataValidation>)/g,
    (whole) => {
      const sqrefMatch = whole.match(/sqref="([^"]*)"/);
      if (!sqrefMatch) return whole;
      const tokens = sqrefMatch[1].split(" ").filter(Boolean);
      const kept = tokens.filter(tokenWithinBounds);
      if (kept.length === 0) {
        dvDropped++;
        return "";
      }
      dvKept++;
      return whole.replace(/sqref="[^"]*"/, `sqref="${kept.join(" ")}"`);
    }
  );

  // ---- recompute a real <dimension> from what's left ----
  let realMaxCol = 1;
  let realMaxRow = 1;
  const cellRe = /<c r="([A-Z]+)(\d+)"/g;
  let m;
  while ((m = cellRe.exec(xml)) !== null) {
    realMaxCol = Math.max(realMaxCol, colToNum(m[1]));
    realMaxRow = Math.max(realMaxRow, Number(m[2]));
  }
  xml = xml.replace(/<dimension ref="[^"]*"\/>/, `<dimension ref="A1:${numToCol(realMaxCol)}${realMaxRow}"/>`);

  fs.writeFileSync(path, xml);
  assertWellFormed(xml, `sheet${n}.xml`);

  console.log(
    `sheet${n}.xml: ${startSize} -> ${xml.length} bytes | cells kept ${cellsKept} removed ${cellsRemoved} | ` +
      `cols capped ${colsCapped} removed ${colsRemoved} | dataValidation kept ${dvKept} dropped ${dvDropped} | ` +
      `dimension -> A1:${numToCol(realMaxCol)}${realMaxRow}`
  );
}
