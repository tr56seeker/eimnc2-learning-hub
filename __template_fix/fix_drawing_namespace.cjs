const fs = require("fs");

// ExcelJS's drawing parser only recognizes elements under the "xdr:" prefix
// (xdr:wsDr, xdr:twoCellAnchor, xdr:pic, ...). This template's drawingN.xml
// files declare that same namespace as the *default* xmlns instead, so every
// element is unprefixed. ExcelJS's sax handler matches tag names literally
// (including prefix), so it never recognizes the root <wsDr> node, silently
// parses the whole drawing as undefined, and later crashes on
// `drawing.anchors` when reconciling. Fix: rename every spreadsheetDrawing-
// namespace element to carry the xdr: prefix ExcelJS expects. Elements
// already in the drawingml "main" namespace (a:blip, a:xfrm, etc.) are
// untouched.
const TAGS = [
  "wsDr",
  "twoCellAnchor",
  "oneCellAnchor",
  "from",
  "to",
  "ext",
  "col",
  "colOff",
  "row",
  "rowOff",
  "pic",
  "nvPicPr",
  "cNvPr",
  "cNvPicPr",
  "blipFill",
  "spPr",
  "clientData",
];

for (let n = 1; n <= 6; n++) {
  const path = `original/xl/drawings/drawing${n}.xml`;
  let xml = fs.readFileSync(path, "utf-8");
  const before = xml;

  for (const tag of TAGS) {
    xml = xml.replace(new RegExp(`<${tag}(?=[ />])`, "g"), `<xdr:${tag}`);
    xml = xml.replace(new RegExp(`</${tag}>`, "g"), `</xdr:${tag}>`);
  }

  xml = xml.replace(
    '<xdr:wsDr xmlns="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing">',
    '<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">'
  );

  fs.writeFileSync(path, xml);
  console.log(`drawing${n}.xml: ${before.length} -> ${xml.length} bytes`);
}

// well-formedness sanity check
const saxes = require("../node_modules/saxes");
for (let n = 1; n <= 6; n++) {
  const path = `original/xl/drawings/drawing${n}.xml`;
  const xml = fs.readFileSync(path, "utf-8");
  const parser = new saxes.SaxesParser();
  let errorCount = 0;
  parser.on("error", (e) => {
    errorCount++;
    if (errorCount <= 3) console.error(`PARSE ERROR in drawing${n}.xml:`, e.message);
  });
  parser.write(xml).close();
  if (errorCount > 0) {
    console.error(`ABORTING: drawing${n}.xml malformed after edits.`);
    process.exit(1);
  }
}
console.log("all drawing XML files well-formed after namespace fix.");
