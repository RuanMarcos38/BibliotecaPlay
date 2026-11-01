# BibliotecaPlay — estado em 01/11/2026

## Entrega atual
Aplicação existente preservada no repositório RuanMarcos38/BibliotecaPlay, branch feat/bibliotecaplay-foundation, PR #1.
Prévia local conectada: http://127.0.0.1:3103. O domínio comercial ainda não foi publicado nesta sessão.
Não está pronta para comercialização: cobrança recorrente e cancelamento pelo gateway não foram implementados/validados.

## Supabase
Projeto autorizado iqrnytsgwaiegddfxfjs, CRM R2 MARKETING DIGITAL, região us-west-2.
As sete tabelas permanecem exclusivamente no esquema bibliotecaplay: User, Category, Ebook, Video, Subscription, ReadingProgress e PaymentEvent.
RLS está habilitado. As políticas bp_server_runtime destinam-se somente ao papel interno bibliotecaplay_runtime; anon/authenticated não receberam acesso.
Papel exclusivo habilitado com credencial aleatória própria, sem superusuário, criação de bancos/papéis, replicação ou bypass de RLS. Permissões explícitas SELECT/INSERT/UPDATE/DELETE apenas nas sete tabelas; limite de cinco conexões no papel e três no pool da aplicação.
Verificação de privilégios não encontrou tabelas de outros esquemas com SELECT disponível ao papel. Consulta direta à tabela de contatos do CRM foi recusada no teste de integração.
A conexão usa Prisma 6.19.3 com PrismaPg e driver Node, certificado oficial do Supabase e validação TLS ativa. O conector nativo Windows apresentou erro TLS; o driver Node resolveu a conexão sem desativar a validação do certificado.

## Armazenamento
Bucket bibliotecaplay-private criado, privado, sem políticas públicas, limitado a 50 MiB; tipos permitidos application/pdf, image/webp e video/mp4.
O usuário criou a chave S3 após ser informado de que o Supabase concede a esse tipo de chave acesso a todos os buckets e bypass de RLS. A chave foi configurada somente no servidor local, em .env.local ignorado pelo Git. Não há credenciais no repositório ou neste relatório.
Teste real passou: envio de PDF técnico, conferência de metadados, download íntegro por URL temporária, bloqueio do endpoint público e remoção do arquivo de diagnóstico.

## Código corrigido
- Isolamento explícito do esquema e uso obrigatório do papel bibliotecaplay_runtime.
- Driver PostgreSQL Node e certificado CA público oficial versionado em certs/.
- Validação dos cargos no banco a cada sessão, cookie HttpOnly e assinatura JWT HS256.
- Proteção de origem corrigida para o endereço externo do navegador quando o Next.js normaliza a URL interna para localhost; compatibilidade HTTPS por proxy e rejeição de X-Forwarded-Host forjado.
- Upload, vinculação e publicação de PDF/capa privados; validação de metadados e assinatura inicial do arquivo. Isso não substitui antivírus nem análise completa de PDF/vídeo.
- URLs temporárias, leitor PDF básico do navegador, página marcada manualmente e player nativo básico.
- Limites de vídeo alinhados a 50 MiB, conforme o projeto atual.
- Scripts reproduzíveis para testar banco, storage e fluxo principal; seis regressões de segurança.

## Testes realizados
1. Build Next.js de produção: passou.
2. TypeScript: passou.
3. Proteção de origem: 6/6 testes passaram, incluindo normalização interna, proxy HTTPS, origem externa, Host malformado e cabeçalho de host encaminhado forjado.
4. Banco real: identidade do papel/esquema, leitura e escrita, rollback de diagnóstico, negação de acesso ao CRM e validação TLS passaram.
5. Storage real: envio, HEAD, download assinado, negação pública e limpeza passaram.
6. Fluxo local via HTTP contra Supabase real: 15 verificações passaram — cookies das duas sessões, cadastro sem elevação de cargo, bloqueio administrativo do assinante, publicação bloqueada sem PDF/capa, upload PDF/capa, livro na busca, capa legível, PDF bloqueado sem acesso ativo, download íntegro com acesso ativo, progresso persistido, leitor com página salva, bloqueio de vencimento e logout.
7. A assinatura ACTIVE usada no teste era uma fixture temporária criada diretamente no banco para verificar autorização. Nenhum pagamento foi simulado como real; isso NÃO valida checkout, webhook, renovação ou cancelamento.
8. Todos os usuários, categoria, livro, assinatura, progresso e arquivos temporários do teste integrado foram removidos.
9. Navegador: homepage conectada carregou. Medidas nas larguras 320, 375, 390, 768, 1024, 1440 e 1920 não mostraram overflow horizontal do documento, com título visível. Essa verificação foi feita com acervo vazio; não equivale à validação visual de todas as telas e estados. A captura de tela completa encontrou timeout.
10. Vídeo real e reprodução/progresso não foram validados.

## Preservação do CRM
Não houve DML em tabelas de outros sistemas, alteração de suas credenciais, políticas, APIs, n8n ou implantação. A criação de bucket foi feita pela API normal do painel; nenhuma estrutura do esquema storage foi alterada por SQL.
Na preparação inicial do papel, a impressão dos metadados externos a bibliotecaplay foi idêntica antes/depois: dfa6f9c1034e47c1ed7f4fc10e9c8ce6. A comparação cobre tabelas/colunas, RLS e privilégios e não representa backup de dados nem teste completo do CRM.
Cópias auditáveis das mudanças sem segredos: docs/applied/. A habilitação de login e o provisionamento da credencial foram feitos separadamente, sem registrar senha na migração versionada.

## Manual básico
Desenvolvimento: Node.js e pnpm 11.25.0; configure .env.local com valores privados, depois pnpm install --frozen-lockfile, pnpm exec prisma generate, pnpm build e pnpm start.
Diagnósticos (Node 22+): pnpm test:security, pnpm check:database, pnpm check:storage. Para o fluxo integrado, rode o servidor local na porta 3102 ou informe DIAGNOSTIC_BASE_URL apontando para localhost/127.0.0.1 e execute pnpm check:core.
Nunca executar prisma db push, migrate dev ou migrate reset no projeto compartilhado.
Administrador autorizado: /admin → categoria → rascunho de e-book → PDF e capa WebP → publicação. Uma conta administrativa permanente ainda precisa ser definida; nenhuma senha administrativa fixa foi criada.
Assinante com acesso confirmado: selecionar o e-book → Continuar leitura → informar e salvar a página manualmente. A autorização é checada no servidor.

## Pendências
- Hospedar o servidor Next.js e configurar domínio/SSL. A criação no Vercel foi recusada com 403; nenhuma aplicação de outro projeto foi substituída. O domínio resolve para 77.37.42.194 e 91.108.127.168 na consulta desta sessão, mas não está vinculado à prévia local.
- Conta administrativa permanente, verificação/recuperação de e-mail e senha, alteração de senha, revogação persistente de sessões e rate limiting.
- Gateway de cobrança em ambiente de teste, webhook autenticado/idempotente, conciliação, renovação, cancelamento e histórico financeiro.
- PDF.js completo, favoritos, avanço automático de leitura, vídeo privado com processamento/HLS e progresso, importação em massa e administração editorial/financeira completa.
- Imagem de referência visual oficial, capas reais e conteúdo autorizado, mockups fotográficos, tipografia solicitada, termos/privacidade com dados reais e revisão completa das sete larguras com acervo real.
- Testes finais ponta a ponta incluindo pagamento, liberação de acesso e cancelamento antes de qualquer venda.

Nenhuma cobrança real foi realizada.
