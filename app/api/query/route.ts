import { NextRequest, NextResponse } from "next/server";
import knex from "knex";
import { decrypt } from "@/lib/crypto";

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

    const connectionConfig =
      client === "mssql"
        ? {
            server: connection.server,
            user: connection.username,
            password: decrypt(connection.password),
            database: connection.database_name,
            options: {
              port: Number(connection.port),
              enableArithAbort: true,
              trustServerCertificate: true,
            },
          }
        : {
            host: connection.host,
            port: Number(connection.port),
            user: connection.username,
            password: decrypt(connection.password),
            database: connection.database_name,
          };

    const db = knex({
      client,
      connection: connectionConfig,
    });

    const result = await db.raw(query);
    await db.destroy();

    return NextResponse.json({ success: true, result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ success: false, error: message });
  }
}
