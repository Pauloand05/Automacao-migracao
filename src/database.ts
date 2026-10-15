import Database from "better-sqlite3";
import { resolve } from "node:path";
import type { Contrato, Plano } from "./types.js";

// Define o caminho do banco de dados
const databasePath = resolve(process.cwd(), "database.sqlite");

// Abre uma conexão com o banco SQLite 
const db = new Database(databasePath, {
    fileMustExist: true, // Garante que o arquivo do banco exista
});

// Ativa a verificação de chaves estrangeiras
db.pragma("foreign_keys = ON");

// Busca um contrato pelo seu identificador
export function buscarContrato(id: number): Contrato | undefined {
    const consulta = db.prepare(
        "SELECT * FROM contratos WHERE id = ?"
    );

    return consulta.get(id) as Contrato | undefined;
}

// Busca um plano pelo seu identificador
export function buscarPlano(id: number): Plano | undefined {
    const consulta = db.prepare(
        "SELECT * FROM planos WHERE id = ?"
    );

    return consulta.get(id) as Plano | undefined;
}

// Encerra a conexão com o banco 
export function fecharBanco(): void {
    db.close();
}
