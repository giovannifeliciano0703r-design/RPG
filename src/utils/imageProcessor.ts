export interface ProcessedImageResult {
  originalUrl: string;
  thumbnailUrl: string;
  dimensions: { width: number; height: number };
  fileSizeBytes: number;
  mimeType: string;
}

export const processImageFile = async (
  file: File,
  maxOriginalDim = 1920,
  maxThumbDim = 160
): Promise<ProcessedImageResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const originalDims = { width: img.width, height: img.height };

          // 1. Generate High-Res Image (Original)
          let origW = img.width;
          let origH = img.height;

          if (origW > maxOriginalDim || origH > maxOriginalDim) {
            if (origW > origH) {
              origH = Math.round((origH * maxOriginalDim) / origW);
              origW = maxOriginalDim;
            } else {
              origW = Math.round((origW * maxOriginalDim) / origH);
              origH = maxOriginalDim;
            }
          }

          const canvasOrig = document.createElement("canvas");
          canvasOrig.width = origW;
          canvasOrig.height = origH;
          const ctxOrig = canvasOrig.getContext("2d");
          if (!ctxOrig) throw new Error("Não foi possível criar contexto 2D");
          ctxOrig.imageSmoothingEnabled = true;
          ctxOrig.imageSmoothingQuality = "high";
          ctxOrig.drawImage(img, 0, 0, origW, origH);

          // Try WebP first for optimal compression & crisp details
          let originalUrl = canvasOrig.toDataURL("image/webp", 0.9);
          if (!originalUrl.startsWith("data:image/webp")) {
            originalUrl = canvasOrig.toDataURL("image/jpeg", 0.88);
          }

          // 2. Generate Low-Res Thumbnail (Mini)
          let thumbW = img.width;
          let thumbH = img.height;
          if (thumbW > maxThumbDim || thumbH > maxThumbDim) {
            if (thumbW > thumbH) {
              thumbH = Math.round((thumbH * maxThumbDim) / thumbW);
              thumbW = maxThumbDim;
            } else {
              thumbW = Math.round((thumbW * maxThumbDim) / thumbH);
              thumbH = maxThumbDim;
            }
          }

          const canvasThumb = document.createElement("canvas");
          canvasThumb.width = thumbW;
          canvasThumb.height = thumbH;
          const ctxThumb = canvasThumb.getContext("2d");
          if (ctxThumb) {
            ctxThumb.imageSmoothingEnabled = true;
            ctxThumb.imageSmoothingQuality = "medium";
            ctxThumb.drawImage(img, 0, 0, thumbW, thumbH);
          }

          let thumbnailUrl = canvasThumb.toDataURL("image/webp", 0.75);
          if (!thumbnailUrl.startsWith("data:image/webp")) {
            thumbnailUrl = canvasThumb.toDataURL("image/jpeg", 0.7);
          }

          // Estimate bytes based on base64 string
          const approxBytes = Math.round((originalUrl.length * 3) / 4);

          resolve({
            originalUrl,
            thumbnailUrl,
            dimensions: originalDims,
            fileSizeBytes: approxBytes,
            mimeType: "image/webp",
          });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error("Falha ao carregar imagem para processamento."));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error("Falha ao ler arquivo do disco."));
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};
