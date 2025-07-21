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
    file_path TEXT
  )
`);

export default db;
