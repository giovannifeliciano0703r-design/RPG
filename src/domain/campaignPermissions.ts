import type { Campaign } from "../types";

export function getCampaignPermissions(campaign: Campaign | null, userId: string | undefined) {
  const isOwner = Boolean(campaign && userId && campaign.gmUserId === userId);
  const membership = campaign?.members.find((member) => member.userId === userId);
  const isCoGm = membership?.role === "CO_GM";
  const delegated = membership?.coGmPermissions;

  return {
    isOwner,
    canEditMaps: isOwner || (isCoGm && delegated?.canEditMaps === true),
    canManageInitiative: isOwner || (isCoGm && delegated?.canManageInitiative === true),
    canEditSharedMacros: isOwner || (isCoGm && delegated?.canEditSharedMacros === true),
    canInvitePlayers: isOwner || (isCoGm && delegated?.canInvitePlayers === true),
    canKickPlayers: isOwner || (isCoGm && delegated?.canKickPlayers === true),
  };
}
