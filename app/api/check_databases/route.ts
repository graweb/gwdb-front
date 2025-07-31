/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import knex from "knex";

export async function POST(req: NextRequest) {
  const connection = await req.json();

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
            password: connection.password,
            options: {
              port: Number(connection.port),
              enableArithAbort: true,
              trustServerCertificate: true,
            },
          }
        : {
            host: connection.server,
            port: Number(connection.port),
            user: connection.username,
            password: connection.password,
          };

    const db = knex({
      client,
      connection: connectionConfig,
    });

    let databases: string[] = [];

    switch (client) {
      case "mysql2":
        const [mysqlResult] = await db.raw("SHOW DATABASES");
        databases = mysqlResult.map((row: any) => Object.values(row)[0]);
        break;

      case "pg":
        const pgResult = await db.raw(
          `SELECT datname FROM pg_database WHERE datistemplate = false`
        );
        databases = pgResult.rows.map((row: any) => row.datname);
        break;

      case "mssql":
        const sqlResult = await db.raw(`SELECT name FROM sys.databases`);
        databases = sqlResult.recordset.map((row: any) => row.name);
        break;
    }

    await db.destroy();
    return NextResponse.json({ success: true, data: databases });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ success: false, error: message });
  }
}
