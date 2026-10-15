import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import Database from "better-sqlite3";
import { parse } from "csv-parse/sync";

import type { Contrato } from "../src/types.js";

// Caminhos dos arquivos do projeto
const raizProjeto = process.cwd();
const seedPath = resolve(raizProjeto, "seed.sql");
const csvPath = resolve(raizProjeto, "migracoes_planos.csv");
const indexPath = resolve(raizProjeto, "src/index.ts");

// Representa uma linha do relatório de rejeições
interface Rejeicao {
  linha: string;
  id: string;
  nome: string;
  de_plano: string;
  para_plano: string;
  motivo: string;
}

test("deve processar as migrações e gerar o relatório corretamente", () => {

  // Cria uma pasta temporária exclusiva para o teste
  const pastaTemp = mkdtempSync(
    join(tmpdir(), "netvila-test-")
  );

  // Define o caminho do banco temporário
  const bancoPath = join(pastaTemp, "teste.sqlite");

  // Guarda os contratos antes das migrações
  let contratosOriginais: Contrato[] = [];

  try {

    // ==========================================
    // 1. PREPARAÇÃO DO BANCO DE TESTE
    // ==========================================

    const dbInicial = new Database(bancoPath);

    try {
      // Executa o seed.sql no banco temporário
      const seed = readFileSync(seedPath, "utf-8");
      dbInicial.exec(seed);

      // Guarda os dados originais para comparação
      contratosOriginais = dbInicial.prepare(`
        SELECT *
        FROM contratos
        ORDER BY id
      `).all() as Contrato[];

    } finally {
      dbInicial.close();
    }

    // ==========================================
    // 2. EXECUÇÃO DA AUTOMAÇÃO
    // ==========================================

    // Executa a aplicação apontando para o banco temporário
    const execucao = spawnSync(
      process.execPath,
      [
        "--import",
        import.meta.resolve("tsx"),
        indexPath,
        csvPath
      ],
      {
        cwd: pastaTemp,
        env: {
          ...process.env,
          DATABASE_PATH: bancoPath
        },
        encoding: "utf-8"
      }
    );

    // Verifica se a execução terminou sem erros
    assert.equal(
      execucao.status,
      0,
      execucao.stderr ||
        execucao.error?.message ||
        "A execução da automação falhou"
    );

    // ==========================================
    // 3. VERIFICAÇÃO DO RESUMO
    // ==========================================

    assert.match(
      execucao.stdout,
      /Total de linhas lidas: 15/
    );

    assert.match(
      execucao.stdout,
      /Total atualizado: 5/
    );

    assert.match(
      execucao.stdout,
      /Total rejeitado: 10/
    );

    // ==========================================
    // 4. VERIFICAÇÃO DOS CONTRATOS
    // ==========================================

    const dbResultado = new Database(bancoPath);

    try {
      // Consulta os contratos após o processamento
      const contratos = dbResultado.prepare(`
        SELECT *
        FROM contratos
        ORDER BY id
      `).all() as Contrato[];

      // Plano esperado de cada contrato
      const planosEsperados: Record<number, number> = {
        1: 2,
        2: 2,
        3: 3,
        4: 3,
        5: 2,
        6: 2,
        7: 2,
        8: 1,
        9: 3,
        10: 1,
        11: 2,
        12: 2,
        13: 4,
        14: 3,
        15: 2
      };

      // Confirma que os 15 contratos continuam cadastrados
      assert.equal(contratos.length, 15);

      for (const contrato of contratos) {

        // Confere se o plano_id está correto
        assert.equal(
          contrato.plano_id,
          planosEsperados[contrato.id],
          `Plano incorreto no contrato ${contrato.id}`
        );

        // Localiza o contrato antes do processamento
        const original = contratosOriginais.find(
          (item) => item.id === contrato.id
        );

        assert.ok(
          original,
          `Contrato original ${contrato.id} não encontrado`
        );

        // Garante que somente plano_id foi alterado
        assert.equal(contrato.nome, original.nome);
        assert.equal(contrato.telefone, original.telefone);
        assert.equal(contrato.status, original.status);
        assert.equal(
          contrato.data_instalacao,
          original.data_instalacao
        );
      }

    } finally {
      dbResultado.close();
    }

    // ==========================================
    // 5. VERIFICAÇÃO DO RELATÓRIO CSV
    // ==========================================

    const relatorioPath = join(
      pastaTemp,
      "relatorio_nao_atualizados.csv"
    );

    // Lê o arquivo gerado pela automação
    const conteudoRelatorio = readFileSync(
      relatorioPath,
      "utf-8"
    );

    // Converte o CSV em objetos
    const rejeicoes = parse(conteudoRelatorio, {
      columns: true,
      skip_empty_lines: true
    }) as Rejeicao[];

    // Confirma as dez rejeições
    assert.equal(rejeicoes.length, 10);

    // Confirma a ordem das colunas
    assert.deepEqual(
      Object.keys(rejeicoes[0]!),
      [
        "linha",
        "id",
        "nome",
        "de_plano",
        "para_plano",
        "motivo"
      ]
    );

    // Busca uma rejeição pela linha original
    function buscarRejeicao(linha: string) {
      return rejeicoes.find(
        (item) => item.linha === linha
      );
    }

    // Contrato cancelado
    assert.equal(
      buscarRejeicao("4")?.motivo,
      "Contrato cancelado"
    );

    // Contrato inexistente: nome deve ficar vazio
    assert.equal(buscarRejeicao("9")?.id, "99");
    assert.equal(buscarRejeicao("9")?.nome, "");

    // Contrato com destino vazio
    assert.equal(
      buscarRejeicao("12")?.nome,
      "Eduarda Alves"
    );

    assert.equal(
      buscarRejeicao("12")?.para_plano,
      ""
    );

    assert.equal(
      buscarRejeicao("12")?.motivo,
      "Linha inválida"
    );

    // Contrato duplicado
    assert.equal(
      buscarRejeicao("14")?.nome,
      "Nicolas Barbosa"
    );

    assert.equal(
      buscarRejeicao("14")?.motivo,
      "Contrato duplicado no arquivo"
    );

    // Valor inválido preservado no relatório
    assert.equal(
      buscarRejeicao("16")?.de_plano,
      "abc"
    );

  } finally {

    // ==========================================
    // 6. LIMPEZA DOS ARQUIVOS TEMPORÁRIOS
    // ==========================================

    // Remove o banco, o relatório e a pasta de teste
    rmSync(pastaTemp, {
      recursive: true,
      force: true
    });
  }
});