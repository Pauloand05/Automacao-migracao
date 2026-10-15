import { resolve } from "node:path";
import { lerCSV } from "./csv.js";
import { validarMigracao, buscarNomeContrato } from "./migration.js";
import {
  atualizarPlanoContrato,
  executarEmTransacao,
  fecharBanco
} from "./database.js";
import {
  gerarRelatorio,
  type MigracaoRejeitada
} from "./report.js"


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

// Armazena as solicitações rejeitadas para gerar o relatório
const rejeitados: MigracaoRejeitada[] = [];

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

      if (!resultado.aprovado) {

      // Armazena a solicitação e o motivo da rejeição
      rejeitados.push({
        ...migracao,
        nome: buscarNomeContrato(migracao.id),
        motivo: resultado.motivo ?? "Linha inválida"
      });

      // Continua para a próxima solicitação
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

  // Gera o relatório somente após concluir as atualizações
  gerarRelatorio(rejeitados);
    
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