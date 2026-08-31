import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type RemoteCampaignMessage = {
  id: string;
  campaign_id: string;
  author_id: string;
  body: string;
  channel: string;
  created_at: string;
  edited_at: string | null;
};

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

