import db from "@/lib/init-db";
import { NextResponse } from "next/server";
import { encrypt, isEncrypted } from "@/lib/crypto";

export async function GET() {
  const stmt = db.prepare("SELECT * FROM connections ORDER BY id DESC");
  const connections = stmt.all();
  return NextResponse.json(connections);
}

export async function POST(req: Request) {
  const data = await req.json();
  const hasPassword = !!data.password && data.password.length > 0;

  const stmt = db.prepare(`
    INSERT INTO connections (
      connection_name, connection_type, server,
      port, database_name, username, password, file_path
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.connection_name,
    data.connection_type,
    data.server,
    data.port,
    data.database_name,
    data.username,
    hasPassword ? encrypt(data.password) : null,
    data.file_path || null
  );

  return NextResponse.json(result.changes > 0);
}

export async function PUT(req: Request) {
  const data = await req.json();
  const hasPassword = !!data.password && data.password.length > 0;

  const stmt = db.prepare(`
    UPDATE connections SET
      connection_name = ?,
      connection_type = ?,
      server = ?,
      port = ?,
      database_name = ?,
      username = ?,
      password = ?,
      file_path = ?
    WHERE id = ?
  `);

  const result = stmt.run(
    data.connection_name,
    data.connection_type,
    data.server,
    data.port,
    data.database_name,
    data.username,
    hasPassword
      ? isEncrypted(data.password)
        ? data.password
        : encrypt(data.password)
      : null,
    data.file_path || null,
    data.id
  );

  return NextResponse.json(result.changes > 0);
}

export async function DELETE(req: Request) {
  const data = await req.json();

  if (!data.id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const stmt = db.prepare("DELETE FROM connections WHERE id = ?");
  const result = stmt.run(data.id);

  return NextResponse.json(result.changes > 0);
}
