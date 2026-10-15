// Representa um plano cadastrado  no banco  SQLite
export interface Plano {
    id: number; // Identificador único do plano
    nome: string; // Nome do plano
    status: "ativo" | "inativo"; // Status do plano, podendo ser "ativo" ou "inativo"
}

export interface Contrato {
    id: number; // Identificador único do contrato
    nome: string; // Nome do contrato
    telefone: string; // Telefone do cliente
    plano_id: number; // Identificador do plano associado ao contrato
    status: "ativo" | "cancelado" | "nao_instalado"; // Status do contrato, podendo ser "ativo", "cancelado" ou "nao_instalado"
    data_instalacao: string | null; // Data de instalação do contrato no formato "YYYY-MM-DD"
}

export interface ResultadoValidacao {
    aprovado: boolean; // Indica se a validação foi aprovada ou não
    motivo?: string; // Motivo da reprovação, caso a validação não seja aprovada
    nome?: string; // Nome do contrato, caso a validação seja aprovada
}