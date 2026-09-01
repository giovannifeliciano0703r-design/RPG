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
  ArrowRight,
  Eye,
  EyeOff,
  Flame,
  Moon,
  Skull,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { UserProfile } from "../types";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { toUserProfile } from "../auth/supabaseAuth";

interface LoginScreenProps {
  onLogin: (user: UserProfile, remember?: boolean) => void;
}

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("wizard");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaCode, setMfaCode] = useState("");

  const triggerHaptic = (ms: number = 25) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Safe fallback
      }
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Informe o e-mail da sua conta.");
      return;
    }

    setIsLoading(true);
    triggerHaptic(40);
    try {
      if (!isSupabaseConfigured || !supabase) throw new Error("O cadastro online ainda não foi configurado.");
      if (!password) throw new Error("Informe sua senha para entrar.");
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.user) throw new Error(error?.message || "E-mail ou senha inválidos.");
      const [{ data: factors, error: factorsError }, { data: assurance, error: assuranceError }] = await Promise.all([
        supabase.auth.mfa.listFactors(),
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      ]);
      if (factorsError) throw factorsError;
      if (assuranceError) throw assuranceError;
      const verifiedFactor = factors.totp.find((factor) => factor.status === "verified");
      if (verifiedFactor && assurance.nextLevel === "aal2" && assurance.currentLevel !== "aal2") {
        setMfaFactorId(verifiedFactor.id);
        setSuccessMessage("Senha confirmada. Digite agora o código do seu aplicativo autenticador.");
        return;
      }
      onLogin(await toUserProfile(data.user), true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Falha ao entrar.");
    } finally {
      setIsLoading(false);
      setPassword("");
    }
  };

  const handleMfaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(""); setSuccessMessage("");
    if (!/^\d{6}$/.test(mfaCode)) return setErrorMessage("Digite o código de 6 números do aplicativo autenticador.");
    setIsLoading(true);
    try {
      if (!supabase || !mfaFactorId) throw new Error("Entre novamente para confirmar sua identidade.");
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactorId, code: mfaCode });
      if (error) throw error;
      const { data, error: userError } = await supabase.auth.getUser();
      if (userError || !data.user) throw new Error(userError?.message || "Sessão não encontrada.");
      onLogin(await toUserProfile(data.user), true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Código inválido ou expirado.");
      setMfaCode("");
    } finally { setIsLoading(false); }
  };

  const cancelMfa = async () => {
    if (supabase) await supabase.auth.signOut();
    setMfaFactorId(""); setMfaCode(""); setPassword(""); setSuccessMessage(""); setErrorMessage("");
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!name.trim()) {
      setErrorMessage("Informe o nome do seu Aventureiro ou Mestre.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Informe um endereço de e-mail válido.");
      return;
    }
    if (password.length < 8) {
      setErrorMessage("Crie uma senha com pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem.");
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage("Leia e aceite os Termos de Uso e a Política de Privacidade.");
      return;
    }
    setIsLoading(true);
    triggerHaptic(50);

    try {
      if (!isSupabaseConfigured || !supabase) throw new Error("O cadastro online ainda não foi configurado.");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { display_name: name.trim(), avatar: selectedAvatar, accepted_terms: true, privacy_version: "2026-09-01" } },
      });
      if (error) throw error;
      if (!data.user) throw new Error("Não foi possível criar a conta.");
      if (!data.session) {
        setSuccessMessage("Conta criada! Confirme o e-mail recebido e depois entre com sua senha.");
        setTab("login");
        return;
      }
      onLogin(await toUserProfile(data.user), true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível criar a conta.");
    } finally {
      setIsLoading(false);
      setPassword("");
      setConfirmPassword("");
    }
  };

  const handlePasswordRecovery = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Informe o e-mail da conta para recuperar a senha.");
      return;
    }
    setIsLoading(true);
    try {
      if (!supabase) throw new Error("O cadastro online ainda não foi configurado.");
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      setSuccessMessage("Se existir uma conta com esse e-mail, enviaremos as instruções de recuperação.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Não foi possível enviar a recuperação.");
    } finally {
      setIsLoading(false);
    }
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
            <p className="text-[10px] font-mono text-[#A79C82]">Plataforma de RPG de mesa</p>
          </div>
        </div>

        <span className="hidden sm:inline text-[11px] font-mono text-[#8DAE8F] bg-[#4B6B4E]/15 border border-[#4B6B4E]/40 px-2 py-0.5 rounded">
          Contas protegidas pelo Supabase
        </span>
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
              {tab === "login" ? "Entrar no Mestre Arcano" : "Criar sua conta"}
            </h2>
            <p className="text-xs text-[#A79C82] font-mono mt-1">
              {tab === "login"
                ? "Entre com uma conta cadastrada para acessar suas campanhas"
                : "Cadastre seu perfil de Mestre ou Jogador para começar"}
            </p>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#15140F] border border-[#38352A] rounded-xl mt-4">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  setTab("login");
                  setErrorMessage("");
                  setSuccessMessage("");
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
                  setSuccessMessage("");
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
              <div role="alert" aria-live="assertive" className="p-3 bg-[#7A2E27]/25 border border-[#C4645A] text-[#F3E8E4] rounded-xl text-xs flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-[#C4645A] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div role="status" aria-live="polite" className="p-3 bg-[#4B6B4E]/20 border border-[#8DAE8F] text-[#DDEBDD] rounded-xl text-xs flex items-start gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#8DAE8F] shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {mfaFactorId ? (
              <form onSubmit={handleMfaSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="login-mfa-code" className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">Código de verificação</label>
                  <input id="login-mfa-code" autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-3 px-3 text-center text-lg tracking-[0.4em] text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]" />
                </div>
                <button type="submit" disabled={isLoading || mfaCode.length !== 6} className="w-full min-h-[48px] bg-[#7A2E27] text-white font-serif font-bold rounded-xl disabled:opacity-50">Confirmar identidade</button>
                <button type="button" disabled={isLoading} onClick={() => void cancelMfa()} className="w-full py-2 text-xs text-[#A79C82] hover:text-[#EFE8D8]">Cancelar e sair</button>
              </form>
            ) : tab === "login" ? (
              /* ================= LOGIN FORM ================= */
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label htmlFor="login-email" className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                    E-mail do Aventureiro
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#A79C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mestre@arcano.rpg"
                      className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 pl-10 pr-3 text-sm text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#A79C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 pl-10 pr-10 text-sm text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-[#A79C82] hover:text-[#EFE8D8] absolute right-2.5 top-1/2 -translate-y-1/2"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={handlePasswordRecovery}
                    disabled={isLoading}
                    className="text-[11px] font-mono text-[#DFB56C] hover:text-[#EFE8D8] underline underline-offset-4 disabled:opacity-50"
                  >
                    Esqueci minha senha
                  </button>
                </div>

                <p className="text-[#8A8270] text-[10px] font-mono pt-1">
                  O acesso exige uma conta confirmada e autenticada pelo Supabase.
                </p>

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
                  <label htmlFor="register-name" className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                    Nome de exibição
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#A79C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="register-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Como você quer ser chamado"
                      className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 pl-10 pr-3 text-sm text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-email" className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#A79C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="register-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu.email@rpg.com"
                      className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 pl-10 pr-3 text-sm text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="register-password" className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-[#A79C82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="register-password"
                      name="new-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      aria-describedby="password-help"
                      placeholder="Mínimo de 8 caracteres"
                      className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 pl-10 pr-10 text-sm text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      className="p-1.5 text-[#A79C82] hover:text-[#EFE8D8] absolute right-2.5 top-1/2 -translate-y-1/2"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p id="password-help" className={`mt-1.5 text-[10px] font-mono ${password.length >= 8 ? "text-[#8DAE8F]" : "text-[#A79C82]"}`}>
                    {password.length >= 8 ? "✓ Senha com tamanho mínimo" : "Use pelo menos 8 caracteres"}
                  </p>
                </div>

                <div>
                  <label htmlFor="register-password-confirm" className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                    Confirmar senha
                  </label>
                  <input
                    id="register-password-confirm"
                    name="new-password-confirmation"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    aria-invalid={confirmPassword.length > 0 && confirmPassword !== password}
                    placeholder="Repita a senha"
                    className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 px-3 text-sm text-[#EFE8D8] placeholder-[#5C5641] focus:outline-none focus:border-[#DFB56C] aria-invalid:border-[#C4645A] transition-colors font-mono"
                  />
                  {confirmPassword.length > 0 && confirmPassword !== password ? (
                    <p className="mt-1.5 text-[10px] font-mono text-[#C4645A]">As senhas precisam ser iguais.</p>
                  ) : null}
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
                          aria-label={`Escolher avatar ${av.label}`}
                          aria-pressed={isSel}
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

                <label className="flex items-start gap-2 text-[11px] leading-relaxed text-[#A79C82]">
                  <input type="checkbox" required checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 accent-[#DFB56C]" />
                  <span>Li e aceito os <a href="/terms.html" target="_blank" rel="noreferrer" className="text-[#DFB56C] underline">Termos de Uso</a> e a <a href="/privacy.html" target="_blank" rel="noreferrer" className="text-[#DFB56C] underline">Política de Privacidade</a>.</span>
                </label>

                <button
                  type="submit"
                  disabled={isLoading || password.length < 8 || password !== confirmPassword || !acceptedTerms}
                  className="w-full min-h-[48px] bg-[#7A2E27] hover:bg-[#8F392F] active:scale-98 text-white font-serif font-bold text-base rounded-xl shadow-lg shadow-[#7A2E27]/30 flex items-center justify-center gap-2 transition-all cursor-pointer mt-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Criar conta</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-3 text-[11px] font-mono text-[#A79C82] border-t border-[#38352A] bg-[#15140F]/80">
        Mestre Arcano • <a href="/terms.html" className="hover:text-[#EFE8D8] underline">Termos</a> • <a href="/privacy.html" className="hover:text-[#EFE8D8] underline">Privacidade</a>
      </footer>
    </div>
  );
};
