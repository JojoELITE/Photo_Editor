"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ImagePlus, Download, RotateCcw, Info } from "lucide-react";
import Image from "next/image";

type SkinSettings = {
  enabled: boolean;
  smoothness: number;
  brightness: number;
  redness: number;
  uniformity: number;
  blur: number;
  threshold: number;
};

type AdjustmentLog = {
  name: string;
  value: number;
  unit: string;
}[];

export default function SkinCorrectionTool() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [skinSettings, setSkinSettings] = useState<SkinSettings>({
    enabled: true,
    smoothness: 0,
    brightness: 0,
    redness: 0,
    uniformity: 0,
    blur: 10,
    threshold: 0.3,
  });
  const [adjustmentLog, setAdjustmentLog] = useState<AdjustmentLog>([]);
  const [showLog, setShowLog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Détection de peau améliorée
  const isSkinPixel = (r: number, g: number, b: number): boolean => {
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 + (-0.168736 * r - 0.331264 * g + 0.5 * b);
    const cr = 128 + (0.5 * r - 0.418688 * g - 0.081312 * b);

    return (
      y > 80 && y < 220 &&
      cb > 85 && cb < 135 &&
      cr > 135 && cr < 180 &&
      r > g && r > b &&
      Math.abs(r - g) > 15
    );
  };

  // Traitement principal avec suivi des modifications
  const processSkin = useCallback(async () => {
    if (!originalImage || !canvasRef.current) return;

    setIsProcessing(true);
    const newAdjustmentLog: AdjustmentLog = [];

    try {
      const img = new window.Image();
      img.src = originalImage;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      // Enregistrer les réglages appliqués
      if (skinSettings.smoothness > 0) {
        newAdjustmentLog.push({
          name: "Lissage de peau",
          value: skinSettings.smoothness,
          unit: "%"
        });
      }

      if (skinSettings.brightness !== 0) {
        newAdjustmentLog.push({
          name: skinSettings.brightness > 0 ? "Éclaircissement" : "Assombrissement",
          value: Math.abs(skinSettings.brightness),
          unit: "%"
        });
      }

      if (skinSettings.redness > 0) {
        newAdjustmentLog.push({
          name: "Réduction rougeurs",
          value: skinSettings.redness,
          unit: "%"
        });
      }

      if (skinSettings.uniformity > 0) {
        newAdjustmentLog.push({
          name: "Uniformité du teint",
          value: skinSettings.uniformity,
          unit: "%"
        });
      }

      // Masque de peau
      const mask = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          mask[y * width + x] = isSkinPixel(data[i], data[i + 1], data[i + 2]) ? 255 : 0;
        }
      }

      // Application des effets
      if (skinSettings.enabled) {
        const blurRadius = skinSettings.blur;
        if (blurRadius > 0) {
          const blurredMask = new Uint8Array(width * height);

          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              let sum = 0, count = 0;

              for (let dy = -blurRadius; dy <= blurRadius; dy++) {
                for (let dx = -blurRadius; dx <= blurRadius; dx++) {
                  const nx = x + dx, ny = y + dy;
                  if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    sum += mask[ny * width + nx];
                    count++;
                  }
                }
              }

              blurredMask[y * width + x] = sum / count;
            }
          }

          // Application des corrections
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const i = (y * width + x) * 4;
              const maskValue = blurredMask[y * width + x] / 255;

              if (maskValue > skinSettings.threshold) {
                let [r, g, b] = [data[i], data[i + 1], data[i + 2]];

                // Éclaircissement
                if (skinSettings.brightness !== 0) {
                  const factor = 1 + skinSettings.brightness / 100;
                  r = Math.min(255, r * factor);
                  g = Math.min(255, g * factor);
                  b = Math.min(255, b * factor);
                }

                // Réduction rougeurs
                if (skinSettings.redness > 0) {
                  const reduction = skinSettings.redness / 100 * maskValue;
                  r = r * (1 - reduction);
                }

                // Lissage
                if (skinSettings.smoothness > 0) {
                  const smoothRadius = Math.floor(skinSettings.smoothness / 20);
                  if (smoothRadius > 0) {
                    let [sr, sg, sb] = [0, 0, 0];
                    let count = 0;

                    for (let dy = -smoothRadius; dy <= smoothRadius; dy++) {
                      for (let dx = -smoothRadius; dx <= smoothRadius; dx++) {
                        const nx = x + dx, ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                          const ni = (ny * width + nx) * 4;
                          sr += data[ni];
                          sg += data[ni + 1];
                          sb += data[ni + 2];
                          count++;
                        }
                      }
                    }

                    const blend = 0.3 * (skinSettings.smoothness / 100);
                    r = r * (1 - blend) + (sr / count) * blend;
                    g = g * (1 - blend) + (sg / count) * blend;
                    b = b * (1 - blend) + (sb / count) * blend;
                  }
                }

                // Application finale
                const strength = (maskValue - skinSettings.threshold) / (1 - skinSettings.threshold);
                if (strength > 0) {
                  data[i] = data[i] * (1 - strength) + r * strength;
                  data[i + 1] = data[i + 1] * (1 - strength) + g * strength;
                  data[i + 2] = data[i + 2] * (1 - strength) + b * strength;
                }
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      setProcessedImage(canvas.toDataURL('image/jpeg', 0.9));
      setAdjustmentLog(newAdjustmentLog);
    } catch (error) {
      console.error("Erreur de traitement:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [originalImage, skinSettings]);

  // Gestion des images
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setOriginalImage(imageUrl);
        setProcessedImage(imageUrl);
        setAdjustmentLog([]);
      };
      reader.readAsDataURL(file);
    }
  };

  // Réinitialisation
  const resetImage = () => {
    setProcessedImage(originalImage);
    setSkinSettings({
      enabled: true,
      smoothness: 0,
      brightness: 0,
      redness: 0,
      uniformity: 0,
      blur: 10,
      threshold: 0.3,
    });
    setAdjustmentLog([]);
  };

  // Téléchargement dans différents formats
  const downloadImageInFormat = (format: string) => {
    if (!processedImage || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const link = document.createElement("a");
    const timestamp = Date.now();
    
    switch(format) {
      case 'png':
        link.download = `peau-retouchee-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        break;
      case 'webp':
        link.download = `peau-retouchee-${timestamp}.webp`;
        link.href = canvas.toDataURL('image/webp', 0.9);
        break;
      case 'jpeg-high':
        link.download = `peau-retouchee-${timestamp}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.92);
        break;
      case 'jpeg-medium':
        link.download = `peau-retouchee-${timestamp}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.8);
        break;
      case 'original':
      default:
        link.download = `peau-retouchee-${timestamp}.jpg`;
        link.href = processedImage;
    }
    
    link.click();
  };

  // Afficher le menu de téléchargement
  const showDownloadMenu = () => {
    if (!processedImage) return;

    // Créer le menu modal
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 class="text-lg font-semibold mb-4">Choisir le format de téléchargement</h3>
        <div class="space-y-3">
          <button 
            class="download-option w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            data-format="png"
          >
            PNG (Qualité maximale, sans perte)
          </button>
          <button 
            class="download-option w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            data-format="jpeg-high"
          >
            JPEG Haute qualité (92%)
          </button>
          <button 
            class="download-option w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            data-format="jpeg-medium"
          >
            JPEG Qualité moyenne (80%)
          </button>
          <button 
            class="download-option w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            data-format="webp"
          >
            WebP (Bonne qualité, taille réduite)
          </button>
          <button 
            class="download-option w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            data-format="original"
          >
            Format original
          </button>
          <button 
            class="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition close-menu"
          >
            Annuler
          </button>
        </div>
      </div>
    `;

    // Ajouter des écouteurs d'événements
    modal.querySelectorAll('.download-option').forEach(button => {
      button.addEventListener('click', (e) => {
        const format = (e.currentTarget as HTMLElement).dataset.format;
        if (format) {
          downloadImageInFormat(format);
        }
        modal.remove();
      });
    });

    modal.querySelector('.close-menu')?.addEventListener('click', () => {
      modal.remove();
    });

    // Ajouter le modal au document
    document.body.appendChild(modal);
  };

  // Application automatique des modifications
  useEffect(() => {
    if (originalImage && skinSettings.enabled) {
      processSkin();
    }
  }, [skinSettings, originalImage, processSkin]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Correcteur de Teint Professionnel
          </h1>
          <p className="text-gray-600">
            Visualisez toutes les retouches appliquées à votre image
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Aperçu */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
              <h2 className="font-semibold">Aperçu</h2>
              <button
                onClick={() => setShowLog(!showLog)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <Info className="w-4 h-4" />
                {showLog ? 'Masquer les détails' : 'Voir les retouches'}
              </button>
            </div>
            <div className="relative">
              {processedImage ? (
                <>
                  <div className="grid grid-cols-2 gap-0">
                    <div className="relative border-r">
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Original
                      </div>
                      <div className="relative w-full h-full aspect-square">
                        <Image
                          src={originalImage || ""}
                          alt="Original"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                    <div className="relative">
                      <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                        Retouché
                      </div>
                      <div className="relative w-full h-full aspect-square">
                        <Image
                          src={processedImage}
                          alt="Retouché"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetImage}
                      disabled={isProcessing}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Réinitialiser
                    </Button>
                    <Button
                      onClick={showDownloadMenu}
                      disabled={isProcessing || !processedImage}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger
                    </Button>
                  </div>

                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-100 text-gray-500">
                  <ImagePlus className="w-12 h-12 mb-4" />
                  <p>Aucune image sélectionnée</p>
                  <Button
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Importer une photo
                  </Button>
                </div>
              )}
            </div>
          </div>
          {showLog && adjustmentLog.length > 0 && (
            <div className="absolute bottom-0 left-4 right-4 bg-white/90 p-4 rounded-lg shadow-lg">
              <div className="font-medium mb-2 text-center text-2xl">Retouches appliquées:</div>
              <ul className="space-y-1 ">
                {adjustmentLog.map((adjustment, index) => (
                  <li key={index} className="flex justify-center gap-x-32">
                    <span>{adjustment.name}:</span>
                    <span className="font-medium">
                      {adjustment.value > 0 ? '+' : ''}
                      {adjustment.value}
                      {adjustment.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contrôles */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="p-4 bg-gray-100 border-b">
              <h2 className="font-semibold">Réglages de teint</h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <label className="font-medium">Activer la correction</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={skinSettings.enabled}
                    onChange={(e) =>
                      setSkinSettings({
                        ...skinSettings,
                        enabled: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {skinSettings.enabled && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <label>Lissage de peau</label>
                      <span>{skinSettings.smoothness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skinSettings.smoothness}
                      onChange={(e) =>
                        setSkinSettings({
                          ...skinSettings,
                          smoothness: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Réduit les pores et imperfections
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label>Éclat</label>
                      <span>
                        {skinSettings.brightness > 0 ? '+' : ''}
                        {skinSettings.brightness}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={skinSettings.brightness}
                      onChange={(e) =>
                        setSkinSettings({
                          ...skinSettings,
                          brightness: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {skinSettings.brightness > 0
                        ? 'Éclaircit le teint'
                        : skinSettings.brightness < 0
                          ? 'Assombrit légèrement'
                          : 'Neutre'}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label>Réduction rougeurs</label>
                      <span>{skinSettings.redness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={skinSettings.redness}
                      onChange={(e) =>
                        setSkinSettings({
                          ...skinSettings,
                          redness: parseInt(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Atténue les rougeurs et irritations
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-3">Paramètres avancés</h3>
                    <div>
                      <div className="flex justify-between mb-1">
                        <label>Précision détection peau</label>
                        <span>{skinSettings.threshold.toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="0.9"
                        step="0.05"
                        value={skinSettings.threshold}
                        onChange={(e) =>
                          setSkinSettings({
                            ...skinSettings,
                            threshold: parseFloat(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ajuste la sensibilité de détection (plus élevé = sélection plus restrictive)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-4 h-4 mr-2" />
                {originalImage ? "Changer d'image" : "Importer une photo"}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}