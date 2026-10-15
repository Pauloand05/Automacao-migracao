import { resolve } from "node:path";
import { lerCSV } from "./csv.js";
import { validarMigracao } from "./migration.js";
import {
  atualizarPlanoContrato,
  executarEmTransacao,
  fecharBanco
} from "./database.js";

// Obtém o caminho do CSV informado pelo usuário
const caminhoInformado = process.argv[2];

// Verifica se o caminho foi informado
if (!caminhoInformado) {
  console.error("Erro: informe o caminho do arquivo CSV.");
  console.error("Exemplo: npm start -- ./migracoes_planos.csv");
  process.exit(1);
}

// Controla os contratos encontrados no CSV
const contratosProcessados = new Set<number>();

// Armazena as solicitações rejeitadas
const rejeitados = [];

let atualizados = 0;

try {
  // Lê as solicitações do arquivo
  const migracoes = lerCSV(resolve(caminhoInformado));

  // Executa todas as migrações dentro de uma transação
  executarEmTransacao(() => {

    // Percorre cada solicitação do CSV
    for (const migracao of migracoes) {

      // Executa as oito validações de negócio
      const resultado = validarMigracao(
        migracao,
        contratosProcessados
      );

      // Se alguma validação falhar, registra a rejeição
      if (!resultado.aprovado) {
        rejeitados.push({
          ...migracao,
          motivo: resultado.motivo
        });

        // Continua o processamento das próximas solicitações
        continue;
      }

      // Atualiza somente os contratos aprovados
      const atualizado = atualizarPlanoContrato(
        Number(migracao.id),
        Number(migracao.de_plano),
        Number(migracao.para_plano)
      );

      // Verifica se a atualização realmente aconteceu
      if (!atualizado) {
        // Um UPDATE que falhou inesperadamente deve interromper
        // a transação para evitar alterações parciais.
        throw new Error(
          `Não foi possível atualizar o contrato ${migracao.id}`
        );
      }

      // Contabiliza a atualização realizada
      atualizados++;
    }
  });
    
  // Exibe o resumo solicitado pela empresa
  console.log("\nResumo da execução:");
  console.log(`Total de linhas lidas: ${migracoes.length}`);
  console.log(`Total atualizado: ${atualizados}`);
  console.log(`Total rejeitado: ${rejeitados.length}`);

} catch (error) {
  console.error("Erro durante a execução:", error);
  process.exitCode = 1;

} finally {
    // Fecha a conexão com o banco
    fecharBanco();
}