import { supabase } from "../lib/supabase";
import type { CharacterSheet } from "../types";

export type TrashedCharacter = { id: string; character: CharacterSheet; deletedAt: string; expiresAt: string };

export async function trashCharacter(character: CharacterSheet) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre novamente para excluir a ficha.");
  const { error } = await supabase.from("trash_items").insert({
    user_id: auth.user.id, item_type: "character", item_key: character.id,
    item_name: character.name.slice(0, 160), payload: character,
  });
  if (error) throw error;
}

export async function loadTrashedCharacters(): Promise<TrashedCharacter[]> {
  if (!supabase) return [];
  const now = new Date().toISOString();
  await supabase.from("trash_items").delete().lte("expires_at", now);
  const { data, error } = await supabase.from("trash_items").select("id,payload,deleted_at,expires_at")
    .eq("item_type", "character").gt("expires_at", now).order("deleted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, character: row.payload as CharacterSheet, deletedAt: row.deleted_at, expiresAt: row.expires_at }));
}

export async function removeTrashItem(id: string) {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { error } = await supabase.from("trash_items").delete().eq("id", id);
  if (error) throw error;
}
