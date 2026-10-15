import Database from "better-sqlite3";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Cria uma pasta temporária exclusiva
const pastaTemp = mkdtempSync(
  join(tmpdir(), "netvila-migration-")
);

// Define o caminho do banco de testes
const bancoPath = join(pastaTemp, "teste.sqlite");

// Inicializa o banco com os dados originais
const db = new Database(bancoPath);

try {
  const seed = readFileSync(
    resolve(process.cwd(), "seed.sql"),
    "utf-8"
  );

  db.exec(seed);
} finally {
  db.close();
}

// Informa à aplicação qual banco deve utilizar
process.env.DATABASE_PATH = bancoPath;

// Remove os arquivos temporários ao final dos testes
export function limparBancoTeste(): void {
  rmSync(pastaTemp, {
    recursive: true,
    force: true
  });
}