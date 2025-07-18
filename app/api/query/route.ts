import { NextRequest, NextResponse } from "next/server";
import knex from "knex";

export async function POST(req: NextRequest) {
  const { query, connection } = await req.json();

  try {
    let client = "mysql2";

    switch (connection.connection_type) {
      case "mysql":
      case "mariadb":
        client = "mysql2";
        break;
      case "postgresql":
        client = "pg";
        break;
      case "sqlite":
        client = "sqlite3";
        break;
      case "sqlserver":
        client = "mssql";
        break;
      default:
        throw new Error(
          "Tipo de conexão não suportado: " + connection.connection_type
        );
    }

    const db = knex({
      client,
      connection: {
        host: connection.host,
        port: Number(connection.port),
        user: connection.username,
        password: connection.password,
        database: connection.database_name,
      },
    });

    const result = await db.raw(query);
    await db.destroy();

    return NextResponse.json({ success: true, result });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
