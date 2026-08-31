import React, { useMemo, useState } from "react";
import {
  X,
  Upload,
  Image as ImageIcon,
  Folder,
  Trash2,
  ZoomIn,
  Check,
  Copy,
  Layers,
  Sparkles,
  HardDrive,
} from "lucide-react";
import { MediaAsset, MediaAlbumType } from "../../types";
import { processImageFile, formatFileSize } from "../../utils/imageProcessor";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: MediaAsset[];
  onSaveAssets: (assets: MediaAsset[]) => void;
  userId: string;
  onSelectImage?: (url: string) => void;
  onViewHdImage?: (url: string, name: string) => void;
  onUploadFile?: (file: File, album: MediaAlbumType) => Promise<MediaAsset>;
}

const MEDIA_ALBUMS: MediaAlbumType[] = ["Tokens", "Retratos", "Mapas & Cenários", "Handouts", "Geral"];

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSaveAssets,
  userId,
  onSelectImage,
  onViewHdImage,
  onUploadFile,
}) => {
  const [activeAlbum, setActiveAlbum] = useState<MediaAlbumType | "all">("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const filteredAssets = useMemo(
    () => assets.filter((asset) => activeAlbum === "all" || asset.album === activeAlbum),
    [activeAlbum, assets],
  );
  const albumCounts = useMemo(
    () => new Map(MEDIA_ALBUMS.map((album) => [album, assets.filter((asset) => asset.album === album).length])),
    [assets],
  );
  const totalBytesUsed = useMemo(
    () => assets.reduce((total, asset) => total + (asset.fileSizeBytes || 0), 0),
    [assets],
  );
  const maxQuotaBytes = 100 * 1024 * 1024;
  const percentUsed = Math.min(100, (totalBytesUsed / maxQuotaBytes) * 100);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessing(true);
    setUploadError(null);

    try {
      const newAssets: MediaAsset[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;

        let targetAlbum: MediaAlbumType = "Geral";
        if (activeAlbum !== "all") targetAlbum = activeAlbum;

        if (onUploadFile) {
          newAssets.push(await onUploadFile(file, targetAlbum));
          continue;
        }

        const processed = await processImageFile(file);

        const asset: MediaAsset = {
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          userId,
          name: file.name.replace(/\.[^/.]+$/, ""),
          album: targetAlbum,
          originalUrl: processed.originalUrl,
          thumbnailUrl: processed.thumbnailUrl,
          fileSizeBytes: processed.fileSizeBytes,
          dimensions: processed.dimensions,
          mimeType: processed.mimeType,
          tags: [targetAlbum.toLowerCase()],
          createdAt: Date.now(),
        };

        newAssets.push(asset);
      }

      const updated = [...newAssets, ...assets];
      onSaveAssets(updated);
    } catch (err: any) {
      setUploadError("Erro ao processar e comprimir imagem: " + (err.message || "Erro desconhecido"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    onSaveAssets(updated);
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Biblioteca de mídia" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden">
      <div className="bg-[#15140F] border border-[#7A2E27]/50 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 bg-[#1C1A14] border-b border-[#38352A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#7A2E27]/30 border border-[#7A2E27] flex items-center justify-center text-[#DFB56C]">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#EFE8D8] flex items-center gap-2">
                <span>Biblioteca de Mídia & Imagens</span>
                <span className="text-xs font-mono text-[#DFB56C] bg-[#DFB56C]/10 px-2 py-0.5 rounded">
                  {assets.length} Arquivos
                </span>
              </h2>
              <p className="text-xs text-[#A79C82]">
                Armazenamento com compressão adaptativa WebP e miniaturas automáticas de alta performance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#25231B] rounded-xl transition-colors"
            aria-label="Fechar biblioteca de mídia"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Albums Sidebar */}
          <div className="w-full md:w-64 border-r border-[#38352A] bg-[#12110D] p-3 flex flex-col justify-between shrink-0">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-[#A79C82] uppercase tracking-wider block mb-2 px-2">
                Álbuns & Pastas
              </span>

              <button
                onClick={() => setActiveAlbum("all")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                  activeAlbum === "all"
                    ? "bg-[#DFB56C]/15 text-[#DFB56C] font-bold border border-[#DFB56C]/40"
                    : "text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#1C1A14]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <span>Todos os Arquivos</span>
                </div>
                <span className="text-[10px] font-mono">{assets.length}</span>
              </button>

              {MEDIA_ALBUMS.map((alb) => {
                const count = albumCounts.get(alb) ?? 0;
                return (
                  <button
                    key={alb}
                    onClick={() => setActiveAlbum(alb)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                      activeAlbum === alb
                        ? "bg-[#DFB56C]/15 text-[#DFB56C] font-bold border border-[#DFB56C]/40"
                        : "text-[#A79C82] hover:text-[#EFE8D8] hover:bg-[#1C1A14]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      <span>{alb}</span>
                    </div>
                    <span className="text-[10px] font-mono">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Storage Meter */}
            <div className="p-3 bg-[#1C1A14] border border-[#38352A] rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#A79C82] font-mono text-[10px]">
                <span className="flex items-center gap-1">
                  <HardDrive className="w-3 h-3" /> Armazenamento
                </span>
                <span>{formatFileSize(totalBytesUsed)} / 100 MB</span>
              </div>
              <div className="w-full bg-[#15140F] h-1.5 rounded-full overflow-hidden border border-[#38352A]">
                <div
                  className="bg-[#DFB56C] h-full transition-all"
                  style={{ width: `${percentUsed}%` }}
                />
              </div>
            </div>
          </div>

          {/* Upload & Asset Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#181611] flex flex-col space-y-4">
            {/* Drag and drop upload banner */}
            <div className="border-2 border-dashed border-[#38352A] hover:border-[#DFB56C] rounded-2xl p-4 text-center bg-[#1C1A14]/50 transition-colors relative">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                disabled={isProcessing}
                aria-label="Adicionar imagens à biblioteca"
              />
              <div className="flex flex-col items-center justify-center gap-1 text-[#A79C82]">
                <Upload className="w-6 h-6 text-[#DFB56C] animate-pulse" />
                <p className="text-xs font-serif text-[#EFE8D8]">
                  {isProcessing ? "Otimizando e gerando miniaturas..." : "Arraste imagens aqui ou clique para fazer upload"}
                </p>
                <p className="text-[10px] font-mono">
                  Compressão adaptativa automática • Álbum atual: <strong className="text-[#DFB56C]">{activeAlbum === "all" ? "Geral" : activeAlbum}</strong>
                </p>
              </div>
            </div>

            {uploadError && (
              <div className="p-2.5 bg-[#7A2E27]/30 border border-[#7A2E27] rounded-xl text-xs text-[#C4645A]">
                {uploadError}
              </div>
            )}

            {/* Assets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-[#1C1A14] border border-[#38352A] hover:border-[#DFB56C]/60 rounded-xl overflow-hidden group flex flex-col transition-all"
                >
                  <div className="relative aspect-square bg-[#12110D] overflow-hidden flex items-center justify-center">
                    <img
                      src={asset.thumbnailUrl || asset.originalUrl}
                      alt={asset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Hover Actions Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        onClick={() => onViewHdImage?.(asset.originalUrl, asset.name)}
                        className="p-1.5 bg-[#15140F] text-[#DFB56C] hover:text-[#EFE8D8] rounded-lg border border-[#38352A]"
                        title="Ver em Alta Resolução (HD)"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>

                      {onSelectImage && (
                        <button
                          onClick={() => {
                            onSelectImage(asset.originalUrl);
                            onClose();
                          }}
                          className="p-1.5 bg-[#DFB56C] text-[#15140F] font-bold rounded-lg"
                          title="Usar esta imagem"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-1.5 bg-[#7A2E27]/80 text-[#EFE8D8] hover:bg-[#7A2E27] rounded-lg"
                        title="Excluir imagem"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-2 flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[#EFE8D8] text-[11px] truncate">{asset.name}</p>
                      <p className="text-[9px] font-mono text-[#A79C82]">
                        {formatFileSize(asset.fileSizeBytes)} • {asset.dimensions?.width}x{asset.dimensions?.height}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#A79C82]">
                <ImageIcon className="w-12 h-12 text-[#38352A] mb-2" />
                <p className="text-sm font-serif text-[#EFE8D8]">Nenhuma imagem encontrada neste álbum</p>
                <p className="text-xs">Faça upload de tokens, fotos ou mapas acima.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
