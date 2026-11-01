# BibliotecaPlay

Aplicação existente em Next.js 15, React 19 e TypeScript, com Prisma 6.19.3 e PostgreSQL no esquema exclusivo bibliotecaplay do Supabase iqrnytsgwaiegddfxfjs.

## Estado atual
Banco e bucket privado conectados no ambiente local. Build de produção, TypeScript, seis testes de origem, diagnósticos reais de banco/storage e quinze verificações do fluxo principal passaram. As fixtures foram removidas ao final. Não houve pagamento real.
A aplicação ainda não foi publicada no domínio e não está pronta para comercialização. Pendências e evidências estão em docs/STATUS.md.

## Executar
Requer Node.js 22+ e pnpm 11.25.0. Configure .env.local com credenciais específicas (arquivo ignorado pelo Git); .env.example é somente referência.
Execute pnpm install --frozen-lockfile, pnpm exec prisma generate, pnpm lint, pnpm test:security, pnpm build e pnpm start. Use pnpm dev para desenvolvimento.
DATABASE_URL deve usar o papel bibliotecaplay_runtime e schema=bibliotecaplay. O driver limita o pool a três conexões e valida o certificado TLS. Não copie credenciais do CRM.
Nunca executar prisma db push, migrate reset ou migrate dev no banco compartilhado. docs/applied contém cópias para auditoria, não uma rotina de recriação do banco existente.

## Diagnósticos
- pnpm check:database: identidade do papel/esquema, escrita com rollback e negação de acesso ao CRM.
- pnpm check:storage: upload/download privado e remoção de arquivo técnico.
- pnpm check:core: servidor local na porta 3102, ou DIAGNOSTIC_BASE_URL informado. Usa e remove fixtures de usuários/conteúdo/assinatura. Não valida cobrança pelo gateway.

O bucket bibliotecaplay-private é privado, limitado a 50 MiB e aceita PDF, WebP e MP4. As credenciais autorizadas ficam somente no servidor. Nenhum segredo foi incluído neste repositório.
O certificado público certs/supabase-prod-ca-2021.crt veio do endereço usado pelo painel oficial: https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt. DATABASE_CA_CERT pode fornecer outro certificado PEM autorizado, mantendo a validação TLS.

Leia docs/STATUS.md para o manual, a evidência de preservação do CRM, os resultados e as limitações atuais.
