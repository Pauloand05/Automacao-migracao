import { writeFileSync } from "node:fs";
import { stringify } from "csv-stringify/sync";
import type { MigracaoCSV } from "./csv.js";


// Representa uma solicitação rejeitada
export interface MigracaoRejeitada extends MigracaoCSV {
    motivo: string;
    nome: string;
}


// Gera o arquivo CSV com as solicitações rejeitadas
export function gerarRelatorio(
    rejeitados: MigracaoRejeitada[]
): void {


    // Define as colunas do relatório na ordem exigida
    const colunas = [
        "linha",
        "id",
        "nome",
        "de_plano",
        "para_plano",
        "motivo"
    ]

    // Converte os registros rejeitados para o formato CSV
    const conteudoCSV = stringify(rejeitados, {
        header: true,
        columns: colunas
    })

    // Salva o relatório na raiz do projeto
    writeFileSync(
        "relatorio_nao_atualizados.csv",
        conteudoCSV,
        "utf-8"
    );

    console.log("Relatório de rejeições gerado com sucesso!");
}