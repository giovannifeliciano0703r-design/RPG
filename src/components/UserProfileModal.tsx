import React, { useEffect, useState } from "react";
import {
  X,
  User,
  Crown,
  Wand2,
  Sword,
  Shield,
  Moon,
  Skull,
  LogOut,
  Check,
  Flame,
  Sparkles,
  KeyRound,
  MonitorX,
  Download,
  UserX,
  ShieldCheck,
} from "lucide-react";
import { UserProfile, RpgSystem, UserRole, isUserAdmin } from "../types";
import { RPG_SYSTEMS } from "../domain/rpgSystems";
import { supabase, verifyAccountPassword } from "../lib/supabase";
import { deleteMyAccount, downloadAccountExport, exportMyAccountData } from "../services/supabaseAccount";
import { ConfirmDialog } from "./ui/Dialog";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updated: UserProfile) => Promise<void>;
  onLogout: () => void;
}

const AVATARS = [
  { id: "wizard", label: "Mago Arcanista", icon: Wand2, color: "text-[#DFB56C] bg-[#DFB56C]/10 border-[#DFB56C]/40" },
  { id: "master", label: "Mestre da Masmorra", icon: Crown, color: "text-[#B08635] bg-[#B08635]/15 border-[#B08635]/50" },
  { id: "warrior", label: "Guerreiro / Paladino", icon: Sword, color: "text-[#C4645A] bg-[#7A2E27]/20 border-[#7A2E27]" },
  { id: "cleric", label: "Clérigo da Luz", icon: Shield, color: "text-[#8DAE8F] bg-[#4B6B4E]/15 border-[#4B6B4E]/40" },
  { id: "rogue", label: "Ladino da Noite", icon: Moon, color: "text-[#A79C82] bg-[#38352A]/40 border-[#5C5641]" },
  { id: "warlock", label: "Bruxo do Pacto", icon: Skull, color: "text-[#C4645A] bg-[#7A2E27]/30 border-[#C4645A]" },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout,
}) => {
  const isAdmin = isUserAdmin(user);
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<UserRole>(user.role || "Mestre da Mesa");
  const [favoriteSystem, setFavoriteSystem] = useState(user.favoriteSystem || "Dungeons & Dragons (D&D)");
  const [selectedAvatar, setSelectedAvatar] = useState(user.avatar || "wizard");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");
  const [isAccountBusy, setIsAccountBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [mfaQrCode, setMfaQrCode] = useState("");
  const [mfaSecret, setMfaSecret] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [hasMfa, setHasMfa] = useState(false);

  useEffect(() => {
    if (!isOpen || !supabase) return;
    let cancelled = false;
    void supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (cancelled) return;
      if (error) setAccountError(error.message);
      else setHasMfa(data.totp.some((factor) => factor.status === "verified"));
    });
    return () => { cancelled = true; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    const updated: UserProfile = {
      ...user,
      name: name.trim() || user.name,
      role: isAdmin ? user.role : role === "Administrador (ADM)" ? "Mestre da Mesa" : role,
      isAdmin: isAdmin,
      favoriteSystem,
      avatar: selectedAvatar,
    };
    setIsSavingProfile(true);
    try {
      await onUpdateUser(updated);
      setSavedSuccess(true);
      setTimeout(() => { setSavedSuccess(false); onClose(); }, 600);
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "Não foi possível salvar o perfil.");
    } finally { setIsSavingProfile(false); }
  };

  const getAvatarIcon = (id: string) => {
    const found = AVATARS.find((a) => a.id === id);
    if (!found) return Wand2;
    return found.icon;
  };

  const CurrentAvatarIcon = getAvatarIcon(selectedAvatar);

  const changePassword = async () => {
    setAccountError(""); setAccountMessage("");
    if (!currentPassword) return setAccountError("Informe sua senha atual.");
    if (newPassword.length < 10) return setAccountError("A nova senha precisa ter pelo menos 10 caracteres.");
    if (newPassword !== confirmNewPassword) return setAccountError("A confirmação da nova senha não confere.");
    if (currentPassword === newPassword) return setAccountError("Escolha uma senha diferente da atual.");
    setIsAccountBusy(true);
    try {
      if (!supabase) throw new Error("Supabase não está configurado.");
      if (!await verifyAccountPassword(user.email, currentPassword)) throw new Error("A senha atual não está correta.");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
      setAccountMessage("Senha alterada com segurança. Encerre outras sessões se não reconhecer algum acesso.");
    } catch (error) { setAccountError(error instanceof Error ? error.message : "Não foi possível alterar a senha."); }
    finally { setIsAccountBusy(false); }
  };

  const closeOtherSessions = async () => {
    setAccountError(""); setAccountMessage(""); setIsAccountBusy(true);
    try {
      if (!supabase) throw new Error("Supabase não está configurado.");
      const { error } = await supabase.auth.signOut({ scope: "others" });
      if (error) throw error;
      setAccountMessage("As outras sessões foram encerradas. Este aparelho continua conectado.");
    } catch (error) { setAccountError(error instanceof Error ? error.message : "Não foi possível encerrar as sessões."); }
    finally { setIsAccountBusy(false); }
  };

  const startMfaEnrollment = async () => {
    setAccountError(""); setAccountMessage(""); setIsAccountBusy(true);
    try {
      if (!supabase) throw new Error("Supabase não está configurado.");
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Mestre Arcano" });
      if (error) throw error;
      setMfaFactorId(data.id);
      setMfaQrCode(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
    } catch (error) { setAccountError(error instanceof Error ? error.message : "Não foi possível iniciar a verificação em duas etapas."); }
    finally { setIsAccountBusy(false); }
  };

  const verifyMfaEnrollment = async () => {
    setAccountError(""); setAccountMessage("");
    if (!/^\d{6}$/.test(mfaCode)) return setAccountError("Digite o código de 6 números do aplicativo autenticador.");
    setIsAccountBusy(true);
    try {
      if (!supabase || !mfaFactorId) throw new Error("Inicie a configuração novamente.");
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactorId, code: mfaCode });
      if (error) throw error;
      setHasMfa(true); setMfaFactorId(""); setMfaQrCode(""); setMfaSecret(""); setMfaCode("");
      setAccountMessage("Verificação em duas etapas ativada. Os outros aparelhos foram desconectados.");
    } catch (error) { setAccountError(error instanceof Error ? error.message : "Código inválido ou expirado."); }
    finally { setIsAccountBusy(false); }
  };

  const disableMfa = async () => {
    setAccountError(""); setAccountMessage(""); setIsAccountBusy(true);
    try {
      if (!supabase) throw new Error("Supabase não está configurado.");
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const verified = data.totp.find((factor) => factor.status === "verified");
      if (!verified) throw new Error("Nenhum autenticador ativo foi encontrado.");
      const result = await supabase.auth.mfa.unenroll({ factorId: verified.id });
      if (result.error) throw result.error;
      await supabase.auth.refreshSession();
      setHasMfa(false);
      setAccountMessage("Verificação em duas etapas desativada.");
    } catch (error) { setAccountError(error instanceof Error ? error.message : "Confirme o segundo fator antes de desativá-lo."); }
    finally { setIsAccountBusy(false); }
  };

  const exportAccount = async () => {
    setAccountError(""); setAccountMessage(""); setIsAccountBusy(true);
    try { downloadAccountExport(await exportMyAccountData()); setAccountMessage("Cópia dos seus dados baixada."); }
    catch (error) { setAccountError(error instanceof Error ? error.message : "Não foi possível exportar seus dados."); }
    finally { setIsAccountBusy(false); }
  };

  const deleteAccount = async () => {
    setConfirmDelete(false); setAccountError(""); setAccountMessage(""); setIsAccountBusy(true);
    try { await deleteMyAccount(); onLogout(); }
    catch (error) { setAccountError(error instanceof Error ? error.message : "Não foi possível excluir a conta."); setIsAccountBusy(false); }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Perfil do usuário" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-[#1D1B14] border border-[#38352A] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#15140F] border-b border-[#38352A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C]">
              <CurrentAvatarIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#EFE8D8] flex items-center gap-2 flex-wrap">
                <span>Ficha do Conjurador</span>
                {isAdmin && (
                  <span className="text-[10px] font-mono bg-[#DFB56C]/20 border border-[#DFB56C]/50 text-[#DFB56C] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" /> ADM (Banco de Dados)
                  </span>
                )}
              </h2>
              <p className="text-xs font-mono text-[#A79C82]">{user.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#38352A] rounded-lg transition-colors"
            aria-label="Fechar perfil"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Scroll */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Form Fields */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
              Nome do Aventureiro / Título
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 px-3.5 text-sm text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                Papel na Mesa
              </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  disabled={isAdmin}
                  className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 px-3 text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C] font-mono"
                >
                  {isAdmin && <option value="Administrador (ADM)">👑 Administrador validado pelo servidor</option>}
                <option value="Mestre da Mesa">Mestre da Mesa</option>
                <option value="Jogador Explorador">Jogador Explorador</option>
                <option value="Criador de Conteúdo">Criador de Homebrews</option>
                <option value="Guardião do Saber">Guardião do Saber</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-1.5">
                Sistema Preferido
              </label>
              <select
                value={favoriteSystem}
                onChange={(e) => setFavoriteSystem(e.target.value as RpgSystem)}
                className="w-full bg-[#15140F] border border-[#38352A] rounded-xl py-2.5 px-3 text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C] font-mono"
              >
                {RPG_SYSTEMS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Avatar selector */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A79C82] mb-2">
              Brasão Arcano
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
                    onClick={() => setSelectedAvatar(av.id)}
                    className={`h-11 rounded-xl border flex items-center justify-center transition-all active:scale-90 ${
                      isSel
                        ? `${av.color} scale-105 shadow-md ring-2 ring-[#DFB56C]`
                        : "bg-[#15140F] text-[#A79C82] border-[#38352A] hover:text-[#EFE8D8]"
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          <section className="rounded-xl border border-[#38352A] bg-[#15140F] p-3 space-y-3" aria-labelledby="account-security-title">
            <h3 id="account-security-title" className="text-xs font-mono font-bold uppercase tracking-wider text-[#DFB56C]">Segurança da conta</h3>
            {accountError && <p role="alert" className="text-xs text-[#C4645A]">{accountError}</p>}
            {accountMessage && <p role="status" className="text-xs text-[#8DAE8F]">{accountMessage}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="sr-only" htmlFor="profile-current-password">Senha atual</label>
              <input
                id="profile-current-password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="Senha atual"
                className="bg-[#1D1B14] border border-[#38352A] rounded-lg px-3 py-2 text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
              />
              <label className="sr-only" htmlFor="profile-new-password">Nova senha</label>
              <input
                id="profile-new-password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Nova senha (mínimo 10 caracteres)"
                className="bg-[#1D1B14] border border-[#38352A] rounded-lg px-3 py-2 text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C]"
              />
              <label className="sr-only" htmlFor="profile-confirm-new-password">Confirmar nova senha</label>
              <input
                id="profile-confirm-new-password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                value={confirmNewPassword}
                onChange={(event) => setConfirmNewPassword(event.target.value)}
                aria-invalid={confirmNewPassword.length > 0 && confirmNewPassword !== newPassword}
                placeholder="Repita a nova senha"
                className="bg-[#1D1B14] border border-[#38352A] rounded-lg px-3 py-2 text-xs text-[#EFE8D8] focus:outline-none focus:border-[#DFB56C] aria-invalid:border-[#C4645A]"
              />
              <button type="button" disabled={isAccountBusy || !currentPassword || newPassword.length < 10 || newPassword !== confirmNewPassword} onClick={changePassword} className="px-3 py-2 border border-[#DFB56C]/50 rounded-lg text-xs text-[#DFB56C] disabled:opacity-50 flex items-center justify-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Alterar senha
              </button>
            </div>
            <button type="button" disabled={isAccountBusy} onClick={closeOtherSessions} className="w-full px-3 py-2 border border-[#38352A] rounded-lg text-xs text-[#A79C82] hover:text-[#EFE8D8] disabled:opacity-50 flex items-center justify-center gap-1.5">
              <MonitorX className="w-3.5 h-3.5" /> Encerrar sessões em outros aparelhos
            </button>
            <div className="rounded-lg border border-[#38352A] p-3 space-y-2" aria-labelledby="mfa-title">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 id="mfa-title" className="text-xs font-bold text-[#EFE8D8] flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#8DAE8F]" /> Verificação em duas etapas</h4>
                  <p className="mt-1 text-[10px] text-[#A79C82]">Use Google Authenticator, Microsoft Authenticator ou outro aplicativo TOTP.</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-mono ${hasMfa ? "bg-[#4B6B4E]/20 text-[#8DAE8F]" : "bg-[#38352A] text-[#A79C82]"}`}>{hasMfa ? "ATIVA" : "INATIVA"}</span>
              </div>
              {!hasMfa && !mfaFactorId ? (
                <button type="button" disabled={isAccountBusy} onClick={startMfaEnrollment} className="w-full px-3 py-2 border border-[#8DAE8F]/40 rounded-lg text-xs text-[#8DAE8F] disabled:opacity-50">Ativar proteção adicional</button>
              ) : null}
              {mfaFactorId ? (
                <div className="space-y-2 text-center">
                  <img src={mfaQrCode} alt="Código QR para configurar o aplicativo autenticador" className="mx-auto h-40 w-40 rounded-lg bg-white p-2" />
                  <p className="text-[10px] text-[#A79C82]">Não consegue ler o QR? Chave: <code className="break-all text-[#DFB56C]">{mfaSecret}</code></p>
                  <label htmlFor="mfa-enrollment-code" className="sr-only">Código de verificação</label>
                  <input id="mfa-enrollment-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))} placeholder="Código de 6 números" className="w-full bg-[#1D1B14] border border-[#38352A] rounded-lg px-3 py-2 text-center text-sm tracking-[0.3em] text-[#EFE8D8]" />
                  <button type="button" disabled={isAccountBusy || mfaCode.length !== 6} onClick={verifyMfaEnrollment} className="w-full px-3 py-2 rounded-lg bg-[#4B6B4E] text-xs font-bold text-white disabled:opacity-50">Confirmar e ativar</button>
                </div>
              ) : null}
              {hasMfa ? <button type="button" disabled={isAccountBusy} onClick={disableMfa} className="w-full px-3 py-2 border border-[#7A2E27] rounded-lg text-xs text-[#C4645A] disabled:opacity-50">Desativar verificação em duas etapas</button> : null}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#38352A]">
              <button type="button" disabled={isAccountBusy} onClick={exportAccount} className="px-3 py-2 border border-[#38352A] rounded-lg text-xs text-[#A79C82] hover:text-[#EFE8D8] disabled:opacity-50 flex items-center justify-center gap-1.5">
                <Download className="w-3.5 h-3.5" /> Baixar meus dados
              </button>
              <button type="button" disabled={isAccountBusy} onClick={() => setConfirmDelete(true)} className="px-3 py-2 border border-[#7A2E27] rounded-lg text-xs text-[#C4645A] hover:bg-[#7A2E27]/20 disabled:opacity-50 flex items-center justify-center gap-1.5">
                <UserX className="w-3.5 h-3.5" /> Excluir minha conta
              </button>
            </div>
          </section>

          {/* Action buttons */}
          {profileError && <p role="alert" className="text-xs text-[#C4645A]">{profileError}</p>}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="flex-1 min-h-[44px] bg-[#7A2E27] hover:bg-[#8F392F] active:scale-98 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Ficha Atualizada!</span>
                </>
              ) : isSavingProfile ? <span>Salvando no Supabase…</span> : (
                <>
                  <Sparkles className="w-4 h-4 text-[#DFB56C]" />
                  <span>Salvar Alterações</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="min-h-[44px] px-3 bg-[#15140F] hover:bg-[#7A2E27]/20 border border-[#38352A] hover:border-[#7A2E27] text-[#C4645A] font-mono text-xs rounded-xl flex items-center gap-1.5 transition-colors active:scale-95"
              title="Desconectar da conta"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Desconectar</span>
            </button>
          </div>
        </form>
      </div>
      <ConfirmDialog
        isOpen={confirmDelete}
        title="Excluir conta definitivamente?"
        description="Esta ação apaga suas fichas, mídias e campanhas próprias. Participações também serão removidas. Baixe seus dados antes se quiser guardar uma cópia."
        confirmLabel="Excluir definitivamente"
        cancelLabel="Manter minha conta"
        destructive
        onConfirm={deleteAccount}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
};
