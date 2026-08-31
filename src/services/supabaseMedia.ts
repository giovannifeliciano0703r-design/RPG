import { supabase } from "../lib/supabase";
import type { MediaAlbumType, MediaAsset } from "../types";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function validateImageUpload(file: Pick<File, "type" | "size">): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) return "Formato de imagem não permitido.";
  if (file.size <= 0 || file.size > MAX_IMAGE_BYTES) return "A imagem deve ter no máximo 10 MB.";
  return null;
}

export async function uploadCampaignMedia(file: File, campaignId?: string, album: MediaAlbumType = "Geral"): Promise<MediaAsset> {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const validationError = validateImageUpload(file);
  if (validationError) throw new Error(validationError);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta para enviar imagens.");
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const storagePath = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("campaign-media").upload(storagePath, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase
    .from("media_assets")
    .insert({ owner_id: auth.user.id, campaign_id: campaignId ?? null, storage_path: storagePath, name: file.name, mime_type: file.type, size_bytes: file.size })
    .select()
    .single();
  if (error) {
    await supabase.storage.from("campaign-media").remove([storagePath]);
    throw error;
  }
  const { data: signed, error: signedError } = await supabase.storage.from("campaign-media").createSignedUrl(storagePath, 60 * 60 * 24);
  if (signedError) throw signedError;
  return {
    id: data.id as string,
    userId: auth.user.id,
    name: file.name.replace(/\.[^/.]+$/, ""),
    album,
    originalUrl: signed.signedUrl,
    thumbnailUrl: signed.signedUrl,
    fileSizeBytes: file.size,
    dimensions: { width: 0, height: 0 },
    mimeType: file.type,
    tags: [album.toLowerCase()],
    createdAt: new Date(data.created_at as string).getTime(),
  };
}
