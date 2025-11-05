import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

// Garante que a pasta do banco exista
const dbFolder = path.resolve("gwdb");
if (!fs.existsSync(dbFolder)) {
  fs.mkdirSync(dbFolder, { recursive: true });
}

const dbPath = path.join(dbFolder, "database.db");

// Cria ou abre o banco
const db = new Database(dbPath);

// Ativa suporte a foreign key
db.pragma("foreign_keys = ON");

// Cria a tabela connections se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_name TEXT NOT NULL,
    connection_type TEXT NOT NULL,
    server TEXT,
    port TEXT,
    database_name TEXT,
    username TEXT,
    password TEXT,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS plugins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    version TEXT,
    installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER,
    name TEXT NOT NULL,
    sql TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE SET NULL ON UPDATE CASCADE
  );

  CREATE TABLE IF NOT EXISTS query_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id INTEGER,
    query_id INTEGER,
    sql TEXT NOT NULL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_ms INTEGER,
    success BOOLEAN,
    error_message TEXT,
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (query_id) REFERENCES queries(id) ON DELETE SET NULL ON UPDATE CASCADE
  )
`);

export default db;
