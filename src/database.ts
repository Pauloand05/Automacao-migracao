import Database from "better-sqlite3";
import { resolve } from "node:path";
import type { Contrato, Plano } from "./types.js";

// Utiliza o banco informado pelo ambiente ou o banco padrão
const databasePath = resolve(
  process.env.DATABASE_PATH ?? "database.sqlite"
);

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

export function atualizarPlanoContrato(
    idContrato: number,
    planoOrigem: number,
    planoDestino: number

): boolean {

    // Atualiza somente o plano_id do contrato
    const consulta = db.prepare(`
        UPDATE contratos
        SET plano_id = ?
        WHERE id = ? 
            AND plano_id = ?
            AND status IN ('ativo', 'nao_instalado')
        `);

    // Executa a atualização utilizando parâmetros seguros
    const resultado = consulta.run(
        planoDestino,
        idContrato,
        planoOrigem
    );

    // Retorna true se extamente um contrato foi atualizado
    return resultado.changes === 1;
}

// Executa um processamento dentro de uma transação SQLite 
export function executarEmTransacao<T>(
    processamento: () => T
): T {


    // Cria uma transação para o processamento informado
    const transacao = db.transaction(processamento);

    // Executa a transação e retorna o resultado 
    return transacao();
}


// Encerra a conexão com o banco 
export function fecharBanco(): void {
    db.close();
}
