import { after, test } from "node:test";
import assert from "node:assert/strict";
import type { MigracaoCSV } from "../src/csv.js";
import { limparBancoTeste } from "./setup-migration.js";

// Importa a validação após configurar o banco temporário
const { validarMigracao } = await import("../src/migration.js");
const { fecharBanco } = await import("../src/database.js");

// Fecha a conexão e remove o banco após todos os testes
after(() => {
  fecharBanco();
  limparBancoTeste();
});

// Executa uma validação e confere o motivo da rejeição
function verificarRejeicao(
  migracao: MigracaoCSV,
  motivoEsperado: string
): void {
  // Cada teste possui seu próprio controle de duplicidades
  const contratosProcessados = new Set<number>();

  // Executa as validações
  const resultado = validarMigracao(
    migracao,
    contratosProcessados
  );

  // Verifica o resultado obtido
  assert.equal(resultado.aprovado, false);
  assert.equal(resultado.motivo, motivoEsperado);
}

// REGRA 2 — Contrato duplicado
test("deve rejeitar contrato duplicado", () => {
  const processados = new Set<number>();

  const migracao: MigracaoCSV = {
    linha: 2,
    id: "14",
    de_plano: "1",
    para_plano: "3"
  };

  validarMigracao(migracao, processados);

  const resultado = validarMigracao(
    { ...migracao, linha: 3 },
    processados
  );

  assert.equal(
    resultado.motivo,
    "Contrato duplicado no arquivo"
  );
});

// REGRA 3 — Contrato inexistente
test("deve rejeitar contrato inexistente", () => {
  verificarRejeicao(
    { linha: 2, id: "99", de_plano: "1", para_plano: "2" },
    "Contrato não encontrado"
  );
});

// REGRA 4 — Contrato cancelado
test("deve rejeitar contrato cancelado", () => {
  verificarRejeicao(
    { linha: 2, id: "4", de_plano: "3", para_plano: "1" },
    "Contrato cancelado"
  );
});

// REGRA 5 — Plano de origem incorreto
test("deve rejeitar plano de origem diferente do atual", () => {
  verificarRejeicao(
    { linha: 2, id: "9", de_plano: "2", para_plano: "3" },
    "Plano de origem não confere"
  );
});

// REGRA 6 — Plano de destino inexistente
test("deve rejeitar plano de destino inexistente", () => {
  verificarRejeicao(
    { linha: 2, id: "11", de_plano: "2", para_plano: "7" },
    "Plano de destino não encontrado"
  );
});

// REGRA 7 — Plano de destino inativo
test("deve rejeitar plano de destino inativo", () => {
  verificarRejeicao(
    { linha: 2, id: "7", de_plano: "2", para_plano: "4" },
    "Plano de destino inativo"
  );
});

// REGRA 8 — Mesmo plano
test("deve rejeitar migração para o mesmo plano", () => {
  verificarRejeicao(
    { linha: 2, id: "10", de_plano: "1", para_plano: "1" },
    "Contrato já está no plano de destino"
  );
});

// CENÁRIO VÁLIDO
test("deve aprovar uma migração válida", () => {
  const resultado = validarMigracao(
    { linha: 2, id: "6", de_plano: "4", para_plano: "2" },
    new Set<number>()
  );

  assert.equal(resultado.aprovado, true);
});

// Verifica se campos inválidos são rejeitados
test("deve rejeitar uma linha com plano de origem inválido", () => {

  // Simula uma solicitação com texto no lugar do número
  const migracao: MigracaoCSV = {
    linha: 2,
    id: "15",
    de_plano: "abc",
    para_plano: "3"
  };

  // Cria um controle de duplicidades exclusivo deste teste
  const contratosProcessados = new Set<number>();

  // Executa as validações
  const resultado = validarMigracao(
    migracao,
    contratosProcessados
  );

  // Confirma que a solicitação foi rejeitada
  assert.equal(resultado.aprovado, false);

  // Confirma que o motivo corresponde ao enunciado
  assert.equal(resultado.motivo, "Linha inválida");
});

// Verifica se a duplicidade tem prioridade na segunda ocorrência
test("deve rejeitar a segunda ocorrência mesmo se a primeira falhou", () => {
  const processados = new Set<number>();

  // Primeira ocorrência: plano de origem incorreto
  const primeira: MigracaoCSV = {
    linha: 2,
    id: "9",
    de_plano: "2",
    para_plano: "3"
  };

  const primeiroResultado = validarMigracao(primeira, processados);

  assert.equal(
    primeiroResultado.motivo,
    "Plano de origem não confere"
  );

  // Segunda ocorrência: deve ser rejeitada como duplicada
  const segunda: MigracaoCSV = {
    linha: 3,
    id: "9",
    de_plano: "3",
    para_plano: "2"
  };

  const segundoResultado = validarMigracao(segunda, processados);

  assert.equal(segundoResultado.aprovado, false);
  assert.equal(
    segundoResultado.motivo,
    "Contrato duplicado no arquivo"
  );
});