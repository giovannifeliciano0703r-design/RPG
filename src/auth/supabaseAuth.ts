import type { User } from "@supabase/supabase-js";
import type { UserProfile, UserRole } from "../types";
import { normalizeRpgSystem } from "../domain/rpgSystems";
import { supabase } from "../lib/supabase";

type ProfileRow = { display_name?: string; global_role?: "player" | "gm" | "admin"; avatar_url?: string | null };

export async function toUserProfile(user: User): Promise<UserProfile> {
  let profile: ProfileRow | null = null;
  if (supabase) {
    const result = await supabase.from("profiles").select("display_name, global_role, avatar_url").eq("id", user.id).maybeSingle();
    if (!result.error) profile = result.data as ProfileRow | null;
  }
  const globalRole = profile?.global_role ?? "player";
  const role: UserRole = globalRole === "admin" ? "Administrador (ADM)" : globalRole === "gm" ? "Mestre da Mesa" : "Jogador Explorador";
  return {
    id: user.id,
    name: profile?.display_name || user.user_metadata.display_name || user.email?.split("@")[0] || "Aventureiro",
    email: user.email || "",
    role,
    avatar: user.user_metadata.avatar || "wizard",
    favoriteSystem: normalizeRpgSystem(user.user_metadata.favorite_system),
    createdAt: new Date(user.created_at).getTime(),
    isAdmin: globalRole === "admin",
  };
}
