# 🎲 Mestre Arcano RPG

Plataforma para mesas de RPG construída com React, TypeScript, Vite, Express e Supabase. Reúne fichas, bestiário, macros, biblioteca de mídia, NPCs, campanhas, battlemap e iniciativa. O acesso exige uma conta cadastrada no Supabase.

## Recursos

- fichas de personagem, bestiário, macros e rolagem de dados;
- campanhas, NPCs, battlemap/VTT e iniciativa;
- biblioteca de mídia privada no Supabase Storage, com miniaturas e quota por conta;
- contas reais, banco Postgres, políticas RLS, canais Realtime e armazenamento privado via Supabase;
- sincronização versionada por conta e histórico de alterações para resolver conflitos entre aparelhos;
- autenticação multifator opcional, recuperação de senha, encerramento de sessões, exportação e exclusão de conta;
- campanhas com convites expiráveis, CoMestre com permissões granulares, saída e remoção segura de participantes;
- lixeira recuperável, Error Boundary e interface responsiva.

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
npm run test:e2e
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
- a verificação em duas etapas TOTP pode ser ativada no perfil e é exigida nos logins seguintes;
- convites, mudanças de papel, remoções e estados compartilhados são autorizados novamente no banco;
- a API limita o tamanho do corpo, valida a origem de mutações e envia cabeçalhos de segurança;
- o parser de macros aceita somente a gramática aritmética prevista e não usa `eval` ou `new Function`.

## Persistência

O estado de cada conta é salvo no Postgres em lotes atômicos, com versão, debounce, prevenção de sobrescrita e atualização Realtime entre aparelhos. O `localStorage` guarda somente preferências transitórias e nunca é tratado como fonte de autorização. Imagens e miniaturas usam o bucket privado do Supabase Storage, com limite de 10 MB por arquivo, quota total de 100 MB, tipos permitidos, caminho por usuário e metadados no Postgres.

Mensagens e snapshots do VTT são compartilhados em tempo real. A leitura é limitada aos membros; a escrita segue as permissões do Mestre ou do CoMestre tanto na interface quanto nas funções protegidas do banco.

## Operação e monitoramento

O CI bloqueia vulnerabilidades moderadas ou superiores nas dependências de produção. O Dependabot propõe atualizações semanais de pacotes e mensais das ações do GitHub, sem merge automático. A substituição `qs >=6.16.0` corrige os avisos GHSA-x5fp-wj9c-mxmx e GHSA-4mjr-xmp4-gh2g enquanto Express/body-parser limitam a resolução à linha 6.15; reavalie a substituição ao atualizar essas dependências.

O recebimento de telemetria recusa JSON que não seja objeto e interrompe a leitura de corpos acima de 4 KB, medidos em bytes. Somente os campos permitidos são registrados; mensagens arbitrárias e campos extras são descartados.

`GET /api/health` verifica o Supabase, não usa cache e retorna `503` quando a dependência está indisponível ou ausente em produção. As requisições geram logs JSON com identificador, duração e status, compatíveis com os Runtime Logs da Vercel. O CI executa lint, TypeScript, testes unitários, testes no Chromium, build de produção, reconstrução local do Supabase e testes pgTAP de schema/RLS.

## Conteúdo e licenças

O projeto é uma ferramenta não oficial. Marcas são usadas somente para indicar compatibilidade. Conteúdo padrão deve ser original ou ter licença/proveniência documentada; importações do usuário permanecem sob responsabilidade de quem as fornece.

Consulte [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) e [CONTENT_POLICY.md](./CONTENT_POLICY.md) antes de adicionar regras, imagens ou blocos de estatísticas.

## Licença

O código e os ativos originais são proprietários e têm todos os direitos reservados por Giovanni Feliciano. Conteúdo, bibliotecas e marcas de terceiros seguem seus próprios termos.

Consulte também [PRIVACY.md](./PRIVACY.md), [TERMS.md](./TERMS.md), [SECURITY.md](./SECURITY.md) e [LICENSE](./LICENSE).
