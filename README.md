# Automação de Migração de Planos

Automação desenvolvida em **Node.js e TypeScript** para processar solicitações de migração de planos de internet da empresa fictícia **NetVila Telecom**.

O sistema recebe um arquivo CSV contendo solicitações de mudança de plano, verifica as regras de negócio, atualiza os contratos válidos em um banco SQLite e gera um relatório das solicitações rejeitadas.

## 1. Tecnologias utilizadas

- **Node.js 22:** ambiente de execução JavaScript.
- **TypeScript:** linguagem utilizada no desenvolvimento.
- **SQLite:** banco de dados relacional.
- **better-sqlite3:** acesso ao banco, consultas e transações.
- **csv-parse:** leitura e interpretação dos arquivos CSV.
- **csv-stringify:** geração do relatório de rejeições.
- **tsx:** execução dos arquivos TypeScript.
- **Node.js Test Runner:** execução dos testes automatizados.

O projeto não necessita de interface gráfica, API HTTP ou servidor de banco de dados.

## 2. Funcionalidades

A aplicação permite:

- Ler arquivos CSV informados pela linha de comando.
- Validar solicitações de migração de planos.
- Identificar contratos inexistentes, cancelados ou duplicados.
- Verificar a correspondência do plano de origem.
- Validar a existência e o status do plano de destino.
- Atualizar somente o campo `plano_id` dos contratos aprovados.
- Executar as atualizações dentro de uma transação SQLite.
- Gerar um relatório CSV contendo as solicitações rejeitadas e seus motivos.
- Exibir no terminal o total de solicitações lidas, atualizadas e rejeitadas.

## 3. Pré-requisitos

Para executar o projeto, é necessário ter instalado:

- Node.js 18 ou superior.
- npm.

Não é necessário instalar um servidor SQLite separadamente.

## 4. Instalação

Clone o repositório e acesse a pasta do projeto:

```bash
git clone https://github.com/Pauloand05/Automacao-migracao.git
cd Automacao-migracao
```

Instale as dependências:

```bash
npm ci
```

O comando utiliza o arquivo `package-lock.json` para instalar as versões registradas das dependências.

## 5. Inicialização do banco de dados

O projeto utiliza um banco SQLite criado a partir do arquivo `seed.sql`.

Para criar o banco e inserir os dados iniciais, execute:

```bash
npm run db:init
```

Esse comando:

1. Cria ou abre o banco `database.sqlite`.
2. Executa as instruções do `seed.sql`.
3. Cria as tabelas `planos` e `contratos`.
4. Insere quatro planos e quinze contratos de exemplo.
5. Exibe a quantidade de registros cadastrados.

**Atenção:** executar esse comando novamente recria as tabelas e restaura os dados originais, descartando as migrações realizadas anteriormente.

## 6. Execução da automação

Após inicializar o banco, execute:

```bash
npm start -- ./migracoes_planos.csv
```

O caminho do CSV é recebido como argumento. É possível informar outro arquivo, desde que siga o formato exigido.

O arquivo precisa conter o cabeçalho:

```csv
id,de_plano,para_plano
```

Onde:

- `id`: identificador do contrato.
- `de_plano`: identificador do plano atual informado pela área comercial.
- `para_plano`: identificador do plano de destino solicitado.

### Resultado esperado

Utilizando o CSV fornecido e o banco com os dados iniciais:

```text
Resumo da execução:
Total de linhas lidas: 15
Total atualizado: 5
Total rejeitado: 10
```

Se a automação for executada novamente sem reinicializar o banco, os resultados poderão ser diferentes, pois os contratos aprovados já terão seus planos atualizados.

## 7. Regras de negócio

Cada solicitação passa pelas seguintes validações, obrigatoriamente nesta ordem:

| Ordem | Validação | Motivo da rejeição |
|---|---|---|
| 1 | Campos obrigatórios preenchidos e numéricos | Linha inválida |
| 2 | Contrato não duplicado no mesmo CSV | Contrato duplicado no arquivo |
| 3 | Contrato existente no banco | Contrato não encontrado |
| 4 | Contrato não cancelado | Contrato cancelado |
| 5 | Plano de origem corresponde ao plano atual | Plano de origem não confere |
| 6 | Plano de destino existe | Plano de destino não encontrado |
| 7 | Plano de destino está ativo | Plano de destino inativo |
| 8 | Plano de origem e destino são diferentes | Contrato já está no plano de destino |

A primeira validação que falhar determina o motivo da rejeição.

As demais solicitações continuam sendo processadas normalmente.

### Regras complementares

- Contratos com status `ativo` ou `nao_instalado` podem migrar.
- Contratos cancelados não podem migrar.
- A primeira ocorrência de um contrato segue o fluxo normal; as seguintes são rejeitadas por duplicidade.
- Um contrato pode migrar de um plano inativo para um plano ativo.
- Somente o plano de destino precisa estar ativo.
- Apenas a coluna `plano_id` é modificada.
- Os identificadores devem ser inteiros positivos e seguros para representação numérica em JavaScript.

## 8. Relatório de rejeições

Ao final de uma execução bem-sucedida, a aplicação gera:

`relatorio_nao_atualizados.csv`

O arquivo contém as colunas:

```csv
linha,id,nome,de_plano,para_plano,motivo
```

- `linha`: número da linha original do CSV.
- `id`: identificador informado no arquivo.
- `nome`: nome do cliente obtido do banco, quando encontrado.
- `de_plano`: valor original informado.
- `para_plano`: valor original informado.
- `motivo`: primeira regra de negócio não atendida.

Os valores recebidos são preservados, inclusive campos vazios e conteúdos não numéricos.

Quando não existem rejeições, o relatório contém somente o cabeçalho.

O relatório é sobrescrito a cada execução bem-sucedida.

## 9. Organização do projeto

```text
Automacao-migracao/
├── scripts/
│   ├── init-db.ts
│   ├── test-db.ts
│   ├── test-migration.ts
│   └── test-update.ts
├── src/
│   ├── index.ts
│   ├── csv.ts
│   ├── database.ts
│   ├── migration.ts
│   ├── report.ts
│   └── types.ts
├── tests/
│   ├── csv.test.ts
│   ├── migration.test.ts
│   ├── integration.test.ts
│   ├── rollback.test.ts
│   └── setup-migration.ts
├── migracoes_planos.csv
├── seed.sql
├── package.json
├── package-lock.json
├── tsconfig.json
├── .gitignore
└── README.md
```

### Responsabilidade dos principais arquivos

| Arquivo | Responsabilidade |
|---|---|
| `index.ts` | Coordenar a execução da automação |
| `csv.ts` | Ler e interpretar o CSV |
| `database.ts` | Consultar e atualizar o banco SQLite |
| `migration.ts` | Executar as oito validações |
| `report.ts` | Gerar o relatório de rejeições |
| `types.ts` | Centralizar os tipos TypeScript |
| `init-db.ts` | Criar e restaurar o banco inicial |

## 10. Testes automatizados

O projeto possui testes automatizados utilizando o executor nativo do Node.js.

Para executar todos os testes:

```bash
npm test
```

A suíte contempla:

- Cinco testes de leitura do CSV.
- Dez testes de regras de negócio.
- Um teste de integração, verificando atualizações, preservação de dados e relatório.
- Um teste do comportamento de rollback do SQLite.

Total: **17 testes automatizados**.

Os testes de integração e validação utilizam bancos isolados para evitar alterações no banco de desenvolvimento.

Para verificar a tipagem do projeto:

```bash
npx tsc --noEmit
```

## 11. Decisões técnicas

### Separação de responsabilidades

O projeto foi dividido em módulos responsáveis pela leitura do CSV, acesso ao banco, regras de negócio e geração do relatório.

Essa organização facilita a manutenção e os testes.

### Consultas parametrizadas

As consultas e atualizações utilizam parâmetros SQL, evitando a concatenação direta dos valores recebidos do arquivo CSV.

### Transações SQLite

As atualizações são executadas dentro de uma transação.

Caso ocorra uma falha inesperada propagada durante o processamento, as alterações realizadas naquela transação são desfeitas.

Rejeições normais das regras de negócio não interrompem o processamento.

### Integridade dos contratos

A operação de atualização modifica exclusivamente `plano_id`, preservando nome, telefone, status e data de instalação.

A instrução de atualização também verifica o contrato, seu plano de origem e seu status antes de modificar o registro.

### Preservação do CSV original

Os campos são inicialmente tratados como texto, permitindo registrar valores inválidos no relatório sem perder seu conteúdo.

### Controle de duplicidades

Um conjunto de identificadores é utilizado durante cada processamento para detectar contratos repetidos no mesmo arquivo.

### Banco isolado nos testes

Os testes utilizam bancos temporários, evitando que suas execuções interfiram nos contratos do banco principal.

## 12. Observações

- O banco `database.sqlite` é gerado localmente e não precisa ser enviado ao repositório.
- O banco pode ser recriado pelo comando `npm run db:init`.
- O relatório é gerado automaticamente durante a execução.
- O mesmo arquivo pode produzir resultados diferentes após as migrações terem sido aplicadas.
- O teste de rollback verifica o mecanismo transacional do `better-sqlite3` em memória.
- Uma falha na escrita do relatório não é revertida automaticamente pela transação do banco SQLite.

## 13. Considerações finais

O projeto automatiza a migração de planos de internet, aplicando regras de negócio, mantendo a integridade dos contratos e disponibilizando um relatório das solicitações que não puderam ser processadas.

A implementação prioriza simplicidade, separação de responsabilidades, validações e facilidade de execução pelo terminal.

fixtell