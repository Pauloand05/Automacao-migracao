import { lerCSV } from "../src/csv.js";
import { validarMigracao } from "../src/migration.js";
import { fecharBanco } from "../src/database.js";
import { buscarNomeContrato } from "../src/migration.js";

// Recebe o caminho do CSV pelo terminal
// Caso não seja informado, utiliza o arquivo original
const caminhoCSV = process.argv[2] ?? "./migracoes_planos.csv";

// Lê as solicitações do arquivo
const migracoes = lerCSV(caminhoCSV);

// Controla os contratos já encontrados neste arquivo
const contratosProcessados = new Set<number>();

try {
  // Percorre cada solicitação e executa as validações
  for (const migracao of migracoes) {
    const resultado = validarMigracao(
      migracao,
      contratosProcessados
    );

    // Exibe o resultado de cada solicitação
    console.log({
      linha: migracao.linha,
      id: migracao.id,
      ...resultado
    });
  }

  // Testa a recuperação dos nomes dos clientes
  // Essas consultas precisam ocorrer com o banco aberto
  console.log("\nTeste de nomes:");
  console.log("Contrato 14:", buscarNomeContrato("14"));
  console.log("Contrato 5:", buscarNomeContrato("5"));
  console.log("Contrato 99:", buscarNomeContrato("99"));
  console.log("ID inválido:", buscarNomeContrato("abc"));

} finally {
  // Encerra a conexão com o banco
  fecharBanco();
}