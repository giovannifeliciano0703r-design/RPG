# 🎲 Mestre Arcano RPG

Plataforma para mesas de RPG construída com React, TypeScript, Vite, Express e Supabase. Reúne consulta assistida por IA, fichas, bestiário, macros, biblioteca de mídia, NPCs, campanhas, battlemap, iniciativa e relatórios. Sem configuração do Supabase, o modo local continua disponível.

## Recursos

- Mestre Arcano com Gemini e fallback local identificado como baixa confiança;
- fichas de personagem, bestiário, macros e rolagem de dados;
- campanhas, NPCs, battlemap/VTT e iniciativa;
- base de conhecimento personalizada com recuperação apenas dos trechos relevantes;
- biblioteca de mídia persistida como dados binários no IndexedDB;
- armazenamento local versionado, validado, limitado e gravado com debounce;
- backup/restauração local e Error Boundary;
- interface responsiva com diálogos acessíveis e módulos carregados sob demanda.
- contas reais, banco Postgres, políticas RLS, canais Realtime e armazenamento privado de mídia via Supabase;

## Desenvolvimento

Requer Node.js 22.13 ou mais recente.

```bash
npm ci
npm run dev
```

Validação completa:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

O workflow em `.github/workflows/ci.yml` executa as mesmas verificações em todo pull request para `main`.

## Configuração

Copie `.env.example` para `.env.local`. A URL e a chave **publicável** do Supabase podem ser usadas no navegador; nunca exponha uma chave `secret`/`service_role` em variáveis `VITE_*`.

| Variável | Finalidade |
| --- | --- |
| `GEMINI_API_KEY` | Chave da API Gemini, usada exclusivamente pelo servidor |
| `SESSION_SECRET` | Segredo aleatório de pelo menos 32 caracteres para assinar sessões |
| `ADMIN_USER_ID` | ID canônico do administrador configurado |
| `ADMIN_USER_IDS` | Lista separada por vírgulas de IDs autorizados; deve conter `ADMIN_USER_ID` |
| `ADMIN_EMAIL` | E-mail de login administrativo |
| `ADMIN_PASSWORD_HASH` | Hash `scrypt:<salt>:<hash>` gerado pela função server-side `hashPassword` |
| `ADMIN_DISPLAY_NAME` | Nome público opcional do administrador |
| `VITE_SUPABASE_URL` | URL pública do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável protegida por RLS; não use a chave secreta |

As migrações versionadas ficam em `supabase/migrations`. A primeira cria perfis, campanhas, membros, chat, snapshots do VTT e metadados de mídia; também configura RLS, Realtime e o bucket privado `campaign-media`.

## Segurança e autenticação

- quando configurado, e-mail e senha são processados pelo Supabase Auth e nunca gravados no `localStorage`;
- perfis locais continuam sendo um recurso offline de demonstração e não possuem senha;
- senhas e flags administrativas antigas são removidas automaticamente do `localStorage`;
- acesso administrativo depende de allowlist e validação server-side, nunca de prefixo de e-mail ou `role` enviado pelo navegador;
- a sessão administrativa usa cookie assinado, `HttpOnly`, `SameSite=Strict` e `Secure` em produção;
- login e consultas de IA têm limites básicos por IP; em produção, complemente-os no proxy/gateway compartilhado;
- a API restringe tamanho de corpo e histórico, valida origem em mutações e envia cabeçalhos de segurança;
- o parser de macros aceita somente a gramática aritmética prevista e não usa `eval` ou `new Function`.

Papéis globais e papéis por campanha são gravados no banco e protegidos por RLS. Um cliente não consegue se promover a GM ou administrador alterando o JavaScript ou o armazenamento do navegador.

## Persistência

Estados pequenos usam chaves `v2` do `localStorage`, gravação com debounce e guardas de quota. Falhas deixam de ser ignoradas silenciosamente e geram aviso na interface.

Imagens locais e miniaturas são armazenadas como `Blob` no IndexedDB. Contas hospedadas usam o bucket privado do Supabase Storage, com limite de 10 MB, MIME allowlist, caminho por usuário e metadados no Postgres.

O esquema hospedado fornece mensagens e snapshots de VTT compartilhados em tempo real, com permissões de leitura por membro e escrita de estado somente para GM/admin. O serviço local permanece como fallback offline durante a migração gradual da interface.

## IA e base de conhecimento

O servidor tenta os modelos estáveis `gemini-3.7-flash`, `gemini-3.6-flash` e `gemini-3.1-flash-lite`, em ordem. A seleção de contexto pontua título, palavras-chave, conteúdo e sistema ativo, limita quantidade/tamanho e trata notas do usuário como dados não confiáveis, não como instruções.

Respostas offline, falhas de todos os modelos ou conteúdo sem fonte são explicitamente rebaixados para baixa confiança. O fallback embutido é apenas um índice resumido de material aberto/original; não reproduz capítulos ou blocos proprietários.

## Conteúdo e licenças

O projeto é uma ferramenta não oficial. Marcas são usadas somente para indicar compatibilidade. Conteúdo padrão deve ser original ou ter licença/proveniência documentada; importações do usuário permanecem sob responsabilidade de quem as fornece.

Consulte [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) e [CONTENT_POLICY.md](./CONTENT_POLICY.md) antes de adicionar regras, imagens ou blocos de estatísticas.

## Próximas etapas

- busca vetorial/embeddings para acervos grandes;
- testes end-to-end adicionais de IndexedDB e fluxos completos do VTT;
- divisão adicional do estado de `App.tsx` em contextos por domínio;
- auditoria contínua de acessibilidade e proveniência do conteúdo.

## Licença

A licença do código ainda deve ser escolhida pelo mantenedor antes de redistribuição ampla. Conteúdo e marcas de terceiros seguem seus próprios termos.
