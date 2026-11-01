# BibliotecaPlay

Aplicação existente em Next.js 15, React 19 e TypeScript, com PostgreSQL/Prisma no esquema exclusivo `bibliotecaplay` do Supabase `iqrnytsgwaiegddfxfjs`.

**Em desenvolvimento. Não habilitar venda de assinaturas antes de validar o fluxo completo.**

## Execução
1. Requer Node.js 20+ e pnpm 11.25.0.
2. Configure as variáveis de `.env.example` em um arquivo local ignorado pelo Git. Não compartilhe credenciais no repositório.
3. `pnpm install --frozen-lockfile`
4. `pnpm exec prisma generate`
5. `pnpm lint`, `pnpm test:security` e `pnpm build`
6. `pnpm dev` para desenvolvimento ou `pnpm start` após o build.

`DATABASE_URL` deve usar explicitamente `schema=bibliotecaplay`. Não execute `prisma db push`, `migrate reset` ou `migrate dev` no banco compartilhado. As tabelas já existem. Credenciais da aplicação devem usar um papel exclusivo com permissões restritas ao esquema.

## Recursos no código
Catálogo público com busca por título/autor e categorias; cadastro/login com bcrypt e sessão HttpOnly; verificação de cargo no banco; proteção de origem nas gravações; administração de categorias e rascunhos; upload assinado de PDF/WebP/MP4; verificação inicial de formato no storage; publicação com PDF e capa; leitor nativo básico e página marcada manualmente; player de vídeo nativo; robots e sitemap.

Esses recursos dependem de banco e storage configurados e não foram todos validados com serviços reais. O leitor atual não oferece todas as funções do PDF.js. O player ainda não tem transcodificação nem progresso persistente.

## Supabase e preservação do CRM
Sete tabelas exclusivas, com RLS habilitado, sem acesso de `anon` e `authenticated`. A autenticação da BibliotecaPlay usa seu próprio modelo User; não reutiliza os usuários do CRM nem modifica `auth`.

Storage provisionado: bucket privado `bibliotecaplay-private`, criado em 31/10/2026, com limite de 50 MiB e formatos PDF, WebP e MP4. A integração runtime ainda depende de credenciais autorizadas. Endpoint e região estão preparados em `.env.example`, sem credenciais. Nunca reutilize credenciais compartilhadas com outros projetos; a configuração de acesso mínimo precisa ser resolvida antes da integração real.

## Estado e pendências
Leia [docs/STATUS.md](docs/STATUS.md) para os testes, alterações aplicadas no Supabase, evidência de preservação do CRM, manual básico e bloqueios externos.

Ainda faltam gateway e webhooks de pagamentos, verificação/recuperação de senha, rate limiting persistente, gestão editorial completa, favoritos, PDF.js, processamento de vídeos, importação em massa, dashboard financeiro, validação visual, testes ponta a ponta e publicação.

Nenhum pagamento real foi realizado. Nenhum segredo foi incluído no código.
