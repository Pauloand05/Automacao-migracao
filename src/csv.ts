import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

// Representa uma solicitação de migração recebida no CSV
export interface MigracaoCSV {
  linha: number;
  id: string;
  de_plano: string;
  para_plano: string;
}

// Lê um arquivo CSV e retorna as solicitações de migração
export function lerCSV(caminhoArquivo: string): MigracaoCSV[] {

  // Lê o conteúdo do arquivo CSV como texto
  const conteudo = readFileSync(caminhoArquivo, "utf-8");

  // Converte o conteúdo do CSV em registros
  const registros = parse(conteudo, {
    columns: true,              // Utiliza o cabeçalho como nome das colunas
    skip_empty_lines: true,     // Ignora linhas vazias
    bom: true,                  // Trata arquivos UTF-8 com BOM
    relax_column_count: true,   // Permite linhas com campos faltando
    trim: true,                 // Remove espaços extras
    info: true,                 // Obtém o número da linha original
  }) as Array<{
    record: Record<string, string>;
    info: { lines: number };
  }>;

  // Organiza cada registro no formato usado pela aplicação
  return registros.map(({ record, info }) => ({
    linha: info.lines,
    id: record.id ?? "",
    de_plano: record.de_plano ?? "",
    para_plano: record.para_plano ?? "",
  }));
}