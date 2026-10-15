import Database from "better-sqlite3";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Utiliza o banco informado pelo ambiente ou o banco padrão
const databasePath = resolve(
  process.env.DATABASE_PATH ?? "database.sqlite"
);
const seedPath = resolve(process.cwd(), "seed.sql");

//  Abre a conexão com o SQLite.
// Se o arquivo não existir, o SQLLite cria automaticamente.
const db = new Database(databasePath);

try {
    // Ativa a verificação  dos relacionamentos entre tabelas 
    db.pragma("foreign_keys = ON");

    // Lê o conteúdo do arquivo seed.sql
    const seedSQL = readFileSync(seedPath, "utf-8");

    // Executa todos os comandos SQL dentro de uma transação
    db.transaction(() => {
        db.exec(seedSQL);
    })();

    // Consulta a quantidade de planos cadastrados
    const planos = db.prepare(
        "SELECT COUNT(*) AS total FROM planos"
    ).get() as { total: number };

    // Consulta a quantidade de contratos cadastrados
    const contratos = db.prepare(
        "SELECT COUNT(*) AS total FROM contratos"
    ).get() as { total: number };

    // Exibe o resultado no da inicialização
    console.log(`Banco de dados inicializado com sucesso!`);
    console.log(`Planos cadastrados: ${planos.total}`);
    console.log(`Contratos cadastrados: ${contratos.total}`);

} catch (error) {
    // Exibe o erro caso  ocorra algum problema durante a inicialização do banco de dados
    console.error("Erro ao inicializar o banco de dados:", error);
    process.exitCode = 1;
} finally {
    // Fecha a conexão com o banco de dados , mesmo que ocorra um erro
    db.close();
}