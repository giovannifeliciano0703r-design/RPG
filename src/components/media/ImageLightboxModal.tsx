import React from "react";
import { X, ZoomIn, Download, ExternalLink } from "lucide-react";

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  title,
  onClose,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Imagem: ${title}` : "Visualização de imagem"}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 cursor-zoom-out"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center cursor-default"
      >
        {/* Controls bar */}
        <div className="absolute top-2 right-2 sm:-top-12 sm:right-0 flex items-center gap-2 bg-[#15140F]/80 p-1.5 rounded-xl border border-[#38352A]">
          {title && <span className="text-xs font-mono text-[#EFE8D8] px-2">{title}</span>}
          <a
            href={imageUrl}
            download={title ? `${title}.webp` : "imagem_rpg.webp"}
            className="p-1.5 text-[#A79C82] hover:text-[#DFB56C] transition-colors"
            title="Baixar imagem em alta resolução"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            aria-label="Fechar imagem"
            className="p-1.5 text-[#A79C82] hover:text-[#EFE8D8] transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* High Res Image */}
        <img
          src={imageUrl}
          alt={title || "Imagem RPG"}
          referrerPolicy="no-referrer"
          className="max-h-[85vh] max-w-full object-contain rounded-xl border border-[#38352A] shadow-2xl"
        />
      </div>
    </div>
  );
};
