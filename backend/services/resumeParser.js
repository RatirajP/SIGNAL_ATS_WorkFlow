/**
 * resumeParser.js
 * ---------------------------------------------------------------------------
 * Resumes arrive as files (PDF, DOCX, or plain text), but the scoring engine
 * only understands plain text. This module is the bridge: given a file on
 * disk, it returns the extracted text, regardless of format.
 *
 * - PDF  -> pdf-parse   (reads the embedded text layer of the PDF)
 * - DOCX -> mammoth      (reads the XML inside the .docx zip)
 * - TXT  -> read directly
 *
 * Note: this only works for text-based PDFs. A scanned/photographed resume
 * with no text layer would need OCR (e.g. Tesseract) — flagged in the
 * README as a "next step" rather than built here, to keep the dependency
 * footprint appropriate for a portfolio project.
 * ---------------------------------------------------------------------------
 */

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

async function extractTextFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (ext === ".docx") {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }

  throw new Error(`Unsupported resume file type: ${ext}`);
}

/** Best-effort guess at the candidate's name: first non-empty line of the resume. */
function guessName(resumeText) {
  const firstLine = resumeText
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0 && line.length < 60);
  return firstLine || "Unknown Candidate";
}

module.exports = { extractTextFromFile, guessName };
