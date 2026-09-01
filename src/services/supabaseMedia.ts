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
    .insert({ owner_id: auth.user.id, campaign_id: campaignId ?? null, storage_path: storagePath, name: file.name, mime_type: file.type, size_bytes: file.size, album })
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

export async function loadUserMediaAssets(): Promise<MediaAsset[]> {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Entre na sua conta para carregar suas imagens.");
  const { data, error } = await supabase
    .from("media_assets")
    .select("id,owner_id,storage_path,name,mime_type,size_bytes,width,height,created_at,album")
    .eq("owner_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return Promise.all((data ?? []).map(async (row) => {
    const { data: signed, error: signedError } = await supabase!.storage
      .from("campaign-media")
      .createSignedUrl(row.storage_path as string, 60 * 60 * 24);
    if (signedError) throw signedError;
    return {
      id: row.id as string,
      userId: row.owner_id as string,
      name: (row.name as string).replace(/\.[^/.]+$/, ""),
      album: row.album as MediaAlbumType,
      originalUrl: signed.signedUrl,
      thumbnailUrl: signed.signedUrl,
      fileSizeBytes: Number(row.size_bytes),
      dimensions: { width: Number(row.width || 0), height: Number(row.height || 0) },
      mimeType: row.mime_type as string,
      tags: [(row.album as string).toLowerCase()],
      createdAt: new Date(row.created_at as string).getTime(),
    } satisfies MediaAsset;
  }));
}

export async function deleteUserMediaAsset(assetId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase não está configurado.");
  const { data, error } = await supabase
    .from("media_assets")
    .select("storage_path")
    .eq("id", assetId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return;
  const { error: storageError } = await supabase.storage.from("campaign-media").remove([data.storage_path as string]);
  if (storageError) throw storageError;
  const { error: deleteError } = await supabase.from("media_assets").delete().eq("id", assetId);
  if (deleteError) throw deleteError;
}
