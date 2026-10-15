import { test } from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

// Verifica se a transação desfaz alterações após uma falha
test("deve desfazer atualizações quando ocorre um erro", () => {

  // Cria um banco SQLite temporário em memória
  const db = new Database(":memory:");

  try {
    // Cria uma tabela simplificada para o teste
    db.exec(`
      CREATE TABLE contratos (
        id INTEGER PRIMARY KEY,
        plano_id INTEGER NOT NULL
      );

      INSERT INTO contratos (id, plano_id)
      VALUES (1, 1), (3, 1);
    `);

    // Prepara a instrução de atualização
    const atualizar = db.prepare(`
      UPDATE contratos
      SET plano_id = ?
      WHERE id = ?
    `);

    // Cria uma transação com duas atualizações
    const transacao = db.transaction(() => {

      // Primeira atualização
      atualizar.run(2, 1);

      // Segunda atualização
      atualizar.run(3, 3);

      // Simula uma falha inesperada
      throw new Error("Falha simulada");
    });

    // Confirma que a transação lançou o erro esperado
    assert.throws(
      () => transacao(),
      /Falha simulada/
    );

    // Consulta os contratos após a falha
    const contratos = db.prepare(`
      SELECT id, plano_id
      FROM contratos
      ORDER BY id
    `).all();

    // Verifica se ambas as alterações foram desfeitas
    assert.deepEqual(contratos, [
      { id: 1, plano_id: 1 },
      { id: 3, plano_id: 1 }
    ]);

  } finally {
    // Encerra a conexão com o banco em memória
    db.close();
  }
});