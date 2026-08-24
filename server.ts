import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { findFallbackAnswer } from "./server/rulesEngine";
import {
  authenticateConfiguredAdmin,
  clearAdminSessionCookie,
  isAdminAuthConfigured,
  publicAdminProfile,
  readAdminSession,
  setAdminSessionCookie,
} from "./server/auth";
import { buildKnowledgeContext, selectRelevantKnowledge } from "./server/rag";

dotenv.config();

const app = express();
const PORT = 3000;

app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
    );
  }
  next();
});

app.use("/api", (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const origin = req.get("origin");
  const host = req.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        res.status(403).json({ error: "Origem da requisição não permitida." });
        return;
      }
    } catch {
      res.status(403).json({ error: "Origem da requisição inválida." });
      return;
    }
  }
  next();
});

// Lazy-initialize Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

const SYSTEM_INSTRUCTION = `# PERSONA
Você é o "Mestre Arcano", um especialista enciclopédico em RPGs de mesa, com conhecimento profundo sobre os principais sistemas de RPG do mundo:
- Dungeons & Dragons (D&D - 5e, 3.5e, AD&D, One D&D)
- Pathfinder (1e e 2e)
- Tormenta20 (T20 e edições clássicas)
- Vampiro: A Máscara (Storyteller / V5 / V20)
- Call of Cthulhu (7ª Edição, d100 BRP, Sanidade, Mitos)
- GURPS (4ª Edição, 3d6, Vantagens e Desvantagens)
- Savage Worlds (SWADE, Dados Selvagens, Benas, Baralho de Iniciativa)
- Fate Core (Dados Fudge, Aspectos, Façanhas, Pontos de Destino)
- Cyberpunk Red (STAT + SKILL + 1d10, Cyberware, Humanidade, Netrunning)
- Old Dragon (OSR brasileiro, D20 roll-under/roll-high, exploração clássica)

Você atua como o motor de busca e consulta de regras de um aplicativo de RPG, respondendo com precisão de banco de dados e didatismo de professor experiente.

# CONTEXTO
Você está integrado a um aplicativo cujo objetivo é permitir que jogadores e mestres pesquisem qualquer informação de regras: classes, raças/linhagens/ancestralidades, magias, atributos, perícias, vantagens, desvantagens, buffs, debuffs, itens, ciberimplantes, façanhas, sanidade e mecânicas. Os usuários podem perguntar de forma genérica ("fala sobre o Bárbaro") ou específica ("Sanidade no Call of Cthulhu 7e").

# USO DE CONTEXTO RECUPERADO (RAG)
Quando trechos de documentos ou do Banco de Regras Customizadas forem fornecidos:
- Priorize SEMPRE essas informações sobre memórias vagas.
- Se a informação não for encontrada com precisão, diga explicitamente: "não encontrei essa informação na base de dados consultada" — em seguida, se for complementar com conhecimento próprio, deixe isso claro como uma suposição, nunca misture silenciosamente.
- Ao citar, parafraseie; nunca copie parágrafos inteiros do material fonte.
- O campo "Nível de confiança" (ver Formato de Saída) deve refletir a origem da informação:
  - **Alta** = confirmado pelas regras centrais ou SRD oficial do sistema
  - **Média** = conhecimento interno consistente e plausível com o sistema/edição
  - **Baixa** = incerteza ou regras caseiras/ambíguas

# TAREFA
Quando o usuário fizer uma pergunta:
1. Identifique o SISTEMA de RPG e a EDIÇÃO mencionados.
   - Se não forem especificados na pergunta, responda diretamente com base no SISTEMA ATIVO selecionado no aplicativo (padrão: Dungeons & Dragons (D&D)), e deixe isso explícito na primeira linha da resposta.
   - Só peça esclarecimento se a pergunta for ambígua a ponto de nenhuma suposição razoável ser possível.
2. Organize a resposta no FORMATO DE SAÍDA abaixo.
3. Sempre que a informação não estiver clara, diga isso explicitamente ("não tenho certeza sobre este detalhe específico") em vez de inventar regras, números ou nomes.
4. Se a pergunta envolver comparação entre edições/sistemas, estruture a resposta em uma tabela comparativa Markdown.

# FORMATO DE SAÍDA
Para cada consulta sobre um elemento de RPG (classe, raça, magia, item, etc.), estruture assim, sem nenhum texto antes do título exceto uma frase curta de contexto se necessário:

**[Nome do Elemento] — [Sistema] [Edição]**
- **Categoria**: (Classe / Raça / Magia / Atributo / Vantagem / Desvantagem / Item / Mecânica)
- **Descrição resumida**: 1-2 frases
- **Atributos/Requisitos**: (ex: Força mínima, nível necessário)
- **Habilidades/Efeitos principais**: lista com bullets
- **Vantagens**: lista com bullets
- **Desvantagens/Custos**: lista com bullets
- **Buffs/Debuffs associados**: se aplicável
- **Fonte**: nome do livro/manual de referência
- **Nível de confiança**: Alta / Média / Baixa

# RESTRIÇÕES
- NUNCA invente regras, números ou nomes de magias/itens que não existam — se não souber, admita.
- NÃO copie textualmente parágrafos extensos de livros oficiais — sempre resuma e reformule com suas próprias palavras.
- Use tom didático, direto e sem gírias excessivas, mas amigável ao universo geek/RPG.
- Responda em português do Brasil, salvo pedido contrário.
- Se o usuário pedir "todas as magias de nível 3", limite a resposta a até 15 itens por vez e ofereça continuar a lista.`;

// API routes FIRST
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const chatRequests = new Map<string, { count: number; resetAt: number }>();

function consumeRateLimit(
  store: Map<string, { count: number; resetAt: number }>,
  key: string,
  limit: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const current = store.get(key);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  bucket.count += 1;
  store.set(key, bucket);

  if (store.size > 5_000) {
    for (const [storedKey, value] of store) {
      if (value.resetAt <= now) store.delete(storedKey);
    }
  }

  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1_000)),
  };
}

app.get("/api/auth/session", (req, res) => {
  const session = readAdminSession(req);
  res.setHeader("Cache-Control", "no-store");
  res.json({ user: session ? publicAdminProfile(session) : null, configured: isAdminAuthConfigured() });
});

app.post("/api/auth/login", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const key = req.ip || "unknown";
  const limit = consumeRateLimit(loginAttempts, key, 8, 15 * 60_000);
  if (!limit.allowed) {
    res.setHeader("Retry-After", String(limit.retryAfterSeconds));
    res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos." });
    return;
  }

  const session = authenticateConfiguredAdmin(req.body?.email, req.body?.password);
  if (!session || !setAdminSessionCookie(res, session, req.body?.remember !== false)) {
    res.status(401).json({ error: "Credenciais administrativas inválidas ou acesso ADM não configurado." });
    return;
  }
  loginAttempts.delete(key);
  res.json({ user: publicAdminProfile(session) });
});

app.post("/api/auth/logout", (_req, res) => {
  clearAdminSessionCookie(res);
  res.setHeader("Cache-Control", "no-store");
  res.status(204).end();
});

app.post("/api/chat", async (req, res) => {
  try {
    const rateLimit = consumeRateLimit(chatRequests, req.ip || "unknown", 30, 60_000);
    if (!rateLimit.allowed) {
      res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
      res.status(429).json({ error: "Limite de consultas atingido. Tente novamente em instantes." });
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    const { message, history = [], activeSystem = "Dungeons & Dragons (D&D)", customKnowledge = [] } = req.body;

    if (!message || typeof message !== "string" || message.length > 4_000) {
      res.status(400).json({ error: "Mensagem inválida." });
      return;
    }

    const safeSystem = typeof activeSystem === "string" ? activeSystem.slice(0, 100) : "Dungeons & Dragons (D&D)";
    const relevantKnowledge = selectRelevantKnowledge(message, customKnowledge, safeSystem);
    const safeHistory = Array.isArray(history)
      ? history
          .slice(-10)
          .filter((item) => item && typeof item.content === "string")
          .map((item) => ({
            role: item.role === "assistant" || item.role === "model" ? "model" : "user",
            content: item.content.slice(0, 4_000),
          }))
      : [];

    const ai = getGenAI();

    if (!ai) {
      // Offline fallback when no GEMINI_API_KEY is configured
      const fallbackText = findFallbackAnswer(message, safeSystem, relevantKnowledge);
      res.json({ text: fallbackText, isFallback: true, confidence: "low", sources: relevantKnowledge.map((entry) => entry.title) });
      return;
    }

    // Prepare system instruction with the active system guidance and custom knowledge
    const systemPromptWithSystem = `${SYSTEM_INSTRUCTION}

# SISTEMA ATIVO ATUALMENTE SELECIONADO NO APP:
O usuário configurou como sistema padrão na interface: "${safeSystem}".
Se a pergunta não especificar sistema ou edição, assuma como foco prioritário "${safeSystem}". Se estiver como "Outro / não especificar", use D&D 5ª Edição como padrão. Lembre-se de mencionar a premissa na primeira frase da resposta quando o sistema não for fornecido explicitamente na pergunta.${buildKnowledgeContext(relevantKnowledge)}`;

    // Map conversation history
    const contents: any[] = [];
    
    // Add past turns
    for (const msg of safeHistory) {
      contents.push({ role: msg.role, parts: [{ text: msg.content }] });
    }

    // Add current user prompt
    contents.push({ role: "user", parts: [{ text: message }] });

    // Models to attempt in order of preference if 503/high demand occurs
    const candidateModels = [
      "gemini-3.7-flash",
      "gemini-3.6-flash",
      "gemini-3.1-flash-lite",
    ];

    let responseText: string | null = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: contents,
          config: {
            systemInstruction: systemPromptWithSystem,
            temperature: 0.2, // low temperature for encyclopedic rule fidelity
          },
        });

        if (response.text) {
          responseText = response.text;
          break;
        }
      } catch (err: any) {
        lastError = err;
        const statusCode = err?.status || err?.code || (err?.message?.includes("503") ? 503 : 0);
        console.warn(`Tentativa com modelo ${modelName} indisponível (código: ${statusCode}). Tentando próximo modelo...`);
        // Small delay before trying next fallback model
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    if (responseText) {
      res.json({ text: responseText, sources: relevantKnowledge.map((entry) => entry.title) });
      return;
    }

    // If all candidate models failed or returned empty, use knowledge base fallback
    console.warn("Todos os modelos online ocupados. Ativando Base de Regras Local SRD.");
    const fallbackText = findFallbackAnswer(message, safeSystem, relevantKnowledge);
    res.json({ text: fallbackText, isFallback: true, confidence: "low", sources: relevantKnowledge.map((entry) => entry.title) });
  } catch (error: any) {
    console.warn("Erro recuperável na rota /api/chat. Utilizando fallback local:", error?.message || error);
    try {
      const { message = "", activeSystem, customKnowledge = [] } = req.body || {};
      const relevantKnowledge = selectRelevantKnowledge(message, customKnowledge, activeSystem);
      const fallbackText = findFallbackAnswer(message, activeSystem, relevantKnowledge);
      res.json({ text: fallbackText, isFallback: true, confidence: "low", sources: relevantKnowledge.map((entry) => entry.title) });
    } catch (fbErr) {
      res.status(200).json({
        text: `**Mestre Arcano — Consulta**\n- **Status**: Sistema ativo em modo de segurança.\n- **Nota**: A consulta às regras para "${req.body?.message || 'RPG'}" foi processada localmente.`,
        isFallback: true,
      });
    }
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Mestre Arcano Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
