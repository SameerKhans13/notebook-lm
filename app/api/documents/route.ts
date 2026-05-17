import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { processUploadedFile, validateFile } from "@/lib/fileProcessor";
import { chunkDocument } from "@/lib/chunking";
import { VectorStore } from "@/lib/vectorstore";

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

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(buffer);

    // Validate file (using buffer size instead of file path)
    const validation = validateFile(file.name, fileBuffer.length);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Process file from buffer (no disk writes)
    const { text, fileName, fileType } = await processUploadedFile(
      fileBuffer,
      file.name
    );

    // Chunk the document
    const chunks = await chunkDocument(text);

    // Generate document ID
    const documentId = uuidv4();

    // Store in vector database
    const vectorStore = new VectorStore();
    
    try {
      await vectorStore.storeDocuments(chunks, documentId);
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      
      // Provide helpful error message for connection issues
      if (dbError.code === 'ECONNREFUSED' || dbError.code === 'ETIMEDOUT' || dbError.message?.includes('ETIMEDOUT')) {
        return NextResponse.json(
          { 
            error: "Database connection failed. Please ensure DATABASE_URL is configured correctly in your environment variables.",
            details: dbError.message
          },
          { status: 503 }
        );
      }
      
      throw dbError;
    }

    // Save document metadata to database
    await vectorStore.saveMetadata(
      documentId,
      fileName,
      fileType,
      chunks.length
    );

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
    const vectorStore = new VectorStore();
    const documents = await vectorStore.getAllMetadata();

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

    // Delete from vector store (this also deletes metadata)
    const vectorStore = new VectorStore();
    await vectorStore.deleteDocument(documentId);

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
