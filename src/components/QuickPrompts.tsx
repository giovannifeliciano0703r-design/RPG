import React from "react";
import { Sparkles } from "lucide-react";
import { RpgSystem } from "../types";

interface QuickPromptsProps {
  activeSystem: RpgSystem;
  onSelectPrompt: (prompt: string) => void;
}

interface PromptItem {
  label: string;
  query: string;
  tag?: string;
}

const PROMPTS_BY_SYSTEM: Record<RpgSystem, PromptItem[]> = {
  "Dungeons & Dragons (D&D)": [
    { label: "Bárbaro & Fúria", query: "Me fala sobre a classe Bárbaro no D&D 5e", tag: "Classe" },
    { label: "Magia Bola de Fogo", query: "Explique a magia Bola de Fogo (Fireball) no D&D 5e", tag: "Magia" },
    { label: "Mecânica de Vantagem", query: "Como funciona a mecânica de Vantagem e Desvantagem no D&D 5e?", tag: "Regra" },
    { label: "Raça Tiefling", query: "Fale sobre a raça Tiefling no D&D 5e", tag: "Raça" },
    { label: "Ladino & Ataque Furtivo", query: "Como funciona o Ataque Furtivo do Ladino no D&D 5e?", tag: "Classe" },
    { label: "Paladino & Smite", query: "Como funciona a Destruição Divina (Divine Smite) do Paladino no D&D 5e?", tag: "Classe" },
  ],
  "Pathfinder": [
    { label: "Sistema de 3 Ações", query: "Como funciona o sistema econômico de 3 ações por turno no Pathfinder 2e?", tag: "Regra" },
    { label: "Guerreiro no PF2e", query: "Fale sobre a classe Guerreiro no Pathfinder 2e", tag: "Classe" },
    { label: "Magia Curar (1, 2 e 3 ações)", query: "Explique a magia Curar (Heal) no Pathfinder 2e e como varia por número de ações gastas", tag: "Magia" },
    { label: "Linhagem Goblin", query: "Fale sobre a ancestralidade Goblin no Pathfinder 2e", tag: "Ancestralidade" },
    { label: "Graus de Sucesso Crítico", query: "Como funcionam os 4 graus de sucesso (Crítico, Sucesso, Falha, Falha Crítica) no Pathfinder 2e?", tag: "Regra" },
  ],
  "Tormenta20 (T20)": [
    { label: "Arcanista & Gastos de PM", query: "Fale sobre a classe Arcanista e a gestão de Pontos de Mana no Tormenta20", tag: "Classe" },
    { label: "Lefou & Tormenta", query: "Fale sobre a raça Lefou e a corrupção da Tormenta no Tormenta20", tag: "Raça" },
    { label: "Condições e Penalidades", query: "Explique as principais condições (Abalado, Atordoado, Cego) no Tormenta20", tag: "Regra" },
    { label: "Devotos de Valkaria", query: "Quais são as obrigações e poderes concedidos para devotos de Valkaria em Tormenta20?", tag: "Divindade" },
    { label: "Engenhoqueiro Goblinoide", query: "Como funciona a mecânica de engenhocas no Tormenta20?", tag: "Mecânica" },
  ],
  "Vampiro: A Máscara (Storyteller)": [
    { label: "Clã Tremere & Feitiçaria", query: "Fale sobre o Clã Tremere e a Feitiçaria de Sangue em Vampiro: A Máscara", tag: "Clã" },
    { label: "Fome & Frenesi", query: "Como funciona a mecânica de Dados de Fome (Hunger) e Frenesi em Vampiro: A Máscara V5?", tag: "Regra" },
    { label: "Humanidade & Mácula", query: "Explique a escala de Humanidade e manchas morais em Vampiro: A Máscara", tag: "Mecânica" },
    { label: "Disciplina Rapidez", query: "Fale sobre a Disciplina Rapidez (Celerity) em Vampiro: A Máscara", tag: "Disciplina" },
    { label: "Clã Ventrue", query: "Fale sobre a Maldição de Sangue e disciplinas do Clã Ventrue", tag: "Clã" },
  ],
  "Call of Cthulhu": [
    { label: "Perda de Sanidade (SAN)", query: "Como funciona o teste e a perda de Sanidade (SAN) no Call of Cthulhu 7ª Edição?", tag: "Regra" },
    { label: "Loucura Temporária vs Indefinida", query: "Explique a diferença entre Loucura Temporária e Indefinida no Call of Cthulhu", tag: "Mecânica" },
    { label: "Forçar Teste (Pushed Roll)", query: "Como funciona a mecânica de Forçar Testes (Pushing rolls) e suas consequências em Call of Cthulhu?", tag: "Regra" },
    { label: "Gasto de Sorte (Luck)", query: "Como os investigadores gastam pontos de Sorte para alterar resultados em CoC 7e?", tag: "Recurso" },
    { label: "Mitos de Cthulhu Skill", query: "Como a perícia Cthulhu Mythos afeta a Sanidade Máxima do personagem?", tag: "Perícia" },
  ],
  "GURPS": [
    { label: "Reflexos em Combate", query: "Fale sobre a Vantagem Reflexos em Combate no GURPS 4ª Edição", tag: "Vantagem" },
    { label: "Dano GdP e GdP+Balanço", query: "Como é calculado o Dano por Golpe de Ponta e Golpe de Balanço no GURPS?", tag: "Regra" },
    { label: "Manobra Defesa Total", query: "Como funciona a Manobra de Defesa Total no combate de GURPS?", tag: "Combate" },
    { label: "Vantagem Magery (Aptidão Mágica)", query: "Explique a Vantagem Aptidão Mágica (Magery) e seus níveis no GURPS", tag: "Vantagem" },
    { label: "Desvantagem Pacifismo", query: "Explique os diferentes níveis da desvantagem Pacifismo no GURPS", tag: "Desvantagem" },
  ],
  "Savage Worlds": [
    { label: "Dados Selvagens & Ases (Aces)", query: "Como funciona o Dado Selvagem (Wild Die) e a explosão de dados (Aces/Acing) em Savage Worlds?", tag: "Regra" },
    { label: "Benas (Bennies) & Gastos", query: "O que são Benas (Bennies) e para que podem ser gastas em Savage Worlds?", tag: "Recurso" },
    { label: "Iniciativa com Baralho", query: "Como funciona o sistema de iniciativa usando baralho de cartas e curingas em Savage Worlds?", tag: "Mecânica" },
    { label: "Estados Abalado (Shaken) e Ferimentos", query: "Explique a diferença entre o estado Abalado (Shaken) e Sofrer Ferimentos em Savage Worlds", tag: "Combate" },
    { label: "Vantagens e Complicações", query: "Como funcionam Edges (Vantagens) e Hindrances (Complicações) na criação de personagens em SW?", tag: "Criação" },
  ],
  "Fate Core": [
    { label: "Aspectos e Invocações", query: "Como funcionam os Aspectos, Invocações e Forçar Aspectos (Compels) no Fate Core?", tag: "Regra" },
    { label: "Pontos de Destino (Fate Points)", query: "Como os jogadores ganham e gastam Pontos de Destino na economia de jogo do Fate Core?", tag: "Recurso" },
    { label: "Os 4 Tipos de Ações", query: "Quais são as 4 ações fundamentais (Superar, Criar Vantagem, Atacar, Defender) em Fate Core?", tag: "Ações" },
    { label: "Estresse e Consequências", query: "Como funciona a absorção de dano através de Caixas de Estresse e Consequências em Fate Core?", tag: "Mecânica" },
    { label: "Façanhas (Stunts)", query: "O que são Façanhas (Stunts) e como customizam habilidades em Fate Core?", tag: "Habilidade" },
  ],
  "Cyberpunk Red": [
    { label: "Regra de Resolução (STAT + SKILL + 1d10)", query: "Como funciona a fórmula básica de resolução de testes e acertos críticos no Cyberpunk Red?", tag: "Regra" },
    { label: "Cyberpsicose e Perda de Humanidade", query: "Como a instalação de Cyberware causa Perda de Humanidade e risco de Cyberpsicose em Cyberpunk Red?", tag: "Mecânica" },
    { label: "Papel Solo & Sentido de Combate", query: "Fale sobre a habilidade especial de Papel Sentido de Combate do Solo em Cyberpunk Red", tag: "Classe/Papel" },
    { label: "Netrunning e Interface", query: "Como funciona o combate na Rede (Netrunning) e os Programas de Ataque/Defesa no Cyberpunk Red?", tag: "Netrunning" },
    { label: "Blindagem e Abrasão de Armadura", query: "Como funciona o SP (Stopping Power) das armaduras e a abrasão após levar dano no Cyberpunk Red?", tag: "Combate" },
  ],
  "Old Dragon": [
    { label: "Filosofia OSR & Regras Clássicas", query: "O que define o estilo Old School Renaissance (OSR) e a proposta do Old Dragon?", tag: "Sistema" },
    { label: "Homem de Armas no Old Dragon", query: "Fale sobre a classe Homem de Armas e progressão de BA no Old Dragon", tag: "Classe" },
    { label: "Testes de Atributo (Rolar Abaixo)", query: "Como funciona a mecânica de teste de atributo rolando 1d20 abaixo do valor no Old Dragon?", tag: "Regra" },
    { label: "Magias Arcanas e Vanciano", query: "Como funciona a conjuração e o limite de magias por dia no Old Dragon?", tag: "Magia" },
    { label: "Mortalidade e Moral dos Monstros", query: "Como funcionam os testes de Moral para monstros fugirem de combate no Old Dragon?", tag: "Mecânica" },
  ],
  "Outro / não especificar": [
    { label: "Mago vs Feiticeiro (D&D)", query: "Qual a diferença fundamental entre Mago e Feiticeiro no D&D 5e?", tag: "Comparação" },
    { label: "D&D 5e vs Pathfinder 2e", query: "Faça uma tabela comparativa entre o sistema de combate do D&D 5e e do Pathfinder 2e", tag: "Comparação" },
    { label: "Mecânica de Vantagem", query: "Como funciona a mecânica de Vantagem e Desvantagem no D&D 5e?", tag: "Regra" },
    { label: "Magia Bola de Fogo", query: "Explique a magia Bola de Fogo (Fireball) no D&D 5e", tag: "Magia" },
  ],
};

export const QuickPrompts: React.FC<QuickPromptsProps> = ({ activeSystem, onSelectPrompt }) => {
  const prompts = PROMPTS_BY_SYSTEM[activeSystem] || PROMPTS_BY_SYSTEM["Dungeons & Dragons (D&D)"];

  return (
    <div className="py-1">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
        {prompts.map((p, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(p.query)}
            className="group shrink-0 bg-[#171510] hover:bg-[#232018] border border-[#2D2A21] hover:border-[#4B4738] text-[#C4BDAE] hover:text-[#F3EFE6] px-3 py-1 rounded-full text-xs transition-all flex items-center gap-1.5 active:scale-95 text-left"
          >
            {p.tag && (
              <span className="text-[10px] text-[#DFB56C] font-mono">
                {p.tag}
              </span>
            )}
            <span className="text-xs font-normal">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
