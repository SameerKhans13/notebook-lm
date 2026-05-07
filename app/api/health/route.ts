import { NextResponse } from "next/server";
import { Pool } from "pg";

export async function GET() {
  const health: any = {
    status: "ok",
    timestamp: new Date().toISOString(),
    database: "unknown"
  };

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 2000,
    });
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    await pool.end();
    health.database = "connected";
  } catch (err: any) {
    health.database = "error";
    health.databaseError = err.message;
  }

  return NextResponse.json(health);
}
