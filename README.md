# BibliotecaPlay

Base inicial Next.js + TypeScript + PostgreSQL/Prisma para uma biblioteca de e-books por assinatura, orientada pela referência visual aprovada.

## Executar localmente
1. Requer Node.js 20+ e PostgreSQL.
2. Copie `.env.example` para `.env`, configure DATABASE_URL e uma SESSION_SECRET aleatória com 32+ caracteres.
3. Execute `npm install`, `npx prisma migrate dev --name init` e `npm run dev`.
4. Acesse http://localhost:3000.

## Já implementado nesta branch
- Homepage responsiva, com cores preto/vermelho, filtros, busca e trilhos de capas reais vindas do banco.
- Não são geradas capas fictícias: placeholders aparecem quando não há capa publicada.
- Cadastro/login com bcrypt, cookie HttpOnly assinado, logout e acesso à página do assinante.
- Modelo relacional com papéis, categorias, e-books, assinaturas, progresso e eventos de pagamentos.
- API administrativa para registrar e-books em modo rascunho (não existe publicação automática).
- Bloqueio de conteúdo sem assinatura ativa no servidor.

## Ainda NÃO implementado (não vender assinaturas até validar)
- Bootstrap seguro do primeiro ADMIN (não elevar cargos pelo endpoint público).
- Rate limiting, e-mail de verificação, recuperação de senha e CSRF adicional onde necessário.
- Upload privado e validação de PDF/capa, leitura com PDF.js, importação em massa.
- Vídeos, player e processamento, progresso e catálogo personalizado.
- Checkout recorrente, webhooks verificados, conciliação, cancelamento, faturamento real.
- Dashboard completo, editor visual, testes end-to-end e deploy.
- Mockups fotográficos reais de notebook e celular: o layout atual usa estruturas CSS provisórias.
- Acesso à leitura dos arquivos está intencionalmente INDISPONÍVEL até implementar storage protegido.

## Segurança
Não defina manualmente status de assinatura via frontend. O estado ACTIVE e paidThrough devem vir exclusivamente da conciliação segura com um provedor de pagamento. Não inclua PDFs protegidos no diretório public/. Nunca exponha DATABASE_URL ou SESSION_SECRET. Não conceda ADMIN por cadastro público. Credenciais de outros projetos não devem ser reutilizadas.

## Próximas prioridades
1. Provisionar banco isolado e storage privado.
2. Implementar upload administrativo com verificação MIME, tamanho, antivírus e processamento em fila.
3. Integrar gateway com webhook autenticado e idempotente; habilitar leitores apenas após testes.
4. Adicionar PDF.js, vídeos HLS e testes de acesso negativo.


## CRM R2 Supabase — isolamento obrigatório
O banco autorizado é o CRM R2 MARKETING DIGITAL, porém **somente o schema `bibliotecaplay`** pode ser utilizado.
- Projeto Supabase: `iqrnytsgwaiegddfxfjs`.
- Criadas 7 tabelas isoladas: User, Category, Ebook, Video, Subscription, ReadingProgress, PaymentEvent.
- Nunca executar `prisma db push`, `prisma migrate reset` ou `prisma migrate dev` contra a instância compartilhada de produção. A migração inicial já foi aplicada de forma controlada.
- DATABASE_URL deve incluir `?schema=bibliotecaplay` (ou `&schema=bibliotecaplay` se já houver parâmetros).
- Recomendado criar um papel PostgreSQL exclusivo com privilégios restritos ao schema bibliotecaplay, em vez de usar o usuário postgres compartilhado.
- Não executar instruções DDL em `public`, `auth`, `storage` ou outros schemas do CRM.
- O banco existe; aplicação ainda depende da DATABASE_URL secreta configurada na hospedagem e validação em ambiente de teste.
