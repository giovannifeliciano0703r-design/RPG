# 🎲 Mestre Arcano RPG

Plataforma para mesas de RPG construída com React, TypeScript, Vite, Express e Supabase. Reúne fichas, bestiário, macros, biblioteca de mídia, NPCs, campanhas, battlemap e iniciativa. O acesso exige uma conta cadastrada no Supabase.

## Recursos

- fichas de personagem, bestiário, macros e rolagem de dados;
- campanhas, NPCs, battlemap/VTT e iniciativa;
- biblioteca de mídia persistida como dados binários no IndexedDB;
- contas reais, banco Postgres, políticas RLS, canais Realtime e armazenamento privado via Supabase;
- armazenamento local versionado, validado, limitado e gravado com debounce;
- backup/restauração local, Error Boundary e interface responsiva.

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

## Configuração

Copie `.env.example` para `.env.local`. Use somente a URL e a chave **publicável** do Supabase no navegador; nunca exponha uma chave `secret` ou `service_role` em variáveis `VITE_*`.

| Variável | Finalidade |
| --- | --- |
| `VITE_SUPABASE_URL` | URL pública do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave publicável protegida por RLS |
| `APP_URL` | URL pública onde o aplicativo está hospedado |

As migrações versionadas ficam em `supabase/migrations`. Elas criam perfis, campanhas, membros, chat, snapshots do VTT e metadados de mídia, além de configurar RLS, Realtime e o bucket privado `campaign-media`.

## Segurança e autenticação

- e-mail e senha são processados exclusivamente pelo Supabase Auth e nunca gravados no `localStorage`;
- não existem perfis locais, modo convidado nem acessos de demonstração;
- senhas e flags administrativas antigas são removidas automaticamente do navegador;
- o papel administrativo vem do banco e é protegido por RLS;
- a API limita o tamanho do corpo, valida a origem de mutações e envia cabeçalhos de segurança;
- o parser de macros aceita somente a gramática aritmética prevista e não usa `eval` ou `new Function`.

## Persistência

Estados pequenos usam chaves versionadas do `localStorage`, gravação com debounce e guardas de quota. Imagens locais e miniaturas usam `Blob` no IndexedDB. Contas hospedadas usam o bucket privado do Supabase Storage, com limite de 10 MB, MIME allowlist, caminho por usuário e metadados no Postgres.

Mensagens e snapshots do VTT são compartilhados em tempo real, com leitura limitada aos membros e escrita de estado restrita a GM/admin pelas políticas RLS.

## Conteúdo e licenças

O projeto é uma ferramenta não oficial. Marcas são usadas somente para indicar compatibilidade. Conteúdo padrão deve ser original ou ter licença/proveniência documentada; importações do usuário permanecem sob responsabilidade de quem as fornece.

Consulte [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) e [CONTENT_POLICY.md](./CONTENT_POLICY.md) antes de adicionar regras, imagens ou blocos de estatísticas.

## Licença

O código e os ativos originais são proprietários e têm todos os direitos reservados por Giovanni Feliciano. Conteúdo, bibliotecas e marcas de terceiros seguem seus próprios termos.

Consulte também [PRIVACY.md](./PRIVACY.md), [TERMS.md](./TERMS.md), [SECURITY.md](./SECURITY.md) e [LICENSE](./LICENSE).
