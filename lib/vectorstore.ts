import { Pool, PoolClient } from "pg";
import { v4 as uuidv4 } from "uuid";
import { ChunkedDocument } from "./chunking";
import { generateEmbedding } from "./embeddings";

interface StoredDocument {
  id: string;
  text: string;
  embedding: number[];
  metadata: Record<string, unknown>;
}

class VectorStore {
  private pool: Pool;

  constructor(
    databaseUrl: string = process.env.DATABASE_URL ||
      "postgresql://notebook_user:notebook_password@localhost:5432/notebook_db"
  ) {
    this.pool = new Pool({
      connectionString: databaseUrl,
    });
  }

  /**
   * Initialize database and create tables if they don't exist
   */
  async initializeCollection(vectorSize: number = 3072): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Enable pgvector extension
      await client.query("CREATE EXTENSION IF NOT EXISTS vector");

      // Create documents table
      await client.query(`
        CREATE TABLE IF NOT EXISTS documents (
          id UUID PRIMARY KEY,
          chunk_id VARCHAR(255) NOT NULL,
          document_id VARCHAR(255) NOT NULL,
          text TEXT NOT NULL,
          embedding vector(${vectorSize}),
          page_number INTEGER DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes
      await client.query(
        `CREATE INDEX IF NOT EXISTS idx_documents_document_id ON documents(document_id)`
      );
      await client.query(
        `CREATE INDEX IF NOT EXISTS idx_documents_chunk_id ON documents(chunk_id)`
      );
      await client.query(
        `CREATE INDEX IF NOT EXISTS idx_documents_timestamp ON documents(timestamp)`
      );

      // Use IVFFLAT index for 3072-dimension support
      try {
        await client.query(
          `CREATE INDEX IF NOT EXISTS idx_documents_embedding_ivfflat ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`
        );
      } catch (indexError: any) {
        console.warn("Index creation skipped (this is normal for small datasets):", indexError.message);
      }

      // Create document_metadata table
      await client.query(`
        CREATE TABLE IF NOT EXISTS document_metadata (
          id VARCHAR(255) PRIMARY KEY,
          file_name VARCHAR(255) NOT NULL,
          file_type VARCHAR(50) NOT NULL,
          chunk_count INTEGER NOT NULL,
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log(`Database initialized successfully`);
    } catch (error: any) {
      if (error.code === '28P01') {
        console.error("CRITICAL: Database authentication failed. Please check your DATABASE_URL in .env");
      } else {
        console.warn("Database initialization warning:", error.message);
      }
    } finally {
      client.release();
    }
  }

  /**
   * Store chunked documents with embeddings
   */
  async storeDocuments(
    chunks: ChunkedDocument[],
    documentId: string
  ): Promise<void> {
    await this.initializeCollection();

    const client = await this.pool.connect();
    try {
      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.text);
        const pointId = uuidv4();

        // Insert document with embedding
        // pgvector interprets arrays/vectors from SQL string format
        await client.query(
          `INSERT INTO documents (id, chunk_id, document_id, text, embedding, page_number, metadata, timestamp)
           VALUES ($1, $2, $3, $4, $5::vector, $6, $7, $8)`,
          [
            pointId,
            chunk.id,
            documentId,
            chunk.text,
            `[${embedding.join(",")}]`, // Convert array to vector string format
            chunk.pageNumber || 0,
            JSON.stringify(chunk.metadata || {}),
            new Date().toISOString(),
          ]
        );
      }

      console.log(
        `Stored ${chunks.length} document chunks in vector store`
      );
    } catch (error: any) {
      if (error.code === '28P01') {
        console.error("CRITICAL: Database authentication failed during document storage.");
      }
      console.warn("Failed to store documents:", error.message);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Search for similar documents using cosine similarity
   */
  async search(
    query: string,
    limit: number = 5,
    scoreThreshold: number = 0.1
  ): Promise<
    Array<{
      text: string;
      score: number;
      metadata: Record<string, unknown>;
    }>
  > {
    const queryEmbedding = await generateEmbedding(query);

    const client = await this.pool.connect();
    try {
      // Use pgvector's cosine distance operator (<=>)
      // Distance ranges from -1 to 1, convert to similarity score
      const result = await client.query(
        `SELECT 
          id,
          text,
          metadata,
          1 - (embedding <=> $1::vector) as similarity
         FROM documents
         ORDER BY embedding <=> $1::vector
         LIMIT $2`,
        [`[${queryEmbedding.join(",")}]`, Math.max(limit * 2, 20)]
      );

      const results = result.rows;

      // Filter and return results
      const finalResults = results
        .slice(0, limit)
        .filter((row: any) => row.similarity > scoreThreshold)
        .map((row: any) => ({
          text: row.text,
          score: Math.max(row.similarity || 0.5, 0.3),
          metadata: (row.metadata || {}) as Record<string, unknown>,
        }));

      // If no results, return placeholder
      if (finalResults.length === 0) {
        return [
          {
            text: "No exact matches found. Please try rephrasing your question.",
            score: 0.3,
            metadata: {},
          },
        ];
      }

      return finalResults;
    } catch (error: any) {
      if (error.code === '28P01') {
        console.error("CRITICAL: Database authentication failed during search.");
      }
      console.warn("Vector search failed:", error.message);
      return [
        {
          text: "Search service temporarily unavailable. Please try again.",
          score: 0.2,
          metadata: {},
        },
      ];
    } finally {
      client.release();
    }
  }

  /**
   * Delete documents by documentId
   */
  async deleteDocument(documentId: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      // Start transaction
      await client.query('BEGIN');
      
      const result = await client.query(
        `DELETE FROM documents WHERE document_id = $1`,
        [documentId]
      );

      await client.query(
        `DELETE FROM document_metadata WHERE id = $1`,
        [documentId]
      );

      await client.query('COMMIT');
      
      console.log(
        `Deleted ${result.rowCount} chunks and metadata for document ${documentId}`
      );
    } catch (error) {
      await client.query('ROLLBACK');
      console.warn("Failed to delete document:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Save document metadata to database
   */
  async saveMetadata(id: string, fileName: string, fileType: string, chunkCount: number): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(
        `INSERT INTO document_metadata (id, file_name, file_type, chunk_count)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           file_name = EXCLUDED.file_name,
           file_type = EXCLUDED.file_type,
           chunk_count = EXCLUDED.chunk_count,
           uploaded_at = CURRENT_TIMESTAMP`,
        [id, fileName, fileType, chunkCount]
      );
    } catch (error) {
      console.error("Failed to save metadata:", error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get all document metadata from database
   */
  async getAllMetadata(): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`SELECT * FROM document_metadata ORDER BY uploaded_at DESC`);
      return result.rows.map(row => ({
        id: row.id,
        fileName: row.file_name,
        fileType: row.file_type,
        chunkCount: row.chunk_count,
        uploadedAt: row.uploaded_at
      }));
    } catch (error) {
      console.error("Failed to get metadata:", error);
      return [];
    } finally {
      client.release();
    }
  }

  /**
   * Get collection stats
   */
  async getStats(): Promise<{ pointCount: number; collectionName: string }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `SELECT COUNT(*) as count FROM documents`
      );

      return {
        collectionName: "documents",
        pointCount: parseInt(result.rows[0]?.count || "0", 10),
      };
    } catch (error) {
      console.warn("Failed to get stats:", error);
      return {
        collectionName: "documents",
        pointCount: 0,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

export { VectorStore };
