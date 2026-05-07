import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { processUploadedFile, validateFile } from "@/lib/fileProcessor";
import { chunkDocument } from "@/lib/chunking";
import { VectorStore } from "@/lib/vectorstore";

// Store metadata about uploaded documents in a simple JSON file
const DOCUMENTS_DB_PATH = path.join(process.cwd(), "data", "documents.json");

interface DocumentMetadata {
  id: string;
  fileName: string;
  fileType: string;
  uploadedAt: string;
  textLength: number;
  chunkCount: number;
}

function ensureDataDir() {
  const dataDir = path.dirname(DOCUMENTS_DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadDocumentsDb(): Record<string, DocumentMetadata> {
  ensureDataDir();
  if (fs.existsSync(DOCUMENTS_DB_PATH)) {
    return JSON.parse(fs.readFileSync(DOCUMENTS_DB_PATH, "utf-8"));
  }
  return {};
}

function saveDocumentsDb(db: Record<string, DocumentMetadata>) {
  ensureDataDir();
  fs.writeFileSync(DOCUMENTS_DB_PATH, JSON.stringify(db, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Create temp directory for uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Save file temporarily
    const tempFilePath = path.join(uploadDir, file.name);
    const buffer = await file.arrayBuffer();
    fs.writeFileSync(tempFilePath, Buffer.from(buffer));

    // Validate file
    const validation = validateFile(tempFilePath);
    if (!validation.valid) {
      fs.unlinkSync(tempFilePath);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Process file
    const { text, fileName, fileType } = await processUploadedFile(tempFilePath);

    // Chunk the document
    const chunks = await chunkDocument(text);

    // Generate document ID
    const documentId = uuidv4();

    // Store in vector database
    const vectorStore = new VectorStore();
    await vectorStore.storeDocuments(chunks, documentId);

    // Update documents metadata
    const documentsDb = loadDocumentsDb();
    documentsDb[documentId] = {
      id: documentId,
      fileName,
      fileType,
      uploadedAt: new Date().toISOString(),
      textLength: text.length,
      chunkCount: chunks.length,
    };
    saveDocumentsDb(documentsDb);

    // Clean up temp file
    fs.unlinkSync(tempFilePath);

    return NextResponse.json({
      success: true,
      documentId,
      fileName,
      chunkCount: chunks.length,
      message: "Document uploaded and indexed successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file: " + String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const documentsDb = loadDocumentsDb();
    const documents = Object.values(documentsDb);
    
    return NextResponse.json({
      success: true,
      documents,
      total: documents.length,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    // Delete from vector store
    const vectorStore = new VectorStore();
    await vectorStore.deleteDocument(documentId);

    // Update documents metadata
    const documentsDb = loadDocumentsDb();
    delete documentsDb[documentId];
    saveDocumentsDb(documentsDb);

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete document: " + String(error) },
      { status: 500 }
    );
  }
}
