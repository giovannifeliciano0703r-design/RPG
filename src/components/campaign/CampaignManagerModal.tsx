import React, { useState } from "react";
import {
  X,
  Crown,
  ShieldAlert,
  UserPlus,
  Users,
  Copy,
  Check,
  Trash2,
  Lock,
  Sparkles,
  Settings,
  Flame,
} from "lucide-react";
import { Campaign, CampaignMember, CampaignRole, CoGmPermissions, UserProfile } from "../../types";
import { NoticeDialog } from "../ui/Dialog";

interface CampaignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  currentUser: UserProfile;
  onSelectCampaign: (campaign: Campaign) => void;
  onSaveCampaigns: (campaigns: Campaign[]) => void;
}

export const CampaignManagerModal: React.FC<CampaignManagerModalProps> = ({
  isOpen,
  onClose,
  campaigns,
  activeCampaign,
  currentUser,
  onSelectCampaign,
  onSaveCampaigns,
}) => {
  const [newCampaignName, setNewCampaignName] = useState("");
  const [newCampaignDesc, setNewCampaignDesc] = useState("");
  const [selectedMemberForPerms, setSelectedMemberForPerms] = useState<CampaignMember | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [notice, setNotice] = useState<{ title: string; description: string } | null>(null);

  if (!isOpen) return null;

  const handleCreateCampaign = () => {
    if (!newCampaignName.trim()) return;

    const newCamp: Campaign = {
      id: `camp-${Date.now()}`,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      name: newCampaignName.trim(),
      description: newCampaignDesc.trim() || "Uma jornada épica pelo multiverso arcano.",
      system: currentUser.favoriteSystem || "Dungeons & Dragons (D&D)",
      gmUserId: currentUser.id,
      gmUserName: currentUser.name,
      maxCharactersPerPlayer: 2,
      allowPlayerPvp: false,
      isPrivate: false,
      members: [
        {
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar || "Scroll",
          role: "GM",
          assignedCharacterIds: [],
          joinedAt: Date.now(),
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updated = [newCamp, ...campaigns];
    onSaveCampaigns(updated);
    onSelectCampaign(newCamp);
    setNewCampaignName("");
    setNewCampaignDesc("");
  };

  const handleJoinByCode = () => {
    if (!joinCodeInput.trim()) return;
    const target = campaigns.find((c) => c.inviteCode.toLowerCase() === joinCodeInput.trim().toLowerCase());
    if (target) {
      // Add member if not already joined
      const alreadyMember = target.members.some((m) => m.userId === currentUser.id);
      if (!alreadyMember) {
        const newMember: CampaignMember = {
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar || "Scroll",
          role: "PLAYER",
          assignedCharacterIds: [],
          joinedAt: Date.now(),
        };
        const updatedTarget = { ...target, members: [...target.members, newMember] };
        const updatedList = campaigns.map((c) => (c.id === target.id ? updatedTarget : c));
        onSaveCampaigns(updatedList);
        onSelectCampaign(updatedTarget);
      } else {
        onSelectCampaign(target);
      }
      setJoinCodeInput("");
    } else {
      setNotice({
        title: "Campanha não encontrada",
        description: "Confira o código de convite e tente novamente.",
      });
    }
  };

  const handleUpdateMemberRole = (campaign: Campaign, targetUserId: string, newRole: CampaignRole) => {
    // Strict security rule: No one can demote the original GM
    if (targetUserId === campaign.gmUserId && newRole !== "GM") {
      setNotice({
        title: "Papel protegido",
        description: "O Mestre criador da campanha não pode ter seu papel alterado.",
      });
      return;
    }

    const defaultCoGmPerms: CoGmPermissions = {
      canEditMaps: true,
      canManageNpcs: true,
      canManageMonsters: true,
      canInvitePlayers: true,
      canManageInitiative: true,
      canKickPlayers: false,
      canEditSharedMacros: true,
    };

    const updatedMembers = campaign.members.map((m) => {
      if (m.userId === targetUserId) {
        return {
          ...m,
          role: newRole,
          coGmPermissions: newRole === "CO_GM" ? defaultCoGmPerms : undefined,
        };
      }
      return m;
    });

    const updatedCampaign = { ...campaign, members: updatedMembers, updatedAt: Date.now() };
    const updatedList = campaigns.map((c) => (c.id === campaign.id ? updatedCampaign : c));
    onSaveCampaigns(updatedList);
  };

  const handleToggleCoGmPerm = (
    campaign: Campaign,
    targetUserId: string,
    permKey: keyof CoGmPermissions
  ) => {
    const updatedMembers = campaign.members.map((m) => {
      if (m.userId === targetUserId && m.coGmPermissions) {
        return {
          ...m,
          coGmPermissions: {
            ...m.coGmPermissions,
            [permKey]: !m.coGmPermissions[permKey],
          },
        };
      }
      return m;
    });

    const updatedCampaign = { ...campaign, members: updatedMembers, updatedAt: Date.now() };
    const updatedList = campaigns.map((c) => (c.id === campaign.id ? updatedCampaign : c));
    onSaveCampaigns(updatedList);
  };

  const isCurrentGm = activeCampaign?.gmUserId === currentUser.id;

  return (
    <div role="dialog" aria-modal="true" aria-label="Gerenciador de campanhas" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="bg-[#15140F] border border-[#7A2E27]/50 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#1C1A14] border-b border-[#38352A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C]">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#EFE8D8] flex items-center gap-2">
                <span>Campanhas locais & Permissões</span>
                {activeCampaign && (
                  <span className="text-xs font-mono text-[#DFB56C] bg-[#DFB56C]/10 border border-[#DFB56C]/30 px-2 py-0.5 rounded">
                    Ativa: {activeCampaign.name}
                  </span>
                )}
              </h2>
              <p className="text-xs text-[#A79C82]">
                Gerencie salas de jogo, papéis de GM, Co-GM com matriz de permissões e convites
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar gerenciador de campanhas"
            title="Fechar"
            className="p-2 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#25231B] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Column: Campaign List & Join */}
          <div className="w-full md:w-80 border-r border-[#38352A] bg-[#12110D] p-3 flex flex-col justify-between shrink-0">
            <div className="space-y-3 overflow-y-auto">
              {/* Join Code Input */}
              <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl space-y-2">
                <span className="text-[10px] font-mono text-[#DFB56C] font-bold block">ENTRAR POR CÓDIGO</span>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Código (ex: A8F9C2)"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value)}
                    className="flex-1 bg-[#15140F] border border-[#38352A] rounded-lg px-2.5 py-1 text-xs text-[#EFE8D8] uppercase font-mono outline-none"
                  />
                  <button
                    onClick={handleJoinByCode}
                    className="px-3 py-1 bg-[#DFB56C] text-[#15140F] font-bold text-xs rounded-lg hover:bg-[#b08635]"
                  >
                    Entrar
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-[#A79C82] uppercase tracking-wider block px-2">
                  Minhas Campanhas ({campaigns.length})
                </span>

                {campaigns.map((camp) => (
                  <button
                    key={camp.id}
                    onClick={() => onSelectCampaign(camp)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-colors ${
                      activeCampaign?.id === camp.id
                        ? "bg-[#DFB56C]/15 border-[#DFB56C] text-[#EFE8D8]"
                        : "bg-[#1C1A14] border-[#38352A] text-[#A79C82] hover:border-[#DFB56C]/40 hover:text-[#EFE8D8]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-serif font-bold text-xs truncate text-[#EFE8D8]">{camp.name}</span>
                        {camp.gmUserId === currentUser.id && (
                          <span className="text-[9px] font-mono text-[#DFB56C] bg-[#DFB56C]/10 px-1 rounded">GM</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#A79C82] truncate">{camp.system}</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#DFB56C] shrink-0 pl-2">
                      {camp.members.length} membros
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Create New Campaign */}
            <div className="pt-3 border-t border-[#38352A] space-y-2">
              <span className="text-[10px] font-mono text-[#DFB56C] font-bold block">CRIAR NOVA CAMPANHA</span>
              <input
                type="text"
                placeholder="Nome da Campanha..."
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                className="w-full bg-[#1C1A14] border border-[#38352A] rounded-lg px-2.5 py-1 text-xs text-[#EFE8D8] outline-none"
              />
              <button
                onClick={handleCreateCampaign}
                className="w-full py-1.5 bg-[#DFB56C] text-[#15140F] font-bold text-xs rounded-lg hover:bg-[#b08635]"
              >
                + Criar como Mestre (GM)
              </button>
            </div>
          </div>

          {/* Right Column: Active Campaign Settings & Granular Co-GM Permissions */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#181611] space-y-4">
            {activeCampaign ? (
              <div className="space-y-4">
                {/* Invite & Banner Bar */}
                <div className="p-4 bg-[#1C1A14] border border-[#38352A] rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#EFE8D8]">{activeCampaign.name}</h3>
                    <p className="text-xs text-[#A79C82]">
                      Mestre: <strong className="text-[#DFB56C]">{activeCampaign.gmUserName}</strong> • Sistema: {activeCampaign.system}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-[#15140F] border border-[#38352A] px-3 py-1.5 rounded-xl text-xs font-mono">
                      <span className="text-[#A79C82]">Código:</span>
                      <strong className="text-[#DFB56C] tracking-widest">{activeCampaign.inviteCode}</strong>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(activeCampaign.inviteCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="text-[#A79C82] hover:text-[#EFE8D8] ml-1"
                        title="Copiar código de convite"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-[#8DAE8F]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Member Roster & Roles */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#DFB56C] uppercase tracking-wider">
                    Jogadores e Papéis na Mesa ({activeCampaign.members.length})
                  </h4>

                  <div className="space-y-2">
                    {activeCampaign.members.map((member) => {
                      const isMemberGm = member.role === "GM";
                      const isMemberCoGm = member.role === "CO_GM";

                      return (
                        <div
                          key={member.userId}
                          className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C] font-bold">
                              {member.userName.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-[#EFE8D8]">
                                <span>{member.userName}</span>
                                {isMemberGm && (
                                  <span className="text-[9px] font-mono text-[#DFB56C] bg-[#DFB56C]/10 border border-[#DFB56C]/30 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                                    <Crown className="w-2.5 h-2.5" /> Mestre Dono
                                  </span>
                                )}
                                {isMemberCoGm && (
                                  <span className="text-[9px] font-mono text-[#8DAE8F] bg-[#4B6B4E]/30 px-1.5 py-0.2 rounded">
                                    Co-GM
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-[#A79C82]">Entrou na mesa em {new Date(member.joinedAt).toLocaleDateString()}</p>
                            </div>
                          </div>

                          {/* Role Selector (Only GM can edit roles) */}
                          {isCurrentGm && member.userId !== activeCampaign.gmUserId ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleUpdateMemberRole(activeCampaign, member.userId, e.target.value as CampaignRole)
                                }
                                className="bg-[#15140F] border border-[#38352A] rounded-lg px-2.5 py-1 text-xs text-[#DFB56C] font-mono outline-none"
                              >
                                <option value="PLAYER">Jogador</option>
                                <option value="CO_GM">Co-GM (Auxiliar)</option>
                                <option value="SPECTATOR">Espectador</option>
                              </select>
                            </div>
                          ) : (
                            <span className="font-mono text-xs text-[#A79C82]">{member.role}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Granular Co-GM Permission Table */}
                {activeCampaign.members.some((m) => m.role === "CO_GM") && (
                  <div className="p-4 bg-[#1C1A14] border border-[#38352A] rounded-2xl space-y-3">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-[#DFB56C]" />
                      <h4 className="text-xs font-mono font-bold text-[#EFE8D8] uppercase">
                        Matriz de Permissões Granulares do Co-GM
                      </h4>
                    </div>
                    <p className="text-xs text-[#A79C82]">
                      O Co-GM nunca pode excluir a campanha nem revogar poderes do Mestre criador.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {activeCampaign.members
                        .filter((m) => m.role === "CO_GM")
                        .map((cogm) => (
                          <div key={cogm.userId} className="p-3 bg-[#15140F] border border-[#38352A] rounded-xl space-y-2">
                            <span className="font-bold text-[#DFB56C] block">{cogm.userName} (Co-GM)</span>
                            {[
                              { key: "canEditMaps" as const, label: "Pode editar mapas e névoa" },
                              { key: "canManageNpcs" as const, label: "Pode gerenciar NPCs" },
                              { key: "canManageMonsters" as const, label: "Pode adicionar monstros" },
                              { key: "canInvitePlayers" as const, label: "Pode convidar novos jogadores" },
                              { key: "canManageInitiative" as const, label: "Pode controlar ordem de iniciativa" },
                              { key: "canKickPlayers" as const, label: "Pode remover jogadores da sessão" },
                            ].map((perm) => (
                              <label
                                key={perm.key}
                                className="flex items-center gap-2 text-[#EFE8D8] text-[11px] cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!cogm.coGmPermissions?.[perm.key]}
                                  disabled={!isCurrentGm}
                                  onChange={() => handleToggleCoGmPerm(activeCampaign, cogm.userId, perm.key)}
                                  className="accent-[#DFB56C]"
                                />
                                <span>{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#A79C82]">
                <Crown className="w-12 h-12 text-[#38352A] mb-2" />
                <p className="text-sm font-serif text-[#EFE8D8]">Nenhuma campanha selecionada</p>
                <p className="text-xs">Crie uma nova campanha à esquerda ou entre com um código.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <NoticeDialog
        isOpen={notice !== null}
        title={notice?.title || "Aviso"}
        description={notice?.description || ""}
        onClose={() => setNotice(null)}
      />
    </div>
  );
};
