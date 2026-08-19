# 🎲 Mestre Arcano RPG

Uma central de RPG de mesa construída com React, TypeScript e Vite, reunindo **Mestre de IA, fichas, bestiário, macros, biblioteca de mídia, NPCs, campanhas e mesa virtual** em uma única aplicação.

## ✨ Recursos

- 🤖 Mestre Arcano com IA
- 📜 Fichas de personagem
- 💀 Bestiário e blocos de estatísticas
- 🎲 Rolagem de dados e macros
- 🗺️ Battlemap/VTT e iniciativa
- 👥 Campanhas e NPCs
- 📚 Base de conhecimento personalizada
- 🖼️ Biblioteca de mídia
- 📊 Relatórios
- 💾 Persistência local
- 🛡️ Error Boundary
- 🔐 Migração automática de credenciais antigas que remove senhas em texto puro do `localStorage`
- 🧮 Parser matemático próprio para macros, sem `eval`/`new Function`
- ⏱️ Persistência com debounce disponível para evitar serializações a cada tecla
- 🧱 Guardas de quota para reduzir falhas silenciosas de `localStorage`
- 🛡️ Primitivas de autorização server-side e hash de senha para a futura autenticação real

## 🧰 Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Express
- Google Gemini SDK
- Lucide React
- Motion

## 🚀 Desenvolvimento

```bash
npm install
npm run dev
```

## 📦 Build de produção

```bash
npm run build
npm start
```

## 🔐 Segurança

O modo atual ainda é uma aplicação local/demo. `localStorage` **não é uma fronteira de segurança** e permissões administrativas reais precisam ser verificadas no servidor.

Para uma implantação real, configure `ADMIN_USER_IDS` no servidor e use uma solução de autenticação com sessão/token seguro. Nunca confie em `email`, `role` ou `isAdmin` enviados pelo navegador.

As credenciais da IA devem permanecer no servidor. Nunca coloque chaves secretas em componentes React ou em variáveis `VITE_*`.

## 💾 Persistência

A aplicação possui armazenamento local para o modo offline. Imagens grandes em Base64 podem exceder os limites do navegador; para produção, a biblioteca de mídia deve migrar para object storage (S3/R2/Supabase Storage, por exemplo) e guardar apenas URLs/IDs no banco.

## 🌐 Multiplayer

O módulo de campanha/VTT local não é multiplayer real entre navegadores enquanto o estado permanecer no `localStorage`. Para sessões entre máquinas diferentes, é necessário um backend com sincronização (WebSocket, Supabase Realtime, Firebase ou equivalente).

## 🤖 IA e modelos

Os identificadores de modelos devem ser mantidos atualizados conforme a documentação oficial do Gemini. Evite nomes inventados ou modelos preview já descontinuados.

## 🗺️ Próximas melhorias

- [ ] Integrar autenticação server-side ao fluxo de login
- [ ] Migrar campanhas/VTT para banco + realtime
- [ ] Migrar imagens para object storage
- [ ] Integrar busca semântica/embeddings para RAG
- [ ] Extrair `App.tsx` em hooks e módulos de domínio
- [ ] Unificar completamente os IDs de sistema em todos os modelos legados
- [ ] Virtualização de listas grandes
- [ ] Modais acessíveis para substituir `alert`/`confirm`
- [ ] Auditoria de conteúdo/licenças do bestiário
- [ ] Testes automatizados para regras e macros

## 📄 Licença

Defina aqui a licença do projeto antes de distribuir publicamente.
