import React, { useState } from "react";
import {
  ScrollText,
  Shield,
  Sparkles,
  KeyRound,
  Mail,
  User,
  Crown,
  Sword,
  Wand2,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  Dice5,
  Flame,
  Moon,
  Skull,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { RpgSystem, UserProfile, UserRole, isUserAdmin } from "../types";

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

const SYSTEMS: RpgSystem[] = [
  "Dungeons & Dragons (D&D)",
  "Pathfinder",
  "Tormenta20 (T20)",
  "Vampiro: A Máscara (Storyteller)",
  "Call of Cthulhu",
  "GURPS",
  "Savage Worlds",
  "Fate Core",
  "Cyberpunk Red",
  "Old Dragon",
  "Outro / não especificar",
];

const AVATARS = [
  { id: "wizard", label: "Mago Arcanista", icon: Wand2, color: "text-[#DFB56C] bg-[#DFB56C]/10 border-[#DFB56C]/40" },
  { id: "master", label: "Mestre da Masmorra", icon: Crown, color: "text-[#B08635] bg-[#B08635]/15 border-[#B08635]/50" },
  { id: "warrior", label: "Guerreiro / Paladino", icon: Sword, color: "text-[#C4645A] bg-[#7A2E27]/20 border-[#7A2E27]" },
  { id: "cleric", label: "Clérigo da Luz", icon: Shield, color: "text-[#8DAE8F] bg-[#4B6B4E]/15 border-[#4B6B4E]/40" },
  { id: "rogue", label: "Ladino da Noite", icon: Moon, color: "text-[#A79C82] bg-[#38352A]/40 border-[#5C5641]" },
  { id: "warlock", label: "Bruxo do Pacto", icon: Skull, color: "text-[#C4645A] bg-[#7A2E27]/30 border-[#C4645A]" },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("Administrador (ADM)");
  const [favoriteSystem, setFavoriteSystem] = useState<RpgSystem>("Dungeons & Dragons (D&D)");
  const [selectedAvatar, setSelectedAvatar] = useState("wizard");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const triggerHaptic = (ms: number = 25) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim() || !password.trim()) {
      setErrorMessage("Por favor, preencha o e-mail e a palavra-passe arcana.");
      return;
    }

    setIsLoading(true);
    triggerHaptic(40);

    setTimeout(() => {
      // Check for saved users or create standard profile
      const storedUsersRaw = localStorage.getItem("mestre_arcano_registered_users");
      let foundUser: UserProfile | null = null;

      if (storedUsersRaw) {
        try {
          const registeredUsers: (UserProfile & { password?: string })[] = JSON.parse(storedUsersRaw);
          const match = registeredUsers.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
          if (match) {
            foundUser = match;
          }
        } catch (err) {
          console.error("Error reading users", err);
        }
      }

      const emailTrim = email.trim().toLowerCase();
      const isAdminAccount =
        emailTrim === "adm@mestrearcano.rpg" ||
        emailTrim === "admin@mestrearcano.rpg" ||
        emailTrim === "admin@arcano.rpg" ||
        emailTrim.startsWith("adm@") ||
        emailTrim.startsWith("admin@") ||
        (foundUser && foundUser.role === "Administrador (ADM)");

      if (!foundUser) {
        // Standard user derived from credentials
        const username = email.split("@")[0] || (isAdminAccount ? "Administrador" : "Aventureiro");
        const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
        foundUser = {
          id: "usr_" + Date.now(),
          name: isAdminAccount ? "Administrador Arcano" : formattedName,
          email: email.trim(),
          role: isAdminAccount ? "Administrador (ADM)" : "Mestre da Mesa",
          isAdmin: Boolean(isAdminAccount),
          avatar: isAdminAccount ? "master" : "wizard",
          favoriteSystem: "Dungeons & Dragons (D&D)",
          createdAt: Date.now(),
        };
      } else {
        foundUser = {
          ...foundUser,
          isAdmin: Boolean(isAdminAccount || foundUser.role === "Administrador (ADM)"),
        };
      }

      setIsLoading(false);
      onLogin(foundUser);
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Informe o nome do seu Aventureiro ou Mestre.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Informe um endereço de e-mail válido.");
      return;
    }
    if (password.length < 4) {
      setErrorMessage("A senha deve conter ao menos 4 runas/caracteres.");
      return;
    }

    setIsLoading(true);
    triggerHaptic(50);

    setTimeout(() => {
      const emailTrim = email.trim().toLowerCase();
      const isAdminRole = role === "Administrador (ADM)" || emailTrim.startsWith("adm") || emailTrim.includes("admin");

      const newUser: UserProfile = {
        id: "usr_" + Date.now(),
        name: name.trim(),
        email: email.trim(),
        role: isAdminRole ? "Administrador (ADM)" : role,
        isAdmin: isAdminRole,
        avatar: selectedAvatar,
        favoriteSystem,
        createdAt: Date.now(),
      };

      // Save to registered list
      try {
        const storedUsersRaw = localStorage.getItem("mestre_arcano_registered_users");
        const registeredUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
        registeredUsers.push({ ...newUser, password });
        localStorage.setItem("mestre_arcano_registered_users", JSON.stringify(registeredUsers));
      } catch (err) {
        console.error("Failed to save registered user", err);
      }

      setIsLoading(false);
      onLogin(newUser);
    }, 450);
  };

  const handleGuestLogin = () => {
    triggerHaptic(30);
    setIsLoading(true);
    setTimeout(() => {
      const guestUser: UserProfile = {
        id: "guest_" + Math.random().toString(36).substring(2, 8),
        name: "Aventureiro Errante",
        email: "convidado@mestrearcano.rpg",
        role: "Jogador Explorador",
        avatar: "rogue",
        favoriteSystem: "Dungeons & Dragons (D&D)",
        createdAt: Date.now(),
        isGuest: true,
        isAdmin: false,
      };
      setIsLoading(false);
      onLogin(guestUser);
    }, 250);
  };

  const handleQuickDemo = (demoType: "admin" | "master" | "player") => {
    triggerHaptic(30);
    if (demoType === "admin") {
      setEmail("adm@mestrearcano.rpg");
      setPassword("admin123");
    } else if (demoType === "master") {
      setEmail("mestre@arcano.rpg");
      setPassword("grimorio123");
    } else {
      setEmail("jogador@taverna.rpg");
      setPassword("espada123");
    }
    setTab("login");
  };

  return (
    <div className="min-h-screen w-full bg-[#12110C] text-[#EFE8D8] flex flex-col justify-between relative overflow-x-hidden selection:bg-[#7A2E27] selection:text-white">
      {/* Background Arcane Atmosphere Grid & Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(#38352A_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#7A2E27]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#B08635]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Banner */}
      <header className="relative z-10 w-full px-4 sm:px-8 py-3.5 border-b border-[#38352A] bg-[#15140F]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C]">
            <ScrollText className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-base text-[#EFE8D8] tracking-wide">Mestre Arcano</h1>
            <p className="text-[10px] font-mono text-[#A79C82]">Oráculo Enciclopédico de RPG</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] font-mono text-[#8DAE8F] bg-[#4B6B4E]/15 border border-[#4B6B4E]/40 px-2 py-0.5 rounded">
            Códice v2.5 Online
          </span>
          <button
            onClick={handleGuestLogin}
            className="text-xs font-mono text-[#DFB56C] hover:text-white bg-[#B08635]/15 hover:bg-[#B08635]/30 border border-[#B08635]/40 px-2.5 py-1.5 rounded-lg transition-colors active:scale-95 flex items-center gap-1"
          >
            <span>Convidado</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Center Authentication Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3 sm:p-6 my-2 sm:my-6">
        <div className="w-full max-w-md bg-[#1D1B14] border border-[#38352A] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
          {/* Card Top Sigil Header */}
          <div className="p-5 sm:p-6 bg-[#15140F] border-b border-[#38352A] text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#B08635]/10 rounded-full blur-xl pointer-events-none" />

            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-b from-[#7A2E27]/40 to-[#1D1B14] border border-[#7A2E27] flex items-center justify-center shadow-lg shadow-[#7A2E27]/20 text-[#DFB56C]">
              <Sparkles className="w-7 h-7 animate-pulse" />
            </div>

            <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#EFE8D8]">
              {tab === "login" ? "Adentrar o Códice" : "Criar Ficha de Conjurador"}
            </h2>
            <p className="text-xs text-[#A79C82] font-mono mt-1">
              {tab === "login"
                ? "Identifique-se para consultar regras, salvar grimórios e homebrews"
                : "Cadastre seu perfil de Mestre ou Jogador para personalizar sua jornada"}
            </p>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#15140F] border border-[#38352A] rounded-xl mt-4">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setTab("login");
                  setErrorMessage("");
                }}
                className={`py-2 text-xs font-mono font-bold rounded-lg transition-all active:scale-95 ${
                  tab === "login"
                    ? "bg-[#7A2E27] text-white shadow-md border border-[#C4645A]/40"
                    : "text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#1D1B14]"
                }`}
              >
                Entrar na Conta
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setTab("register");
                  setErrorMessage("");
                }}
                className={`py-2 text-xs font-mono font-bold rounded-lg transition-all active:scale-95 ${
                  tab === "register"
                    ? "bg-[#7A2E27] text-white shadow-md border border-[#C4645A]/40"
                    : "text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#1D1B14]"
                }`}
              >
                Criar Nova Conta
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-4 sm:p-6 space-y-4">
            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 bg-[#7A2E27]/25 border border-[#C4645A] text-[#F3E8E4] rounded-xl text-xs flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-[#C4645A] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {tab === "login" ? (
              /* ================= LOGIN FORM ================= */
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                    E-mail do Aventureiro
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#A79C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mestre@arcano.rpg"
                      className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 pl-10 pr-3 text-sm text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-mono uppercase tracking-wider text-[#A79C82]">
                      Palavra-Passe Arcana
                    </label>
                    <div className="flex items-center gap-2 text-[10px] font-mono">
                      <span className="text-[#8A8270]">Demo:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickDemo("admin")}
                        className="text-[#DFB56C] hover:underline font-bold"
                        title="Preencher com credenciais de Administrador (ADM)"
                      >
                        👑 ADM
                      </button>
                      <span className="text-[#38352A]">•</span>
                      <button
                        type="button"
                        onClick={() => handleQuickDemo("master")}
                        className="text-[#8DAE8F] hover:underline"
                        title="Preencher com Mestre da Mesa"
                      >
                        Mestre
                      </button>
                    </div>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#A79C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 pl-10 pr-10 text-sm text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-[#A79C82] hover:text-[#EFE8D8] absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[#A79C82] hover:text-[#EFE8D8]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-[#38352A] bg-[#15140F] text-[#7A2E27] accent-[#7A2E27]"
                    />
                    <span>Lembrar meu grimório</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      alert("Para recuperar seu acesso, utilize o modo Demo ou cadastre uma nova ficha de aventureiro.");
                    }}
                    className="text-[#DFB56C] hover:underline text-[11px]"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[48px] bg-[#7A2E27] hover:bg-[#8F392F] active:scale-98 text-white font-serif font-bold text-base rounded-xl shadow-lg shadow-[#7A2E27]/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Adentrar o Santuário</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ================= REGISTER FORM ================= */
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                    Nome do Personagem / Mestre
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#A79C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Gandalf, Mestre Elminster, Vax'ildan"
                      className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 pl-10 pr-3 text-sm text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                    E-mail do Jogador
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#A79C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@rpg.com"
                      className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 pl-10 pr-3 text-sm text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                      Palavra-Passe
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#A79C82] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mínimo 4 runas"
                        className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 pl-9 pr-8 text-xs text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                      Papel na Mesa
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 px-3 text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C] font-mono"
                    >
                      <option value="Administrador (ADM)">👑 Administrador (ADM - Acesso ao DB)</option>
                      <option value="Mestre da Mesa">Mestre da Mesa (DM/GM)</option>
                      <option value="Jogador Explorador">Jogador Explorador</option>
                      <option value="Criador de Conteúdo">Criador de Homebrews</option>
                      <option value="Guardião do Saber">Guardião do Saber</option>
                    </select>
                  </div>
                </div>

                {/* Favorite System */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                    Sistema Principal de Preferência
                  </label>
                  <select
                    value={favoriteSystem}
                    onChange={(e) => setFavoriteSystem(e.target.value as RpgSystem)}
                    className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 px-3 text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C] font-mono"
                  >
                    {SYSTEMS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Avatar Selection */}
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-2">
                    Escolha seu Brasão Arcano
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {AVATARS.map((av) => {
                      const IconComp = av.icon;
                      const isSel = selectedAvatar === av.id;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          title={av.label}
                          onClick={() => {
                            triggerHaptic(15);
                            setSelectedAvatar(av.id);
                          }}
                          className={`h-11 rounded-xl border flex items-center justify-center transition-all active:scale-90 ${
                            isSel
                              ? `${av.color} scale-105 shadow-md shadow-black/40 ring-2 ring-[#DFB56C]`
                              : "bg-[#15140F] text-[#A79C82] border-[#38352A] hover:text-[#EFE8D8]"
                          }`}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[48px] bg-[#7A2E27] hover:bg-[#8F392F] active:scale-98 text-white font-serif font-bold text-base rounded-xl shadow-lg shadow-[#7A2E27]/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Consagrar Nova Ficha</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Guest / Fast Access Section */}
            <div className="pt-3 border-t border-[#38352A] space-y-2 text-center">
              <div className="text-[10px] font-mono text-[#A79C82] uppercase tracking-wider">
                Acesso Rápido para Testes:
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemo("admin")}
                  className="py-2 px-2 bg-[#15140F] hover:bg-[#25231B] border border-[#DFB56C]/50 hover:border-[#DFB56C] text-[#DFB56C] text-xs font-mono rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group"
                  title="Entrar com conta de Administrador (acesso ao Banco de Dados)"
                >
                  <Crown className="w-3.5 h-3.5 text-[#DFB56C] group-hover:scale-110 transition-transform" />
                  <span className="font-bold">👑 ADM (DB)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemo("master")}
                  className="py-2 px-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#8DAE8F] text-[#EFE8D8] text-xs font-mono rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group"
                  title="Entrar como Mestre da Mesa"
                >
                  <Wand2 className="w-3.5 h-3.5 text-[#8DAE8F] group-hover:scale-110 transition-transform" />
                  <span>Mestre</span>
                </button>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  className="py-2 px-2 bg-[#15140F] hover:bg-[#25231B] border border-[#38352A] hover:border-[#C4645A] text-[#EFE8D8] text-xs font-mono rounded-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-1 group"
                  title="Acessar modo convidado"
                >
                  <Dice5 className="w-3.5 h-3.5 text-[#C4645A] group-hover:scale-110 transition-transform" />
                  <span>Convidado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-3 text-[11px] font-mono text-[#A79C82] border-t border-[#38352A] bg-[#15140F]/80">
        Mestre Arcano • Códice Enciclopédico de D&D, Pathfinder, Tormenta20, Vampiro e GURPS
      </footer>
    </div>
  );
};
