import type { MigracaoCSV } from "./csv.js";
import type { ResultadoValidacao } from "./types.js";
import { buscarContrato, buscarPlano } from "./database.js";

// Verifica as regras migração de uma solicitação 
export function validarMigracao(
    migracao: MigracaoCSV,
    contratosProcessados: Set<number>
): ResultadoValidacao {

    // Regra 1: os três campos devem estar preenchidos e ser numéricos
    const campos = [
        migracao.id,
        migracao.de_plano,
        migracao.para_plano
    ];

    // Verifica se todos os campos possuem inteiros positivos e seguros
    const camposValidos = campos.every((valor) => {
        // verifica se o texto contém apenas dígitos
        const somenteNumeros = /^\d+$/.test(valor);


        // Converte o valor para número
        const numero = Number(valor);

        // Verifica se é um inteiro seguro e maior que zero
        return (
            somenteNumeros &&
            Number.isSafeInteger(numero) &&
            numero > 0
        );
    });
    

    if (!camposValidos) {
        return {
            aprovado: false,
            motivo: "Linha inválida"
        };
    }

    // Converte os valores para números após a validação
    const id = Number(migracao.id);
    const dePlano = Number(migracao.de_plano);

    // Regra 2: o contrato não deve aparecer no mesmo CSV
    if (contratosProcessados.has(id)) {
        return {
            aprovado: false,
            motivo: "Contrato duplicado no arquivo"
        };
    }

    // Registra a primeira ocorrência , mesmo que seja rejeitada depois 
    contratosProcessados.add(id);

    // Regra 3: o contrato deve existir no banco
    const contrato = buscarContrato(id);

    if (!contrato) {
        return {
            aprovado: false,
            motivo: "Contrato não encontrado"
        };
    }

    // Regra 4: contratos cancelados não podem trocar de plano
    if (contrato.status === "cancelado") {
        return {
            aprovado: false,
            motivo: "Contrato cancelado",
            nome: contrato.nome
        };
    }

    // Regra 5: verifica se o plano de origem corresponde ao plano atual
    if (contrato.plano_id !== dePlano) {
        return {
            aprovado: false,
            motivo: "Plano de origem não confere",
            nome: contrato.nome
        };
    }

    // Converte o plano de destino para o número 
    const paraPlano = Number(migracao.para_plano);

    // Regra 6: verifica se o plano de destino existe
    const planoDestino = buscarPlano(paraPlano);

    if (!planoDestino) {
        return {
            aprovado: false,
            motivo: "Plano de destino não encontrado",
            nome: contrato.nome
        };
    }

    // Regra 7: o plano de destino deve estar ativo
    if (planoDestino.status !== "ativo") {
        return {
            aprovado: false,
            motivo: "Plano de destino inativo",
            nome: contrato.nome
        };
    }

    // Regra 8: impede migração para o mesmo plano
    if (contrato.plano_id === paraPlano) {
        return {
            aprovado: false,
            motivo: "Contrato já está no plano de destino",
            nome: contrato.nome
        };
    }

    // Todas as regras foram aprovadas
    return {
        aprovado: true,
        nome: contrato.nome
    };
}

export function buscarNomeContrato(idTexto: string): string {

    // Verifica se o ID contém somente dígitos
    if (!/^\d+$/.test(idTexto)) {
        return "";
    }

    // Converte o ID para número
    const id = Number(idTexto);

    // Evita consultar o banco com números inválidos
    if (!Number.isSafeInteger(id) || id <= 0) {
        return "";
    }

    // Busca o contrato no SQLite
    const contrato = buscarContrato(id);

    // Retorna o nome ou uma string vazia se não existir
    return contrato?.nome ?? "";
}
    
