/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import knex from "knex";
import { decrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const { query, connection, page = 0, pageSize = 50 } = await req.json();

  try {
    let client = "mysql2";
    let decryptedPassword: string | undefined;

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

    if (
      connection.connection_type !== "sqlite" &&
      typeof connection.password === "string"
    ) {
      decryptedPassword = decrypt(connection.password);
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
            password: decryptedPassword,
            database: connection.database_name,
          };

    const db = knex({
      client,
      connection:
        client === "sqlite3"
          ? { filename: connection.file_path }
          : connectionConfig,
      useNullAsDefault: client === "sqlite3",
    });

    const isSelect =
      typeof query === "string" &&
      query.trim().toLowerCase().startsWith("select");

    let paginatedResult: any[] = [];
    let total = 0;

    if (isSelect) {
      const cleanQuery = query.trim().replace(/;$/, "");
      const offset = (page - 1) * pageSize;
      const countQuery = `SELECT COUNT(*) as total FROM (${cleanQuery}) as total_count`;
      let dataQuery = "";

      if (client === "mssql") {
        dataQuery = `${cleanQuery} ORDER BY id OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`;
      } else {
        dataQuery = `${cleanQuery} LIMIT ${pageSize} OFFSET ${offset}`;
      }

      const [countResult] = await db.raw(countQuery);
      const dataResult = await db.raw(dataQuery);

      total = countResult?.total || countResult?.[0]?.total || 0;
      paginatedResult = dataResult;
    } else {
      const dataResult = await db.raw(query);
      paginatedResult = dataResult;
    }

    await db.destroy();

    return NextResponse.json({
      success: true,
      result: paginatedResult,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ success: false, error: message });
  }
}
