import { KnowledgeEntry } from "../types";

export const DEFAULT_KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  {
    id: "k-default-potion",
    title: "Regra da Casa: Beber Poção de Cura como Ação Bônus",
    system: "Dungeons & Dragons (D&D)",
    category: "Regra da Casa",
    keywords: ["poção", "pocao", "cura", "beber poção", "ação bônus", "vida"],
    content: `**Regra de Poções em Combate na Mesa:**
- **Beber em si mesmo**: Custa apenas **1 Ação Bônus** (em vez de Ação Padrão).
- **Beber com calma (Ação Padrão)**: Se o personagem optar por gastar sua **Ação Padrão**, ele recupera o **valor MÁXIMO** de cura dos dados sem precisar rolar (ex: Poção Maior = 4d4+4 cura direto 20 PV)!
- **Administrar em aliado caído**: Custa **1 Ação Padrão** e requer rolar os dados normalmente.`,
    isActive: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: "k-default-flanking",
    title: "Regra da Casa: Flanqueamento Tático (+2 no Ataque)",
    system: "Dungeons & Dragons (D&D)",
    category: "Regra da Casa",
    keywords: ["flanqueamento", "flanco", "flanking", "vantagem de combate", "posicionamento"],
    content: `**Flanqueamento Tático:**
- Em vez de conceder Vantagem completa (que ofusca outras habilidades de classe como Fúria do Bárbaro ou Furtividade do Ladino), estar em posições opostas a um inimigo concede um bônus fixo de **+2 na jogada de ataque corpo a corpo**.
- Criaturas imunes a cercamento ou com sentidos de 360° ignoram essa bonificação.`,
    isActive: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
  {
    id: "k-default-sword",
    title: "Lâmina do Sussurro Noturno (Homebrew)",
    system: "Dungeons & Dragons (D&D)",
    category: "Item Mágico",
    keywords: ["lâmina do sussurro", "espada mágica", "item homebrew", "sussurro noturno"],
    content: `**Lâmina do Sussurro Noturno (Espada Curta / Rara / Requer Sintonização por Ladino ou Bruxo)**
- **Bônus**: +1 nas jogadas de ataque e dano cortante/perfurante.
- **Manto de Sombras**: Concede vantagem permanente em testes de Furtividade (Destreza) enquanto estiver em penumbra ou escuridão.
- **Golpe da Noite (1x/dia)**: Ao acertar um ataque furtivo, pode optar por aplicar 2d6 de dano psíquico extra e o alvo fica ensurdecido por 1 minuto (CD 15 Sabedoria anula).`,
    isActive: true,
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
  },
];
