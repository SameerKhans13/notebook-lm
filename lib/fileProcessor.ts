import fs from "fs";
import path from "path";
import * as pdfParse from "pdf-parse";

/**
 * Extract text from PDF file
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath);
  const pdfData = await pdfParse(fileContent);
  
  // pdfData.text already contains the full text from all pages
  return pdfData.text || "";
}

/**
 * Extract text from plain text file
 */
export async function extractTextFromFile(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, "utf-8");
}

/**
 * Process uploaded file and extract text
 */
export async function processUploadedFile(
  filePath: string
): Promise<{ text: string; fileName: string; fileType: string }> {
  const fileName = path.basename(filePath);
  const fileExtension = path.extname(filePath).toLowerCase();

  let text = "";

  if (fileExtension === ".pdf") {
    text = await extractTextFromPDF(filePath);
  } else if (
    fileExtension === ".txt" ||
    fileExtension === ".md" ||
    fileExtension === ".mdx"
  ) {
    text = await extractTextFromFile(filePath);
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
  filePath: string,
  maxSizeInMB: number = 50
): { valid: boolean; error?: string } {
  const extension = path.extname(filePath).toLowerCase();
  const supportedExtensions = [".pdf", ".txt", ".md", ".mdx"];

  if (!supportedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `Unsupported file type: ${extension}. Supported types: ${supportedExtensions.join(", ")}`,
    };
  }

  // Check file size
  try {
    const stats = fs.statSync(filePath);
    const fileSizeInMB = stats.size / (1024 * 1024);

    if (fileSizeInMB > maxSizeInMB) {
      return {
        valid: false,
        error: `File size ${fileSizeInMB.toFixed(2)}MB exceeds maximum ${maxSizeInMB}MB`,
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: "Failed to read file",
    };
  }

  return { valid: true };
}
