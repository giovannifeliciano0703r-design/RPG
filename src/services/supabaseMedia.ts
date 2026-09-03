import { supabase } from "../lib/supabase";
import type { MediaAlbumType, MediaAsset } from "../types";
import { processImageFile } from "../utils/imageProcessor";

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
  let originalBlob: Blob = file;
  let thumbnailBlob: Blob | null = null;
  let mimeType = file.type;
  let dimensions = { width: 0, height: 0 };
  if (file.type !== "image/gif") {
    const processed = await processImageFile(file);
    originalBlob = await (await fetch(processed.originalUrl)).blob();
    thumbnailBlob = await (await fetch(processed.thumbnailUrl)).blob();
    mimeType = originalBlob.type || "image/webp";
    dimensions = processed.dimensions;
  }
  const extension = mimeType === "image/webp" ? "webp" : file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const assetId = crypto.randomUUID();
  const storagePath = `${auth.user.id}/${assetId}.${extension}`;
  const thumbnailPath = thumbnailBlob ? `${auth.user.id}/${assetId}-thumb.webp` : null;
  const { error: uploadError } = await supabase.storage.from("campaign-media").upload(storagePath, originalBlob, {
    cacheControl: "3600",
    contentType: mimeType,
    upsert: false,
  });
  if (uploadError) throw uploadError;
  if (thumbnailPath && thumbnailBlob) {
    const { error: thumbnailError } = await supabase.storage.from("campaign-media").upload(thumbnailPath, thumbnailBlob, { cacheControl: "86400", contentType: "image/webp", upsert: false });
    if (thumbnailError) { await supabase.storage.from("campaign-media").remove([storagePath]); throw thumbnailError; }
  }
  const totalBytes = originalBlob.size + (thumbnailBlob?.size || 0);
  const { data, error } = await supabase
    .from("media_assets")
    .insert({ owner_id: auth.user.id, campaign_id: campaignId ?? null, storage_path: storagePath, thumbnail_path: thumbnailPath, name: file.name, mime_type: mimeType, size_bytes: totalBytes, width: dimensions.width || null, height: dimensions.height || null, album })
    .select()
    .single();
  if (error) {
    await supabase.storage.from("campaign-media").remove([storagePath, ...(thumbnailPath ? [thumbnailPath] : [])]);
    throw error;
  }
  const { data: signed, error: signedError } = await supabase.storage.from("campaign-media").createSignedUrl(storagePath, 60 * 60 * 24);
  if (signedError) throw signedError;
  const thumbnailUrl = thumbnailPath ? (await supabase.storage.from("campaign-media").createSignedUrl(thumbnailPath, 60 * 60 * 24)).data?.signedUrl : signed.signedUrl;
  return {
    id: data.id as string,
    userId: auth.user.id,
    name: file.name.replace(/\.[^/.]+$/, ""),
    album,
    originalUrl: signed.signedUrl,
    thumbnailUrl: thumbnailUrl || signed.signedUrl,
    fileSizeBytes: totalBytes,
    dimensions,
    mimeType,
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
    .select("id,owner_id,storage_path,thumbnail_path,name,mime_type,size_bytes,width,height,created_at,album")
    .eq("owner_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return Promise.all((data ?? []).map(async (row) => {
    const { data: signed, error: signedError } = await supabase!.storage
      .from("campaign-media")
      .createSignedUrl(row.storage_path as string, 60 * 60 * 24);
    if (signedError) throw signedError;
    const thumbnailSigned = row.thumbnail_path ? await supabase!.storage.from("campaign-media").createSignedUrl(row.thumbnail_path as string, 60 * 60 * 24) : null;
    return {
      id: row.id as string,
      userId: row.owner_id as string,
      name: (row.name as string).replace(/\.[^/.]+$/, ""),
      album: row.album as MediaAlbumType,
      originalUrl: signed.signedUrl,
      thumbnailUrl: thumbnailSigned?.data?.signedUrl || signed.signedUrl,
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
    .select("storage_path,thumbnail_path")
    .eq("id", assetId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return;
  const paths = [data.storage_path as string, ...(data.thumbnail_path ? [data.thumbnail_path as string] : [])];
  const { error: storageError } = await supabase.storage.from("campaign-media").remove(paths);
  if (storageError) throw storageError;
  const { error: deleteError } = await supabase.from("media_assets").delete().eq("id", assetId);
  if (deleteError) throw deleteError;
}
