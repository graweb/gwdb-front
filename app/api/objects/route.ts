import { NextRequest, NextResponse } from "next/server";
import knex from "knex";
import { decrypt } from "@/lib/crypto";

export async function POST(req: NextRequest) {
  const { connection } = await req.json();

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

    let result = {};

    if (client === "mysql2") {
      const dbName = connection.database_name;

      const [rawTables] = await db.raw(
        `SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'`
      );
      const [rawViews] = await db.raw(
        `SHOW FULL TABLES WHERE Table_type = 'VIEW'`
      );

      // Extrai o nome da coluna que contém o nome da tabela (ex: "Tables_in_nomebanco")
      const tableKey =
        Object.keys(rawTables[0] || {}).find((key) =>
          key.startsWith("Tables_in_")
        ) || "TABLE_NAME";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tables = rawTables.map((t: any) => ({
        TABLE_NAME: t[tableKey],
      }));

      const enrichedTables = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tables.map(async (t: any) => {
          const [cols] = await db.raw(
            `SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
            [dbName, t.TABLE_NAME]
          );

          return {
            ...t,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            COLUMNS: cols.map((c: any) => c.COLUMN_NAME),
          };
        })
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const views = rawViews.map((v: any) => ({
        TABLE_NAME: v[tableKey],
      }));

      const [procedures] = await db.raw(
        `SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ?`,
        [dbName]
      );
      const [triggers] = await db.raw(
        `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?`,
        [dbName]
      );
      const [events] = await db.raw(
        `SELECT EVENT_NAME FROM information_schema.EVENTS WHERE EVENT_SCHEMA = ?`,
        [dbName]
      );
      const [indexes] = await db.raw(
        `SELECT INDEX_NAME, TABLE_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ?`,
        [dbName]
      );

      result = {
        tables: enrichedTables,
        views,
        procedures,
        triggers,
        events,
        indexes,
      };
    } else if (client === "pg") {
      const tables = await db
        .select("table_name")
        .from("information_schema.tables")
        .where({ table_schema: "public", table_type: "BASE TABLE" });

      const enrichedTables = await Promise.all(
        tables.map(async (t) => {
          const cols = await db("information_schema.columns")
            .select("column_name")
            .where({ table_schema: "public", table_name: t.table_name });

          return {
            TABLE_NAME: t.table_name,
            COLUMNS: cols.map((c) => c.column_name),
          };
        })
      );

      const views = await db
        .select("table_name")
        .from("information_schema.views")
        .where({ table_schema: "public" });

      const procedures = await db
        .select("routine_name")
        .from("information_schema.routines")
        .where({ specific_schema: "public" });

      const triggers = await db
        .select("trigger_name", "event_object_table")
        .from("information_schema.triggers")
        .where({ trigger_schema: "public" });

      const indexes = await db.raw(`
            SELECT
            t.relname AS table_name,
            i.relname AS index_name,
            a.attname AS column_name
            FROM
            pg_class t,
            pg_class i,
            pg_index ix,
            pg_attribute a
            WHERE
            t.oid = ix.indrelid
            AND i.oid = ix.indexrelid
            AND a.attrelid = t.oid
            AND a.attnum = ANY(ix.indkey)
            AND t.relkind = 'r'
        `);

      result = {
        tables: enrichedTables,
        views,
        procedures,
        triggers,
        events: [], // PostgreSQL usa cron/pgagent, não há `EVENTS`
        indexes: indexes.rows,
      };
    } else if (client === "sqlite3") {
      const tables = await db
        .select("name")
        .from("sqlite_master")
        .where({ type: "table" })
        .andWhereNot("name", "like", "sqlite_%");

      const enrichedTables = await Promise.all(
        tables.map(async (t) => {
          const columnsInfo = await db.raw(`PRAGMA table_info(${t.name})`);
          return {
            TABLE_NAME: t.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            COLUMNS: columnsInfo.map((col: any) => col.name),
          };
        })
      );

      const views = await db
        .select("name")
        .from("sqlite_master")
        .where({ type: "view" });

      const indexes = await db
        .select("name", "tbl_name")
        .from("sqlite_master")
        .where({ type: "index" });

      result = {
        tables: enrichedTables,
        views,
        procedures: [], // SQLite não tem procedures
        triggers: [], // pode ser lido via `sqlite_master` também se desejar
        events: [], // não possui eventos
        indexes,
      };
    } else if (client === "mssql") {
      await db.raw(`USE [${connection.database_name}]`);

      const getRecordset = <T = unknown>(res: unknown): T[] => {
        if (typeof res === "object" && res !== null && "recordset" in res) {
          return (res as { recordset: T[] }).recordset;
        }

        if (Array.isArray(res)) {
          return res as T[];
        }

        return [];
      };

      const tablesRes = await db.raw(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'
      `);
      const viewsRes = await db.raw(`
        SELECT TABLE_NAME FROM INFORMATION_SCHEMA.VIEWS
      `);
      const proceduresRes = await db.raw(`
        SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE'
      `);
      const triggersRes = await db.raw(`
        SELECT name AS trigger_name, OBJECT_NAME(parent_id) AS TABLE_NAME
        FROM sys.triggers
        WHERE parent_class_desc = 'OBJECT_OR_COLUMN'
      `);
      const indexesRes = await db.raw(`
        SELECT 
          ind.name AS INDEX_NAME,
          obj.name AS TABLE_NAME
        FROM 
          sys.indexes ind
        INNER JOIN sys.objects obj ON ind.object_id = obj.object_id
        WHERE 
          obj.type = 'U' AND ind.is_primary_key = 0 AND ind.is_unique = 0
      `);

      const tables = getRecordset(tablesRes);
      const views = getRecordset(viewsRes);
      const procedures = getRecordset(proceduresRes);
      const triggers = getRecordset(triggersRes);
      const indexes = getRecordset(indexesRes);

      const enrichedTables = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tables.map(async (t: any) => {
          const colRes = await db.raw(`
          SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '${t.TABLE_NAME}'
        `);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const columns = getRecordset(colRes).map((c: any) => c.COLUMN_NAME);

          return {
            ...t,
            COLUMNS: columns,
          };
        })
      );

      result = {
        tables: enrichedTables,
        views,
        procedures,
        triggers,
        events: [],
        indexes,
      };
    }

    await db.destroy();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido.";
    return NextResponse.json({ success: false, error: message });
  }
}
