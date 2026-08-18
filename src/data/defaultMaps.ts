import { VttMapPreset } from "../types";

// High-quality tactical SVG map generators for instant, crisp rendering
export const DEFAULT_MAP_PRESETS: VttMapPreset[] = [
  {
    id: "preset-dungeon",
    title: "Masmorra Subterrânea & Catacumbas",
    category: "Masmorra",
    description: "Salões de pedra escura, pilares de sustentação e câmaras mortuárias secretas.",
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
        <rect width="1200" height="900" fill="#141311"/>
        <defs>
          <pattern id="stoneFloor" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="#1e1c17" stroke="#2c2820" stroke-width="1.5"/>
            <path d="M0 30h60M30 0v60M15 0v30M45 30v30" stroke="#12110e" stroke-width="1"/>
            <circle cx="30" cy="30" r="1.5" fill="#3c372c"/>
          </pattern>
        </defs>
        <rect x="60" y="60" width="1080" height="780" fill="url(#stoneFloor)" stroke="#664d26" stroke-width="12" rx="16"/>
        <!-- Room Dividers -->
        <rect x="420" y="60" width="24" height="360" fill="#3a3428" stroke="#12110e" stroke-width="3"/>
        <rect x="420" y="480" width="24" height="360" fill="#3a3428" stroke="#12110e" stroke-width="3"/>
        <rect x="420" y="420" width="24" height="60" fill="#7a2e27" opacity="0.4"/> <!-- Doorway -->
        <!-- Pillars -->
        <circle cx="240" cy="240" r="28" fill="#4a4233" stroke="#dfb56c" stroke-width="3"/>
        <circle cx="240" cy="660" r="28" fill="#4a4233" stroke="#dfb56c" stroke-width="3"/>
        <circle cx="780" cy="240" r="28" fill="#4a4233" stroke="#dfb56c" stroke-width="3"/>
        <circle cx="780" cy="660" r="28" fill="#4a4233" stroke="#dfb56c" stroke-width="3"/>
        <circle cx="960" cy="450" r="36" fill="#7a2e27" stroke="#dfb56c" stroke-width="4"/> <!-- Altar -->
        <text x="960" y="456" font-family="serif" font-size="16" fill="#dfb56c" text-anchor="middle">ALTAR</text>
        <text x="240" y="450" font-family="serif" font-size="20" fill="#a79c82" text-anchor="middle" letter-spacing="4">SALÃO DE ENTRADA</text>
      </svg>
    `),
    defaultGridSize: 60,
  },
  {
    id: "preset-forest",
    title: "Clareira da Floresta Ancestral",
    category: "Floresta",
    description: "Trilha cercada por copas densas de árvores, rio cristalino e ruínas de pedra cobertas de musgo.",
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
        <rect width="1200" height="900" fill="#1b2a1c"/>
        <defs>
          <pattern id="grass" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect width="50" height="50" fill="#243825" stroke="#1b2a1c" stroke-width="1"/>
            <circle cx="15" cy="15" r="2" fill="#325034"/>
            <circle cx="35" cy="35" r="3" fill="#2d482f"/>
          </pattern>
        </defs>
        <rect width="1200" height="900" fill="url(#grass)"/>
        <!-- River -->
        <path d="M 0 400 Q 300 300 600 500 T 1200 450" fill="none" stroke="#254d5e" stroke-width="110" opacity="0.85"/>
        <path d="M 0 400 Q 300 300 600 500 T 1200 450" fill="none" stroke="#487e94" stroke-width="80" opacity="0.9"/>
        <!-- Wooden Bridge -->
        <rect x="560" y="420" width="80" height="130" fill="#5c4028" stroke="#382414" stroke-width="4" rx="4"/>
        <!-- Trees -->
        <circle cx="150" cy="150" r="90" fill="#163819" stroke="#0e2410" stroke-width="6" opacity="0.9"/>
        <circle cx="1050" cy="180" r="100" fill="#163819" stroke="#0e2410" stroke-width="6" opacity="0.9"/>
        <circle cx="180" cy="750" r="110" fill="#163819" stroke="#0e2410" stroke-width="6" opacity="0.9"/>
        <circle cx="1020" cy="760" r="95" fill="#163819" stroke="#0e2410" stroke-width="6" opacity="0.9"/>
        <!-- Campfire -->
        <circle cx="400" cy="250" r="18" fill="#d9532f" stroke="#7a2e27" stroke-width="3"/>
        <text x="400" y="290" font-family="sans-serif" font-size="12" fill="#dfb56c" text-anchor="middle">Acampamento</text>
      </svg>
    `),
    defaultGridSize: 50,
  },
  {
    id: "preset-tavern",
    title: "Taverna do Javali Saltitante",
    category: "Taverna",
    description: "Salão principal com mesas de carvalho, balcão rústico, lareira crepitante e quartos no mezanino.",
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
        <rect width="1200" height="900" fill="#1f1812"/>
        <defs>
          <pattern id="woodPlanks" width="60" height="20" patternUnits="userSpaceOnUse">
            <rect width="60" height="20" fill="#3b2b1d" stroke="#281c12" stroke-width="1.5"/>
            <line x1="0" y1="10" x2="60" y2="10" stroke="#20150c" stroke-width="0.5"/>
          </pattern>
        </defs>
        <rect x="80" y="80" width="1040" height="740" fill="url(#woodPlanks)" stroke="#614327" stroke-width="14" rx="12"/>
        <!-- Fireplace -->
        <rect x="520" y="80" width="160" height="50" fill="#7a2e27" stroke="#3b1511" stroke-width="3"/>
        <circle cx="600" cy="105" r="16" fill="#e8832a"/>
        <text x="600" y="110" font-family="sans-serif" font-size="12" fill="#fff" text-anchor="middle">LAREIRA</text>
        <!-- Bar Counter -->
        <path d="M 160 200 L 400 200 L 400 360" fill="none" stroke="#6d4c2b" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Tables and Stools -->
        <rect x="200" y="520" width="100" height="60" rx="8" fill="#523921" stroke="#2e1f11" stroke-width="3"/>
        <circle cx="170" cy="550" r="12" fill="#3b2b1d"/>
        <circle cx="330" cy="550" r="12" fill="#3b2b1d"/>
        <rect x="500" y="420" width="160" height="80" rx="12" fill="#523921" stroke="#2e1f11" stroke-width="4"/>
        <circle cx="460" cy="460" r="14" fill="#3b2b1d"/>
        <circle cx="700" cy="460" r="14" fill="#3b2b1d"/>
        <rect x="800" y="300" width="120" height="70" rx="8" fill="#523921" stroke="#2e1f11" stroke-width="3"/>
        <rect x="800" y="560" width="120" height="70" rx="8" fill="#523921" stroke="#2e1f11" stroke-width="3"/>
        <!-- Stage -->
        <rect x="940" y="120" width="140" height="100" fill="#54381d" stroke="#dfb56c" stroke-width="2" rx="6"/>
        <text x="1010" y="175" font-family="serif" font-size="14" fill="#dfb56c" text-anchor="middle">PALCO BARDO</text>
      </svg>
    `),
    defaultGridSize: 60,
  },
  {
    id: "preset-crypt",
    title: "Cripta dos Reis Esquecidos",
    category: "Cripta",
    description: "Sarcófagos de mármore antigo, armadilhas rúnicas e chão gélido cercado pela escuridão.",
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
        <rect width="1200" height="900" fill="#0d0e12"/>
        <defs>
          <pattern id="cryptTile" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="#181b22" stroke="#252a36" stroke-width="1.5"/>
            <path d="M 0 0 L 60 60 M 60 0 L 0 60" stroke="#111318" stroke-width="0.75"/>
          </pattern>
        </defs>
        <rect x="90" y="90" width="1020" height="720" fill="url(#cryptTile)" stroke="#3e475c" stroke-width="10" rx="14"/>
        <!-- Sarcophagi -->
        <rect x="250" y="220" width="140" height="70" fill="#2b3240" stroke="#7e9fb0" stroke-width="3" rx="6"/>
        <text x="320" y="260" font-family="serif" font-size="12" fill="#a7b9c7" text-anchor="middle">SARCOFAGO I</text>
        <rect x="250" y="600" width="140" height="70" fill="#2b3240" stroke="#7e9fb0" stroke-width="3" rx="6"/>
        <text x="320" y="640" font-family="serif" font-size="12" fill="#a7b9c7" text-anchor="middle">SARCOFAGO II</text>
        <rect x="800" y="220" width="140" height="70" fill="#2b3240" stroke="#7e9fb0" stroke-width="3" rx="6"/>
        <text x="870" y="260" font-family="serif" font-size="12" fill="#a7b9c7" text-anchor="middle">SARCOFAGO III</text>
        <rect x="800" y="600" width="140" height="70" fill="#2b3240" stroke="#7e9fb0" stroke-width="3" rx="6"/>
        <text x="870" y="640" font-family="serif" font-size="12" fill="#a7b9c7" text-anchor="middle">SARCOFAGO IV</text>
        <!-- Center Tomb -->
        <rect x="520" y="380" width="160" height="140" fill="#3b1d24" stroke="#dfb56c" stroke-width="4" rx="8"/>
        <circle cx="600" cy="450" r="40" fill="none" stroke="#c4645a" stroke-width="2" stroke-dasharray="4 4"/>
        <text x="600" y="455" font-family="serif" font-size="14" fill="#dfb56c" text-anchor="middle">REI ANCESTRAL</text>
      </svg>
    `),
    defaultGridSize: 60,
  },
];
