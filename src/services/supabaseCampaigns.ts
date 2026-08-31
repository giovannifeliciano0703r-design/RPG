import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Campaign } from "../types";

export type RemoteCampaignMessage = {
  id: string;
  campaign_id: string;
  author_id: string;
  body: string;
  channel: string;
  created_at: string;
  edited_at: string | null;
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

export async function sendCampaignMessage(campaignId: string, body: string, channel = "general") {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta para enviar mensagens.");
  const { data, error } = await supabase
    .from("campaign_messages")
    .insert({ campaign_id: campaignId, author_id: auth.user.id, body: body.trim(), channel })
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

export async function saveCampaignState(campaignId: string, stateKey: string, payload: unknown) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta para sincronizar a campanha.");
  const { error } = await supabase.from("campaign_state").upsert(
    { campaign_id: campaignId, state_key: stateKey, payload, updated_by: auth.user.id, updated_at: new Date().toISOString() },
    { onConflict: "campaign_id,state_key" },
  );
  if (error) throw error;
}

export async function loadCampaignState<T>(campaignId: string, stateKey: string): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("campaign_state").select("payload").eq("campaign_id", campaignId).eq("state_key", stateKey).maybeSingle();
  if (error) throw error;
  return (data?.payload as T | undefined) ?? null;
}

export function subscribeToCampaignState(campaignId: string, onState: (stateKey: string, payload: unknown) => void) {
  if (!supabase) return null;
  return supabase.channel(`campaign:${campaignId}:state`).on(
    "postgres_changes",
    { event: "*", schema: "public", table: "campaign_state", filter: `campaign_id=eq.${campaignId}` },
    (event) => {
      const row = event.new as { state_key?: string; payload?: unknown };
      if (row.state_key) onState(row.state_key, row.payload);
    },
  ).subscribe();
}
