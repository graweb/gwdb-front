/* eslint-disable @typescript-eslint/no-explicit-any */
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
      connection:
        client === "sqlite3"
          ? { filename: connection.file_path }
          : connectionConfig,
      useNullAsDefault: client === "sqlite3",
    });

    const dbName = connection.database_name;
    let result = {};

    const parseColumns = (
      rows: any[],
      nameKey: string,
      typeKey: string,
      lengthKey?: string,
      precisionKey?: string,
      scaleKey?: string,
      fullTypeKey?: string
    ) => {
      return rows.map((c) => ({
        name: c[nameKey],
        type: c[typeKey],
        fullType: fullTypeKey ? c[fullTypeKey] : undefined,
        length: lengthKey ? c[lengthKey] ?? undefined : undefined,
        precision: precisionKey ? c[precisionKey] ?? undefined : undefined,
        scale: scaleKey ? c[scaleKey] ?? undefined : undefined,
      }));
    };

    if (client === "mysql2") {
      const [rawTables] = await db.raw(
        `SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'`
      );
      const [rawViews] = await db.raw(
        `SHOW FULL TABLES WHERE Table_type = 'VIEW'`
      );

      const tableKey =
        Object.keys(rawTables[0] || {}).find((key) =>
          key.startsWith("Tables_in_")
        ) || "TABLE_NAME";

      const tables = rawTables.map((t: any) => ({ TABLE_NAME: t[tableKey] }));
      const views = rawViews.map((v: any) => ({ VIEW_NAME: v[tableKey] }));

      const enrichedTables = await Promise.all(
        tables.map(async (t: any) => {
          const [cols] = await db.raw(
            `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE 
             FROM information_schema.COLUMNS 
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
            [dbName, t.TABLE_NAME]
          );

          return {
            TABLE_NAME: t.TABLE_NAME,
            COLUMNS: parseColumns(
              cols,
              "COLUMN_NAME",
              "DATA_TYPE",
              "CHARACTER_MAXIMUM_LENGTH",
              "NUMERIC_PRECISION",
              "NUMERIC_SCALE",
              "COLUMN_TYPE"
            ),
          };
        })
      );

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
      const tables = await db("information_schema.tables")
        .select("table_name")
        .where({ table_schema: "public", table_type: "BASE TABLE" });

      const enrichedTables = await Promise.all(
        tables.map(async (t) => {
          const cols = await db("information_schema.columns")
            .select(
              "column_name",
              "data_type",
              "udt_name",
              "character_maximum_length",
              "numeric_precision",
              "numeric_scale"
            )
            .where({ table_schema: "public", table_name: t.table_name });

          return {
            TABLE_NAME: t.table_name,
            COLUMNS: cols.map((c) => ({
              name: c.column_name,
              type: c.data_type,
              fullType: c.udt_name,
              length: c.character_maximum_length ?? undefined,
              precision: c.numeric_precision ?? undefined,
              scale: c.numeric_scale ?? undefined,
            })),
          };
        })
      );

      const views = await db("information_schema.views")
        .select("table_name as VIEW_NAME")
        .where({ table_schema: "public" });
      const procedures = await db("information_schema.routines")
        .select("routine_name as ROUTINE_NAME")
        .where({ specific_schema: "public" });
      const triggers = await db("information_schema.triggers")
        .select("trigger_name as TRIGGER_NAME")
        .where({ trigger_schema: "public" });

      const indexes = await db.raw(`
        SELECT i.relname AS INDEX_NAME, t.relname AS TABLE_NAME
        FROM pg_class t, pg_class i, pg_index ix, pg_attribute a
        WHERE t.oid = ix.indrelid AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid AND a.attnum = ANY(ix.indkey) AND t.relkind = 'r'
      `);

      result = {
        tables: enrichedTables,
        views,
        procedures,
        triggers,
        events: [],
        indexes: indexes.rows,
      };
    } else if (client === "sqlite3") {
      const tables = await db("sqlite_master")
        .select("name")
        .where({ type: "table" })
        .andWhereNot("name", "like", "sqlite_%");

      const enrichedTables = await Promise.all(
        tables.map(async (t) => {
          const pragmaRes = await db.raw(`PRAGMA table_info(${t.name})`);
          const pragma =
            Array.isArray(pragmaRes) && Array.isArray(pragmaRes[0])
              ? pragmaRes[0]
              : Array.isArray(pragmaRes)
              ? pragmaRes
              : [];

          const columns = pragma.map((col: any) => {
            const typeMatch = col.type?.match(/(\w+)(?:\((\d+)(?:,(\d+))?\))?/);
            return {
              name: col.name,
              type: typeMatch?.[1] || col.type,
              fullType: col.type,
              length: typeMatch?.[2] ? parseInt(typeMatch[2]) : undefined,
              precision: typeMatch?.[2] ? parseInt(typeMatch[2]) : undefined,
              scale: typeMatch?.[3] ? parseInt(typeMatch[3]) : undefined,
            };
          });

          return {
            TABLE_NAME: t.name,
            COLUMNS: columns,
          };
        })
      );

      const views = await db("sqlite_master")
        .select("name as VIEW_NAME")
        .where({ type: "view" });
      const indexes = await db("sqlite_master")
        .select("name as INDEX_NAME", "tbl_name as TABLE_NAME")
        .where({ type: "index" });

      result = {
        tables: enrichedTables,
        views,
        procedures: [],
        triggers: [],
        events: [],
        indexes,
      };
    } else if (client === "mssql") {
      await db.raw(`USE [${connection.database_name}]`);

      const getRecordset = <T = unknown>(res: unknown): T[] => {
        if (typeof res === "object" && res !== null && "recordset" in res) {
          return (res as { recordset: T[] }).recordset;
        }
        return Array.isArray(res) ? res : [];
      };

      const tables = getRecordset(
        await db.raw(
          `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`
        )
      );

      const enrichedTables = await Promise.all(
        tables.map(async (t: any) => {
          const columns = getRecordset(
            await db.raw(`
              SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, NUMERIC_PRECISION, NUMERIC_SCALE
              FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_NAME = '${t.TABLE_NAME}'`)
          );

          return {
            TABLE_NAME: t.TABLE_NAME,
            COLUMNS: parseColumns(
              columns,
              "COLUMN_NAME",
              "DATA_TYPE",
              "CHARACTER_MAXIMUM_LENGTH",
              "NUMERIC_PRECISION",
              "NUMERIC_SCALE"
            ),
          };
        })
      );

      const views = getRecordset(
        await db.raw(
          `SELECT TABLE_NAME as VIEW_NAME FROM INFORMATION_SCHEMA.VIEWS`
        )
      );
      const procedures = getRecordset(
        await db.raw(
          `SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE'`
        )
      );
      const triggers = getRecordset(
        await db.raw(`
        SELECT name AS TRIGGER_NAME FROM sys.triggers WHERE parent_class_desc = 'OBJECT_OR_COLUMN'`)
      );
      const indexes = getRecordset(
        await db.raw(`
        SELECT ind.name AS INDEX_NAME, obj.name AS TABLE_NAME
        FROM sys.indexes ind
        INNER JOIN sys.objects obj ON ind.object_id = obj.object_id
        WHERE obj.type = 'U' AND ind.is_primary_key = 0 AND ind.is_unique = 0
      `)
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
