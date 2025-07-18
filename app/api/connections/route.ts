import db from "@/lib/init-db";
import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";

export async function GET() {
  const stmt = db.prepare("SELECT * FROM connections ORDER BY id DESC");
  const connections = stmt.all();
  return NextResponse.json(connections);
}

export async function POST(req: Request) {
  const data = await req.json();
  const encryptedPassword = encrypt(data.password);

  const stmt = db.prepare(`
    INSERT INTO connections (
      connection_name, connection_type, server,
      port, database_name, username, password
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.connection_name,
    data.connection_type,
    data.server,
    data.port,
    data.database_name,
    data.username,
    encryptedPassword
  );

  return NextResponse.json(result.changes > 0);
}

export async function PUT(req: Request) {
  const data = await req.json();

  const encryptedPassword = encrypt(data.password);

  const stmt = db.prepare(`
    UPDATE connections SET
      connection_name = ?,
      connection_type = ?,
      server = ?,
      port = ?,
      database_name = ?,
      username = ?,
      password = ?
    WHERE id = ?
  `);

  const result = stmt.run(
    data.connection_name,
    data.connection_type,
    data.server,
    data.port,
    data.database_name,
    data.username,
    encryptedPassword,
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
