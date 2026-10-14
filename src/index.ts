import { resolve } from "node:path";
import { lerCSV } from "./csv.js";

// Obtém o caminho do CSV informado pelo usuário
const caminhoInformado = process.argv[2];

// Verifica se o caminho foi informado
if (!caminhoInformado) {
  console.error("Erro: informe o caminho do arquivo CSV.");
  console.error("Exemplo: npm start -- ./migracoes_planos.csv");
  process.exit(1);
}

try {
  // Converte o caminho informado em um caminho absoluto
  const caminhoCSV = resolve(caminhoInformado);

  // Lê as solicitações de migração
  const migracoes = lerCSV(caminhoCSV);

  // Exibe os registros para conferência
  console.log("Solicitações encontradas:");
  console.table(migracoes);

  // Exibe a quantidade total de solicitações
  console.log(`Total de solicitações: ${migracoes.length}`);

} catch (error) {
  // Identifica erros de leitura do arquivo
  if (
    error instanceof Error &&
    "code" in error &&
    error.code === "ENOENT"
  ) {
    console.error("Erro: arquivo CSV não encontrado.");
  } else {
    console.error("Erro ao processar o arquivo CSV:", error);
  }

  // Finaliza o programa indicando falha
  process.exitCode = 1;
}