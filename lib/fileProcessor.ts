import path from "path";
import * as pdfParse from "pdf-parse";

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const pdfData = await pdfParse(buffer);
  return pdfData.text || "";
}

/**
 * Extract text from text buffer
 */
export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

/**
 * Process uploaded file from buffer and extract text
 */
export async function processUploadedFile(
  buffer: Buffer,
  fileName: string
): Promise<{ text: string; fileName: string; fileType: string }> {
  const fileExtension = path.extname(fileName).toLowerCase();

  let text = "";

  if (fileExtension === ".pdf") {
    text = await extractTextFromPDF(buffer);
  } else if (
    fileExtension === ".txt" ||
    fileExtension === ".md" ||
    fileExtension === ".mdx"
  ) {
    text = await extractTextFromBuffer(buffer);
  } else {
    throw new Error(
      `Unsupported file type: ${fileExtension}. Supported types: .pdf, .txt, .md`
    );
  }

  // Clean up the text
  text = text
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n\s*\n/g, "\n\n") // Normalize line breaks
    .trim();

  return {
    text,
    fileName,
    fileType: fileExtension.replace(".", ""),
  };
}

/**
 * Validate file before processing
 */
export function validateFile(
  fileName: string,
  bufferSize: number,
  maxSizeInMB: number = 50
): { valid: boolean; error?: string } {
  const extension = path.extname(fileName).toLowerCase();
  const supportedExtensions = [".pdf", ".txt", ".md", ".mdx"];

  if (!supportedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type: ${extension}. Supported types: ${supportedExtensions.join(", ")}`,
    };
  }

  // Check file size
  const fileSizeInMB = bufferSize / (1024 * 1024);

  if (fileSizeInMB > maxSizeInMB) {
    return {
      valid: false,
      error: `File size ${fileSizeInMB.toFixed(2)}MB exceeds maximum ${maxSizeInMB}MB`,
    };
  }

  return { valid: true };
}
