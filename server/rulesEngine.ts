/**
 * Motor de Conhecimento Arcano Local (Fallback Offline e Base SRD)
 * Garante que o aplicativo responda com precisão mesmo se a chave do Gemini estiver ausente ou offline.
 */

export interface FallbackRule {
  keywords: string[];
  system?: string;
  response: string;
}

export const KNOWLEDGE_BASE: FallbackRule[] = [
  {
    keywords: ["bárbaro", "barbaro", "barbarian", "fúria", "furia"],
    system: "D&D 5ª Edição",
    response: `**Bárbaro — D&D 5ª Edição**
- **Categoria**: Classe
- **Descrição resumida**: Um guerreiro feroz impulsionado por uma fúria primal incontrolável que concede resistência física sobrenatural e força devastadora em combate corpo a corpo.
- **Atributos/Requisitos**: Força (ataque e dano), Constituição (pontos de vida e Defesa Sem Armadura). Dado de Vida: d12.
- **Habilidades/Efeitos principais**:
  - **Fúria (Rage)**: Vantagem em testes de Força e salvaguardas de Força, bônus de dano corpo a corpo (+2 a +4) e resistência a dano concussivo, cortante e perfurante.
  - **Defesa Sem Armadura**: CA = 10 + Modificador de Destreza + Modificador de Constituição quando não usar armadura.
  - **Ataque Descuidado (Reckless Attack - 2º Nível)**: Ganha vantagem nas jogadas de ataque corpo a corpo no turno, concedendo vantagem aos ataques inimigos até o próximo turno.
  - **Sentido do Perigo**: Vantagem em salvaguardas de Destreza contra efeitos visíveis.
- **Vantagens**: Maior reserva de pontos de vida do jogo (d12); excelente sobrevivência com dano reduzido pela metade na fúria.
- **Desvantagens/Custos**: Não pode conjurar ou manter concentração em magias enquanto estiver em fúria; fúria termina se passar um turno sem atacar ou sofrer dano.
- **Buffs/Debuffs associados**: Fúria (Resistência a dano físico + Bônus de Dano).
- **Fonte**: Livro do Jogador (Player's Handbook), D&D 5e - Cap. 3
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["mago", "wizard", "magia vanciana", "grimório", "grimorio"],
    system: "D&D 5ª Edição",
    response: `**Mago — D&D 5ª Edição**
- **Categoria**: Classe
- **Descrição resumida**: Estudioso supremo das artes arcanas que aprende e manipula feitiços através de fórmulas rigorosas registradas em seu grimório pessoal.
- **Atributos/Requisitos**: Inteligência (atributo de conjuração e CD de magias). Dado de Vida: d6.
- **Habilidades/Efeitos principais**:
  - **Conjuração Arcana**: Prepara magias diariamente a partir do grimório (Nível de Mago + Modificador de Inteligência).
  - **Recuperação Arcana**: Em um descanso curto uma vez ao dia, recupera espaços de magia cuja soma dos níveis seja até metade do nível de mago (arredondado para cima).
  - **Tradição Arcana (2º nível)**: Escolha de escola de especialização (Evocação, Abjuração, Necromancia, Adivinhação, etc.).
  - **Copiar Magias**: Pode transcrever novas magias encontradas em pergaminhos ou outros grimórios gastando tempo e ouro (50 PO e 2h por nível de magia).
- **Vantagens**: A lista de magias mais vasta e versátil do jogo; capacidade de conjurar magias rituais direto do grimório sem prepará-las.
- **Desvantagens/Custos**: Baixa vida (d6) e sem proficiência em armaduras; dependência vital do grimório físico.
- **Buffs/Debuffs associados**: Recuperação Arcana (Restituição de Slots).
- **Fonte**: Livro do Jogador (Player's Handbook), D&D 5e - Cap. 3
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["clérigo", "clerigo", "cleric", "canalizar divindade"],
    system: "D&D 5ª Edição",
    response: `**Clérigo — D&D 5ª Edição**
- **Categoria**: Classe
- **Descrição resumida**: Um intermediário divino que canaliza o poder dos deuses para curar aliados, punir ímpios e conjurar milagres sagrados.
- **Atributos/Requisitos**: Sabedoria (atributo de conjuração e CD). Dado de Vida: d8. Proficiência em armaduras médias e escudos.
- **Habilidades/Efeitos principais**:
  - **Domínio Divino (1º nível)**: Escolha de domínio (Vida, Guerra, Luz, Tempestade, Trapaça, etc.) que concede magias e proficiências bônus.
  - **Canalizar Divindade (2º nível)**: Expulsar Mortos-Vivos (faz mortos-vivos fugirem) e um efeito exclusivo do Domínio.
  - **Intervenção Divina (10º nível)**: Rola d100; se tirar valor igual ou menor que o nível, a divindade atende diretamente ao pedido.
- **Vantagens**: Excelente equilíbrio entre suporte, cura, defesa com armadura pesada (em certos domínios) e dano radiante (ex: Guardiões Espirituais).
- **Desvantagens/Custos**: Dependente de descanso longo para recuperar espaços de magia e recursos principais.
- **Buffs/Debuffs associados**: Bênção, Canalizar Divindade, Santuário.
- **Fonte**: Livro do Jogador (Player's Handbook), D&D 5e - Cap. 3
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["ladino", "rogue", "ataque furtivo", "sneak attack", "especialização"],
    system: "D&D 5ª Edição",
    response: `**Ladino — D&D 5ª Edição**
- **Categoria**: Classe
- **Descrição resumida**: Mestre da furtividade, precisão e perícias que explora vulnerabilidades inimigas para causar dano crítico massivo.
- **Atributos/Requisitos**: Destreza (iniciativa, ataque, CA e perícias). Dado de Vida: d8.
- **Habilidades/Efeitos principais**:
  - **Ataque Furtivo (Sneak Attack)**: Causa dano extra (1d6 a 10d6) uma vez por turno quando tiver vantagem no ataque ou um aliado a até 5 pés do alvo.
  - **Especialização (Expertise)**: Dobra o bônus de proficiência em 2 perícias no 1º nível e mais 2 no 6º nível.
  - **Ação Astuta (Cunning Action - 2º nível)**: Pode Usar Disparada, Desengajar ou Esconder-se como Ação Bônus.
  - **Esquiva Sobrenatural (5º nível)**: Usa reação para reduzir pela metade o dano de um ataque que o atinja.
- **Vantagens**: Mobilidade incomparável em combate com Ação Astuta; a classe com maior perícia e utilidade fora de combate.
- **Desvantagens/Custos**: Sofre se não puder ativar o Ataque Furtivo; apenas um ataque por ação padrão.
- **Buffs/Debuffs associados**: Vantagem Furtiva, Ação Astuta.
- **Fonte**: Livro do Jogador (Player's Handbook), D&D 5e - Cap. 3
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["paladino", "paladin", "destruição divina", "smite", "imposição de mãos"],
    system: "D&D 5ª Edição",
    response: `**Paladino — D&D 5ª Edição**
- **Categoria**: Classe
- **Descrição resumida**: Um guerreiro santo juramentado por um voto sagrado que canaliza justiça divina em seus golpes com armaduras pesadas.
- **Atributos/Requisitos**: Força (ataque/dano) e Carisma (magias e auras). Dado de Vida: d10. Proficiência em todas as armaduras e armas.
- **Habilidades/Efeitos principais**:
  - **Destruição Divina (Divine Smite - 2º nível)**: Ao acertar um ataque corpo a corpo, pode gastar um espaço de magia para causar +2d8 de dano radiante (+1d8 por círculo acima do 1º, +1d8 contra mortos-vivos/fiéis).
  - **Imposição de Mãos (Lay on Hands)**: Reserva de cura igual a Nível x 5 pontos de vida diários.
  - **Aura de Proteção (6º nível)**: Adiciona modificador de Carisma em todas as salvaguardas próprias e de aliados a até 10 pés.
- **Vantagens**: Um dos maiores causadores de dano explosivo (burst damage) do jogo com Smite em acertos críticos; auras de defesa extremamente fortes.
- **Desvantagens/Custos**: Requer múltiplos atributos altos (Força, Carisma, Constituição); pouca versatilidade à distância.
- **Buffs/Debuffs associados**: Aura de Proteção, Destruição Divina.
- **Fonte**: Livro do Jogador (Player's Handbook), D&D 5e - Cap. 3
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["bola de fogo", "fireball", "magia de fogo"],
    system: "D&D 5ª Edição",
    response: `**Bola de Fogo (Fireball) — D&D 5ª Edição**
- **Categoria**: Magia
- **Descrição resumida**: Um raio brilhante dispara da ponta dos seus dedos até um ponto à sua escolha em alcance e explode em uma labareda estrondosa de chamas.
- **Atributos/Requisitos**: 3º Círculo (Evocação). Tempo de Conjuração: 1 Ação. Alcance: 150 pés (45 metros). Componentes: V, S, M (uma bola minúscula de guano de morcego e enxofre).
- **Habilidades/Efeitos principais**:
  - Cada criatura em uma esfera de 20 pés (6 metros) de raio deve fazer uma salvaguarda de Destreza.
  - Sofre **8d6 de dano de fogo** se falhar, ou metade do dano se obtiver sucesso.
  - O fogo se propaga ao redor de cantos e incendeia objetos inflamáveis na área que não estejam sendo vestidos ou carregados.
  - **Em Círculos Superiores**: O dano aumenta em 1d6 para cada círculo acima do 3º.
- **Vantagens**: Alto dano em área com grande alcance; escala muito bem.
- **Desvantagens/Custos**: Pode atingir aliados se posicionada sem cautela; muitas criaturas possuem resistência a fogo.
- **Buffs/Debuffs associados**: Incêndio de objetos inflamáveis.
- **Fonte**: Livro do Jogador (Player's Handbook), D&D 5e - Cap. 11
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["escudo arcano", "shield spell", "magia de escudo", "reacao escudo"],
    system: "D&D 5ª Edição",
    response: `**Escudo Arcano (Shield) — D&D 5ª Edição**
- **Categoria**: Magia
- **Descrição resumida**: Uma barreira invisível de força mágica surge instantaneamente para proteger o conjurador contra ataques iminentes.
- **Atributos/Requisitos**: 1º Círculo (Abjuração). Tempo de Conjuração: 1 Reação (quando for atingido por um ataque ou alvo de Mísseis Mágicos). Alcance: Pessoal. Componentes: V, S.
- **Habilidades/Efeitos principais**:
  - Concede um bônus de **+5 na Classe de Armadura (CA)** até o início do seu próximo turno, inclusive contra o ataque que engatilhou a reação.
  - Anula completamente o dano de *Mísseis Mágicos*.
- **Vantagens**: Aumento defensivo gigantesco (+5 CA) acionado como reação; salva o conjurador de ataques críticos ou múltiplos acertos.
- **Desvantagens/Custos**: Consome a reação da rodada e um espaço de magia de 1º nível.
- **Buffs/Debuffs associados**: +5 de CA temporário.
- **Fonte**: Livro do Jogador (Player's Handbook), D&D 5e - Cap. 11
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["vantagem", "desvantagem", "advantage", "disadvantage"],
    system: "D&D 5ª Edição",
    response: `**Vantagem e Desvantagem — D&D 5ª Edição**
- **Categoria**: Mecânica Central
- **Descrição resumida**: Mecânica que substitui modificadores numéricos pontuais por rolagens duplas de d20 para refletir situações vantajosas ou desfavoráveis.
- **Atributos/Requisitos**: Aplicável a Jogadas de Ataque, Testes de Atributo/Perícia e Salvaguardas.
- **Habilidades/Efeitos principais**:
  - **Vantagem**: Role 2d20 e use o maior resultado.
  - **Desvantagem**: Role 2d20 e use o menor resultado.
  - **Anulação Mútua**: Se você tiver múltiplas fontes de vantagem e ao menos uma fonte de desvantagem (ou vice-versa), elas se anulam completamente e você rola apenas 1d20 normalmente.
- **Vantagens**: Agiliza o combate e a matemática da mesa sem necessidade de somar dezenas de bônus flutuantes.
- **Desvantagens/Custos**: Não acumula matematicamente (duas vantagens ainda equivalem a rolar 2d20).
- **Buffs/Debuffs associados**: Vantagem / Desvantagem.
- **Fonte**: Livro do Jogador (Player's Handbook), D&D 5e - Cap. 7
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["3 ações", "tres açoes", "economia de açoes", "pathfinder 2e", "pf2e"],
    system: "Pathfinder 2e",
    response: `**Sistema de 3 Ações — Pathfinder 2e**
- **Categoria**: Mecânica
- **Descrição resumida**: Sistema tático unificado de combate do Pathfinder 2ª Edição no qual todo personagem recebe exatamente 3 Ações e 1 Reação por rodada.
- **Atributos/Requisitos**: Aplicável a todos os personagens e monstros durante o Modo de Encontro.
- **Habilidades/Efeitos principais**:
  - **Flexibilidade Total**: Você gasta suas 3 ações como desejar (ex: Andar [◆], Golpear [◆], Erguer Escudo [◆]; ou Andar [◆] e Conjurar Magia de 2 Ações [◆◆]).
  - **Penalidade por Ataque Múltiplo (MAP)**: O primeiro ataque não tem penalidade; o segundo ataque sofre -5 (ou -4 com arma Ágil); o terceiro em diante sofre -10 (ou -8 com Ágil).
  - **Reações [↺] e Ações Livres [◇]**: Desencadeadas fora do seu turno mediante gatilhos específicos (ex: Golpe de Oportunidade).
- **Vantagens**: Elimina a rigidez de "ação padrão/ação de movimento" do D&D, incentivando táticas variadas (fintar, empurrar, levantar escudo).
- **Desvantagens/Custos**: Atacar 3 vezes geralmente é ineficiente devido à MAP acumulada.
- **Buffs/Debuffs associados**: Penalidade por Ataque Múltiplo (MAP).
- **Fonte**: Core Rulebook / Player Core, Pathfinder 2e - Cap. 9
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["curar", "heal", "pathfinder", "pf2e"],
    system: "Pathfinder 2e",
    response: `**Curar (Heal) — Pathfinder 2e**
- **Categoria**: Magia
- **Descrição resumida**: Feitiço divino/primal flexível que canaliza energia positiva para curar vivos ou causar dano a mortos-vivos, variando conforme o número de ações gastas.
- **Atributos/Requisitos**: Tradição Divina ou Primal. Nível 1.
- **Habilidades/Efeitos principais**:
  - **1 Ação [◆] (Toque)**: Cura 1d8 PV em uma criatura tocada.
  - **2 Ações [◆◆] (Alcance 30ft)**: Cura 1d8 + 8 PV em uma criatura a até 30 pés.
  - **3 Ações [◆◆◆] (Emanação 30ft)**: Cura 1d8 PV em TODOS os seres vivos em uma emanação de 30 pés (e causa 1d8 em mortos-vivos com salvaguarda de Fortitude).
  - **Aprimoramento (+1 nível)**: Aumenta em 1d8 (e +8 no modo de 2 ações).
- **Vantagens**: Uma das magias mais versáteis do sistema, adaptável para emergências ou cura em grupo.
- **Desvantagens/Custos**: O modo de 3 ações também pode curar inimigos vivos na área.
- **Buffs/Debuffs associados**: Restauração de PV / Dano Vital a Mortos-Vivos.
- **Fonte**: Core Rulebook / Player Core, Pathfinder 2e
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["lefou", "tormenta", "tormenta20", "t20"],
    system: "Tormenta20",
    response: `**Lefou — Tormenta20**
- **Categoria**: Raça
- **Descrição resumida**: Humanoides tocados pela corrupção alienígena da Tormenta, exibindo mutações aberrantes e deformidades biológicas que lhes concedem poderes incomuns.
- **Atributos/Requisitos**: +1 em três atributos diferentes (exceto Carisma); -1 em Carisma.
- **Habilidades/Efeitos principais**:
  - **Cria da Tormenta**: Considerado um monstro para efeitos de magias e habilidades.
  - **Deformidade**: Escolha duas perícias entre Luta, Fortitude e outras corporais para receber +2, ou receba um Poder da Tormenta adicional no 1º nível.
  - **Afinidade com a Tormenta**: Imune aos efeitos nocivos da matéria rubra e da atmosfera da tempestade aberrante.
- **Vantagens**: Excelente customização inicial e acesso facilitado a combos de Poderes da Tormenta.
- **Desvantagens/Custos**: Penalidade em Carisma e estigma social severo em todo o continente de Arton.
- **Buffs/Debuffs associados**: Resistência Aberrante.
- **Fonte**: Tormenta20 Livro Básico (Jambô Editora) - Cap. 1
- **Nível de confiança**: Média`,
  },
  {
    keywords: ["fome", "disciplina", "tremere", "vampiro", "mascara", "v5"],
    system: "Vampiro: A Máscara",
    response: `**Dados de Fome & Clã Tremere — Vampiro: A Máscara (V5)**
- **Categoria**: Mecânica / Clã
- **Descrição resumida**: Em Vampiro V5, a Fome (Hunger) substitui os Pontos de Sangue com uma escala de 1 a 5, substituindo dados normais da sua parada por Dados de Fome vermelhos.
- **Atributos/Requisitos**: Sistema Storyteller (D10s, sucessos em 6+).
- **Habilidades/Efeitos principais**:
  - **Sucesso Bestial (Crítico com Dado de Fome)**: Ao rolar dois '10' sendo um em Dado de Fome, a Besta toma o controle e realiza o ato com selvageria extrema.
  - **Falha Bestial ('1' no Dado de Fome)**: A Besta interfere e gera compulsões ou frenesi.
  - **Clã Tremere (Bruxos)**: Mestres da Feitiçaria de Sangue (Blood Sorcery), Auspícios e Dominação. Sofrem com o sangue enfraquecido após a queda da Capela de Viena.
- **Vantagens**: Sistema altamente narrativo que mantém a Besta interior sempre presente em cada ação.
- **Desvantagens/Custos**: Quanto maior a Fome, maior o risco de frenesi involuntário e perda de Humanidade.
- **Buffs/Debuffs associados**: Compulsões Bestiais, Fome (1-5).
- **Fonte**: Vampiro: A Máscara 5ª Edição Livro Básico
- **Nível de confiança**: Média`,
  },
  {
    keywords: ["reflexos em combate", "gurps", "manobra", "dano gdp"],
    system: "GURPS",
    response: `**Reflexos em Combate — GURPS 4ª Edição**
- **Categoria**: Vantagem
- **Descrição resumida**: Uma das vantagens de combate mais custo-eficientes do sistema GURPS, conferindo prontidão e reações instantâneas contra emboscadas e ataques surpresa.
- **Atributos/Requisitos**: Custo: 15 Pontos de Personagem.
- **Habilidades/Efeitos principais**:
  - **+1 em todas as Defesas Ativas**: Esquiva (+1), Bloqueio (+1) e Aparar (+1).
  - **Recuperação de Surpresa**: +1 em todos os testes de Sentidos para evitar emboscadas e +2 em testes de IQ para se recuperar de surpresa ou atordoamento mental.
  - **Imunidade a Pânico de Combate**: Nunca congela de susto no início de um combate.
- **Vantagens**: Bonificação passiva permanente de defesa e imunidade a surpresas por apenas 15 pontos.
- **Desvantagens/Custos**: Custo de pontos de criação que poderiam ser alocados em perícias.
- **Buffs/Debuffs associados**: Bônus de Defesa Ativa (+1).
- **Fonte**: GURPS Módulo Básico: Personagens (4ª Edição)
- **Nível de confiança**: Média`,
  },
  {
    keywords: ["sanidade", "san", "cthulhu", "call of cthulhu", "loucura", "pushed roll", "sorte"],
    system: "Call of Cthulhu",
    response: `**Regra de Sanidade (SAN) & Loucura — Call of Cthulhu 7ª Edição**
- **Categoria**: Mecânica Central
- **Descrição resumida**: A Sanidade mede a estabilidade mental dos investigadores diante dos horrores cósmicos dos Mitos de Cthulhu e traumas severos.
- **Atributos/Requisitos**: Teste de d100 com valor igual ou menor que o valor atual de Sanidade (SAN).
- **Habilidades/Efeitos principais**:
  - **Perda de Sanidade**: Ao falhar no teste de SAN, perde a quantidade total indicada (ex: 1d6); ao passar, perde um valor reduzido ou zero (ex: 0/1d6).
  - **Loucura Temporária**: Se perder 5 ou mais pontos de SAN em uma única jogada, o investigador sofre um Ataque de Pânico e Loucura Temporária (1d10 horas).
  - **Loucura Indefinida**: Se perder 1/5 da SAN total em 1 dia no jogo, desenvolve fobias ou manias profundas.
  - **Loucura Permanente**: Se a SAN chegar a 0, o personagem torna-se irrevogavelmente insano e vira NPC.
- **Vantagens**: Mecânica imersiva que define o terror de horror cósmico investigativo.
- **Desvantagens/Custos**: Cada ponto de perícia ganho em Cthulhu Mythos reduz a Sanidade Máxima possível em 1 ponto (99 - Cthulhu Mythos).
- **Buffs/Debuffs associados**: Amnésia, Fobias, Manias, Paranoia.
- **Fonte**: Call of Cthulhu 7ª Edição Livro do Guardião - Cap. 8
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["savage worlds", "dado selvagem", "wild die", "bennies", "benas", "abalado", "shaken"],
    system: "Savage Worlds",
    response: `**Dados Selvagens & Economia de Benas — Savage Worlds (SWADE)**
- **Categoria**: Mecânica Central
- **Descrição resumida**: Sistema Fast! Furious! Fun! onde Cartas Selvagens rolam um dado extra de atributo/perícia e um d6 Selvagem, ficando com o maior resultado.
- **Atributos/Requisitos**: Atributos e Perícias medidos em dados (d4, d6, d8, d10, d12). Número alvo padrão é sempre 4.
- **Habilidades/Efeitos principais**:
  - **Ases (Aces / Explosão)**: Sempre que rolar o valor máximo de qualquer dado, ele "explode" e você rola novamente somando o resultado indefinidamente.
  - **Benas (Bennies)**: Fichas gastas para rerrolar qualquer teste, absorver dano (Soak roll) ou remover o estado Abalado (Shaken).
  - **Iniciativa com Baralho**: A cada rodada, cada combatente recebe uma carta de baralho comum; Curingas agem quando quiserem e dão +2 em todos os testes na rodada.
  - **Abalado (Shaken)**: Estado de choque após dano; requer teste de Espírito para agir normalmente ou gasto de 1 Bena.
- **Vantagens**: Combate cinematográfico, ágil e altamente imprevisível com explosões de dados.
- **Desvantagens/Custos**: 3 ferimentos colocam qualquer herói Incapacitado.
- **Buffs/Debuffs associados**: Abalado (Shaken), Ferimentos (-1 a -3 em ações).
- **Fonte**: Savage Worlds Edição Aventura (SWADE) - Cap. 3
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["fate", "fate core", "aspectos", "pontos de destino", "façanhas", "estresse"],
    system: "Fate Core",
    response: `**Aspectos & Pontos de Destino — Fate Core**
- **Categoria**: Mecânica Central
- **Descrição resumida**: Sistema narrativo onde a ficção dita as regras através de Aspectos — frases curtas que definem quem seu personagem é, seus problemas e o ambiente.
- **Atributos/Requisitos**: 4 Dados Fate/Fudge (+, -, branco) somados à perícia (Escala de Adjetivos de -2 Ruim a +8 Lendário).
- **Habilidades/Efeitos principais**:
  - **Invocar Aspecto**: Gasta 1 Ponto de Destino para adicionar +2 ao resultado da rolagem ou rolar novamente os 4 dados.
  - **Forçar Aspecto (Compel)**: O Mestre ou jogador introduz uma complicação dramática baseada em um Aspecto; o jogador ganha 1 Ponto de Destino se aceitar.
  - **As 4 Ações**: Superar (Overcome), Criar Vantagem (Create an Advantage), Atacar (Attack) e Defender (Defend).
  - **Absorção de Dano**: Dano é absorvido marcando Caixas de Estresse ou assumindo Consequências duradouras (Suave, Moderada, Severa).
- **Vantagens**: Flexibilidade absoluta para qualquer cenário e controle narrativo compartilhado.
- **Desvantagens/Custos**: Depende de consenso narrativo e cooperação ativa da mesa.
- **Buffs/Debuffs associados**: Aspectos de Situação com Invocações Gratuitas.
- **Fonte**: Livro Básico do Sistema Fate Core - Cap. 3
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["cyberpunk", "cyberpunk red", "cyberware", "humanidade", "netrunning", "solo", "sandevistan"],
    system: "Cyberpunk Red",
    response: `**Cyberware & Perda de Humanidade — Cyberpunk Red**
- **Categoria**: Mecânica / Itens
- **Descrição resumida**: Em Night City de 2045, o corpo humano pode ser aprimorado com tecnologia cibernética de ponta, cobrando um preço brutal da psique humana.
- **Atributos/Requisitos**: Resolução de testes: [STAT + SKILL + 1d10] contra DV (Difficulty Value).
- **Habilidades/Efeitos principais**:
  - **Perda de Humanidade**: Cada ciberimplante possui um custo de Humanidade (ex: 2d6). A cada 10 pontos de Humanidade perdidos, o atributo EMP (Empatia) cai em 1 ponto.
  - **Cyberpsicose**: Se o EMP cair a 0, o personagem sucumbe à Cyberpsicose, perdendo a empatia humana e virando alvo da Max-Tac.
  - **Blindagem e Abrasão**: Armaduras possuem SP (Stopping Power); quando o dano ultrapassa o SP, a armadura sofre abrasão e seu SP reduz em 1 ponto para os próximos tiros.
  - **Sentido de Combate (Combat Awareness)**: Habilidade exclusiva do Solo que permite distribuir pontos em Iniciativa, Dano, Esquiva e Mira.
- **Vantagens**: Aprimoramentos cibernéticos concedem capacidades sobre-humanas de combate e invasão de redes.
- **Desvantagens/Custos**: Custo financeiro em Eurodólares (E$) e risco constante de insanidade tecnológica.
- **Buffs/Debuffs associados**: Perda de Humanidade, Cyberpsicose, Abrasão de SP.
- **Fonte**: Cyberpunk Red Livro de Regras Básico (R. Talsorian Games) - Cap. 8
- **Nível de confiança**: Alta`,
  },
  {
    keywords: ["old dragon", "osr", "homem de armas", "moral", "ba"],
    system: "Old Dragon",
    response: `**Homem de Armas & Mecânicas Clássicas — Old Dragon (OD2)**
- **Categoria**: Classe / Mecânica OSR
- **Descrição resumida**: O principal RPG brasileiro no estilo Old School Renaissance (OSR), focado em exploração de masmorras perigosas, agilidade e alta letalidade.
- **Atributos/Requisitos**: Atributos clássicos (Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma). Testes de Atributo rolam 1d20 abaixo do valor do atributo.
- **Habilidades/Efeitos principais**:
  - **Base de Ataque (BA)**: O Homem de Armas possui a melhor progressão de BA (+1 por nível), dominando todas as armas e armaduras.
  - **Aparar**: Pode sacrificar seu ataque do turno para tentar bloquear um golpe físico.
  - **Moral dos Monstros**: Criaturas rolam 2d6 quando o líder morre ou perdem metade do bando; se falharem na Moral, fogem ou se rendem.
  - **Descanso e Cura Lenta**: Recupera apenas 1 PV por noite de sono confortável em local seguro.
- **Vantagens**: Regras simples, combates rápidos e alta ênfase na astúcia e criatividade dos jogadores em vez de botões na ficha.
- **Desvantagens/Custos**: Alta mortalidade no 1º nível (personagens morrem com 0 PV sem salvaguarda complexa).
- **Buffs/Debuffs associados**: Moral Abalada, Surpresa.
- **Fonte**: Old Dragon 2ª Edição (Buró Jogos) - Livro Básico
- **Nível de confiança**: Alta`,
  },
];

export interface CustomKnowledgeEntry {
  id: string;
  title: string;
  system: string;
  category: string;
  keywords: string[];
  content: string;
  isActive: boolean;
}

export function findFallbackAnswer(
  query: string,
  activeSystem?: string,
  customKnowledge?: CustomKnowledgeEntry[]
): string {
  const q = query.toLowerCase().trim();

  // 1. Check User Custom Knowledge Base first (Highest Priority)
  if (customKnowledge && Array.isArray(customKnowledge)) {
    const activeEntries = customKnowledge.filter((entry) => entry.isActive);
    for (const entry of activeEntries) {
      const titleMatches = q.includes(entry.title.toLowerCase()) || entry.title.toLowerCase().includes(q);
      const keywordMatches = entry.keywords && entry.keywords.some((kw) => kw.trim() && q.includes(kw.toLowerCase().trim()));
      
      if (titleMatches || keywordMatches) {
        return `**${entry.title} — [Banco de Dados Customizado / ${entry.system || "Regra da Casa"}]**
- **Categoria**: ${entry.category || "Regra Customizada"}
- **Descrição resumida**: ${entry.content.split("\n")[0] || entry.title}
- **Conteúdo / Regra do Usuário**:
${entry.content}
- **Fonte**: Banco de Dados Customizado do Mestre (Cadastrado pelo Usuário)
- **Nível de confiança**: Alta (Definição Oficial da Mesa)`;
      }
    }
  }

  // 2. Try to find matching rule in system knowledge base
  for (const rule of KNOWLEDGE_BASE) {
    const matchesKeyword = rule.keywords.some((kw) => q.includes(kw));
    if (matchesKeyword) {
      return rule.response;
    }
  }

  // 3. Generic dynamic fallback card if not matched by specific topic
  return `**Consulta: ${query.slice(0, 40)} — ${activeSystem || "D&D 5ª Edição"}**
- **Categoria**: Regra / Mecânica
- **Descrição resumida**: O termo consultado faz parte do repertório de regras de RPG de mesa.
- **Atributos/Requisitos**: Conforme o manual oficial do sistema (${activeSystem || "D&D 5e"}).
- **Habilidades/Efeitos principais**:
  - Consulte o capítulo de regras do sistema ativo para parâmetros numéricos específicos.
  - No D&D 5e e Pathfinder 2e, mecânicas padrão seguem as licenças abertas SRD.
- **Vantagens**: Proporciona dinâmica estratégica na narrativa da mesa.
- **Desvantagens/Custos**: Requer atenção do Mestre para aplicação harmoniosa com o grupo.
- **Fonte**: Livro de Regras Oficiais (${activeSystem || "D&D 5e"})
- **Nível de confiança**: Média`;
}

