import { supabase } from "../lib/supabase";
import { deleteUserMediaAsset, loadUserMediaAssets } from "./supabaseMedia";

export async function exportMyAccountData() {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw new Error("Entre novamente para exportar seus dados.");
  const userId = auth.user.id;
  const [profile, state, media, memberships, ownedCampaigns] = await Promise.all([
    supabase.from("profiles").select("id,display_name,avatar_url,created_at,updated_at").eq("id", userId).maybeSingle(),
    supabase.from("user_app_state").select("section,payload,revision,updated_at").eq("user_id", userId),
    supabase.from("media_assets").select("id,campaign_id,name,mime_type,size_bytes,width,height,album,created_at").eq("owner_id", userId),
    supabase.from("campaign_members").select("campaign_id,role,permissions,joined_at").eq("user_id", userId),
    supabase.from("campaigns").select("id,name,description,system,visibility,created_at,updated_at").eq("owner_id", userId),
  ]);
  const error = profile.error || state.error || media.error || memberships.error || ownedCampaigns.error;
  if (error) throw error;
  return {
    format: "mestre-arcano-account-export",
    version: 1,
    exportedAt: new Date().toISOString(),
    account: { id: userId, email: auth.user.email, profile: profile.data },
    appState: state.data ?? [], media: media.data ?? [], memberships: memberships.data ?? [], ownedCampaigns: ownedCampaigns.data ?? [],
  };
}

export function downloadAccountExport(data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `mestre-arcano-dados-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function deleteMyAccount() {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const assets = await loadUserMediaAssets();
  for (const asset of assets) await deleteUserMediaAsset(asset.id);
  const { error } = await supabase.rpc("delete_my_account", { confirmation: "EXCLUIR MINHA CONTA" });
  if (error) throw error;
  await supabase.auth.signOut({ scope: "local" });
}
