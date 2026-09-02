import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Campaign, CampaignMember, CampaignRole, CoGmPermissions, RpgSystem } from "../types";

type RemoteCampaignRow = {
  id: string; owner_id: string; name: string; description: string; system: string;
  visibility: "private" | "invite_only"; created_at: string; updated_at: string;
};

type RemoteMemberRow = {
  user_id: string; role: "player" | "gm" | "admin"; joined_at: string;
  permissions: Record<string, boolean> | null;
  profiles: { display_name: string; avatar_url: string | null } | null;
};

function mapRemoteMember(row: RemoteMemberRow, ownerId: string): CampaignMember {
  const permissions = row.permissions ?? {};
  const role: CampaignRole = row.user_id === ownerId
    ? "GM"
    : row.role === "gm" ? "CO_GM" : permissions.isSpectator ? "SPECTATOR" : "PLAYER";
  return {
    userId: row.user_id,
    userName: row.profiles?.display_name || "Aventureiro",
    userAvatar: row.profiles?.avatar_url || "Scroll",
    role,
    coGmPermissions: role === "CO_GM" ? permissions as unknown as CoGmPermissions : undefined,
    assignedCharacterIds: [],
    joinedAt: new Date(row.joined_at).getTime(),
  };
}

export async function loadRemoteCampaign(campaignId: string, inviteCode = ""): Promise<Campaign> {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const [{ data: campaign, error: campaignError }, { data: members, error: membersError }] = await Promise.all([
    supabase.from("campaigns").select("*").eq("id", campaignId).single(),
    supabase.from("campaign_members").select("user_id,role,joined_at,permissions,profiles(display_name,avatar_url)").eq("campaign_id", campaignId),
  ]);
  if (campaignError) throw campaignError;
  if (membersError) throw membersError;
  const row = campaign as RemoteCampaignRow;
  const mappedMembers = (members ?? []) as unknown as RemoteMemberRow[];
  const owner = mappedMembers.find((member) => member.user_id === row.owner_id);
  return {
    id: `remote-${row.id}`, remoteId: row.id, inviteCode, name: row.name, description: row.description,
    system: row.system as RpgSystem, gmUserId: row.owner_id,
    gmUserName: owner?.profiles?.display_name || "Mestre", members: mappedMembers.map((member) => mapRemoteMember(member, row.owner_id)),
    maxCharactersPerPlayer: 2, allowPlayerPvp: false, isPrivate: row.visibility === "private",
    createdAt: new Date(row.created_at).getTime(), updatedAt: new Date(row.updated_at).getTime(),
  };
}

export async function createCampaignInvite(campaignId: string) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase.rpc("create_campaign_invite", { target_campaign: campaignId });
  if (error) throw error;
  return data as string;
}

export type CampaignInviteRecord = {
  id: string; code: string; expires_at: string; max_uses: number; uses: number; revoked_at: string | null;
};

export type CampaignAuditRecord = {
  id: number; action: string; actor_id: string | null; target_user_id: string | null; metadata: Record<string, unknown>; created_at: string;
};

export async function loadCampaignManagementRecords(campaignId: string) {
  if (!supabase) return { invites: [] as CampaignInviteRecord[], audit: [] as CampaignAuditRecord[] };
  const [invitesResult, auditResult] = await Promise.all([
    supabase.from("campaign_invites").select("id,code,expires_at,max_uses,uses,revoked_at").eq("campaign_id", campaignId).order("created_at", { ascending: false }).limit(25),
    supabase.from("audit_events").select("id,action,actor_id,target_user_id,metadata,created_at").eq("campaign_id", campaignId).order("created_at", { ascending: false }).limit(50),
  ]);
  if (invitesResult.error) throw invitesResult.error;
  if (auditResult.error) throw auditResult.error;
  return { invites: (invitesResult.data ?? []) as CampaignInviteRecord[], audit: (auditResult.data ?? []) as CampaignAuditRecord[] };
}

export async function revokeCampaignInvite(inviteId: string) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { error } = await supabase.rpc("revoke_campaign_invite", { target_invite: inviteId });
  if (error) throw error;
}

export async function joinCampaignByInvite(code: string) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase.rpc("join_campaign_by_invite", { invite_code: code.trim().toUpperCase() });
  if (error) throw error;
  return loadRemoteCampaign(data as string);
}

export async function updateRemoteMemberAccess(campaignId: string, userId: string, role: CampaignRole, permissions?: CoGmPermissions) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { error } = await supabase.rpc("update_campaign_member_access", {
    target_campaign: campaignId, target_user: userId, target_role: role, target_permissions: permissions ?? {},
  });
  if (error) throw error;
}

export async function removeRemoteCampaignMember(campaignId: string, userId: string) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { error } = await supabase.rpc("remove_campaign_member", { target_campaign: campaignId, target_user: userId });
  if (error) throw error;
}

export async function deleteRemoteCampaign(campaignId: string) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { error } = await supabase.rpc("delete_owned_campaign", { target_campaign: campaignId });
  if (error) throw error;
}

export type RemoteCampaignMessage = {
  id: string;
  campaign_id: string;
  author_id: string;
  body: string;
  channel: string;
  created_at: string;
  edited_at: string | null;
  message_type: "TEXT" | "ROLL" | "IMAGE" | "SYSTEM";
  metadata: Record<string, unknown> | null;
};

export async function createRemoteCampaign(campaign: Pick<Campaign, "name" | "description" | "system" | "isPrivate">) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta para sincronizar a campanha.");
  const { data, error } = await supabase.from("campaigns").insert({
    owner_id: auth.user.id,
    name: campaign.name,
    description: campaign.description,
    system: campaign.system,
    visibility: campaign.isPrivate ? "private" : "invite_only",
  }).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function loadCampaignMessages(campaignId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from("campaign_messages").select("*").eq("campaign_id", campaignId).order("created_at").limit(250);
  if (error) throw error;
  return (data ?? []) as RemoteCampaignMessage[];
}

export async function sendCampaignMessage(campaignId: string, message: Partial<import("../types").ChatMessage>) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta para enviar mensagens.");
  const { data, error } = await supabase
    .from("campaign_messages")
    .insert({
      campaign_id: campaignId,
      author_id: auth.user.id,
      body: (message.content || "").trim(),
      channel: message.channel === "IC" ? "IC" : "OOC",
      message_type: message.type === "ROLL" || message.type === "IMAGE" ? message.type : "TEXT",
      metadata: {
        senderName: message.senderName?.slice(0, 120),
        senderAvatar: message.senderAvatar?.slice(0, 500),
        characterId: message.characterId?.slice(0, 120),
        rollData: message.rollData,
        imageUrl: message.imageUrl?.slice(0, 2_000),
      },
    })
    .select()
    .single();
  if (error) throw error;
  return data as RemoteCampaignMessage;
}

export function subscribeToCampaignMessages(
  campaignId: string,
  onMessage: (message: RemoteCampaignMessage) => void,
): RealtimeChannel | null {
  if (!supabase) return null;
  return supabase
    .channel(`campaign:${campaignId}:messages`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "campaign_messages", filter: `campaign_id=eq.${campaignId}` },
      (event) => onMessage(event.new as RemoteCampaignMessage),
    )
    .subscribe();
}

export class CampaignStateConflictError extends Error {
  constructor() { super("Este conteúdo foi alterado em outro aparelho. A versão mais recente foi carregada."); }
}

export async function saveCampaignState(campaignId: string, stateKey: string, payload: unknown, expectedRevision = 0) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase.rpc("save_campaign_state_versioned", {
    target_campaign: campaignId, target_state_key: stateKey, target_payload: payload, expected_revision: expectedRevision,
  });
  if (error?.code === "40001") throw new CampaignStateConflictError();
  if (error) throw error;
  return data as number;
}

export type VersionedCampaignState<T> = { payload: T; revision: number };

export async function loadCampaignState<T>(campaignId: string, stateKey: string): Promise<VersionedCampaignState<T> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("campaign_state").select("payload,revision").eq("campaign_id", campaignId).eq("state_key", stateKey).maybeSingle();
  if (error) throw error;
  return data ? { payload: data.payload as T, revision: Number(data.revision) } : null;
}

export function subscribeToCampaignState(campaignId: string, onState: (stateKey: string, payload: unknown, revision: number) => void) {
  if (!supabase) return null;
  return supabase.channel(`campaign:${campaignId}:state`).on(
    "postgres_changes",
    { event: "*", schema: "public", table: "campaign_state", filter: `campaign_id=eq.${campaignId}` },
    (event) => {
      const row = event.new as { state_key?: string; payload?: unknown; revision?: number };
      if (row.state_key) onState(row.state_key, row.payload, Number(row.revision || 0));
    },
  ).subscribe();
}

export function subscribeToCampaignRoster(campaignId: string, onChange: () => void): RealtimeChannel | null {
  if (!supabase) return null;
  return supabase.channel(`campaign:${campaignId}:roster`)
    .on("postgres_changes", { event: "*", schema: "public", table: "campaign_members", filter: `campaign_id=eq.${campaignId}` }, onChange)
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "campaigns", filter: `id=eq.${campaignId}` }, onChange)
    .subscribe();
}
