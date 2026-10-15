import {
  buscarContrato,
  buscarPlano,
  fecharBanco
} from "../src/database.js";

// Consulta um contrato existente
console.log("Contrato 1:");
console.log(buscarContrato(1));

// Consulta um contrato inexistente
console.log("Contrato 99:");
console.log(buscarContrato(99));

// Consulta um plano ativo
console.log("Plano 2:");
console.log(buscarPlano(2));

// Consulta um plano inativo
console.log("Plano 4:");
console.log(buscarPlano(4));

// Encerra a conexão
fecharBanco();