const fs = require("fs");
const path = "original/xl/worksheets/sheet6.xml";
let xml = fs.readFileSync(path, "utf-8");

function colToNum(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

// Safe bounds: real used range on this sheet is A1:BE120. Give generous
// headroom (row <= 500, column <= 150 ~ "FT") so nothing legitimate is cut,
// while dropping the garbage ranges that repeat every 65536 rows out past
// row 900,000+ and columns out past "JA"/"XFD".
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

let removedTokens = 0;
let keptTokens = 0;
let removedEmptyDV = 0;

xml = xml.replace(/<dataValidation ([^>]*)sqref="([^"]*)"([^>]*)(\/?)>/g, (whole, pre, sqref, post, selfClose) => {
  const tokens = sqref.split(" ").filter(Boolean);
  const kept = tokens.filter(tokenWithinBounds);
  removedTokens += tokens.length - kept.length;
  keptTokens += kept.length;

  if (kept.length === 0) {
    removedEmptyDV++;
    return ""; // whole rule only ever applied to garbage cells; drop it
  }
  return `<dataValidation ${pre}sqref="${kept.join(" ")}"${post}${selfClose}>`;
});

// Clean up any now-empty <dataValidation ...></dataValidation> open/close pairs
// left behind if a rule had a body instead of being self-closing (none expected
// here since these are all self-closing, but guard anyway).
xml = xml.replace(/<dataValidation[^>]*sqref=""[^>]*\/>/g, "");

fs.writeFileSync(path, xml);

console.log("kept tokens:", keptTokens, "removed tokens:", removedTokens, "fully-removed rules:", removedEmptyDV);
console.log("new file size:", fs.statSync(path).size, "bytes");
