import {
  buscarContrato,
  atualizarPlanoContrato,
  fecharBanco
} from "../src/database.js";

try {
  // Consulta o contrato antes da atualização
  console.log("ANTES:");
  console.log(buscarContrato(1));

  // Migra o contrato 1 do plano 1 para o plano 2
  const atualizado = atualizarPlanoContrato(1, 1, 2);

  console.log("Atualização realizada:", atualizado);

  // Consulta novamente para conferir a alteração
  console.log("DEPOIS:");
  console.log(buscarContrato(1));

} finally {
  // Fecha a conexão com o banco
  fecharBanco();
}