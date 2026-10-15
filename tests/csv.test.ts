import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { lerCSV } from "../src/csv.js";

// Define o caminho do CSV fornecido pela empresa
const caminhoCSV = resolve(
  process.cwd(),
  "migracoes_planos.csv"
);

// TESTE 1: verifica a quantidade de solicitações
test("deve ler as 15 solicitações do CSV", () => {
  const migracoes = lerCSV(caminhoCSV);

  assert.equal(migracoes.length, 15);
});

// TESTE 2: verifica os dados da primeira solicitação
test("deve ler corretamente os campos da primeira migração", () => {
  const migracoes = lerCSV(caminhoCSV);

  assert.equal(migracoes[0]?.linha, 2);
  assert.equal(migracoes[0]?.id, "1");
  assert.equal(migracoes[0]?.de_plano, "1");
  assert.equal(migracoes[0]?.para_plano, "2");
});

// TESTE 3: verifica se campos vazios são preservados
test("deve preservar campos vazios", () => {
  const migracoes = lerCSV(caminhoCSV);

  const contrato5 = migracoes.find(
    (migracao) => migracao.id === "5"
  );

  assert.ok(contrato5);
  assert.equal(contrato5.para_plano, "");
});

// TESTE 4: verifica se textos inválidos são preservados
test("deve preservar valores não numéricos", () => {
  const migracoes = lerCSV(caminhoCSV);

  const contrato15 = migracoes.find(
    (migracao) => migracao.id === "15"
  );

  assert.ok(contrato15);
  assert.equal(contrato15.de_plano, "abc");
});

// TESTE 5: verifica se duplicidades são preservadas
test("deve manter solicitações duplicadas para validação posterior", () => {
  const migracoes = lerCSV(caminhoCSV);

  const contrato14 = migracoes.filter(
    (migracao) => migracao.id === "14"
  );

  assert.equal(contrato14.length, 2);
});