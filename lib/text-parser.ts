import { PhotoEditorParams } from '@/types/photo-editor';

export const parseFrenchAdjustment = (text: string): PhotoEditorParams => {
  const params: PhotoEditorParams = {};
  const lower = text.toLowerCase();

  // Helper function to get the intensity value
  const getIntensity = (text: string, positive = true) => {
    if (text.includes("légèrement")) return positive ? 10 : -10;
    if (text.includes("très")) return positive ? 40 : -40;
    if (text.includes("fortement")) return positive ? 25 : -25;
    return positive ? 20 : -20;
  };

  // Luminosité
  if (lower.includes("luminosité")) {
    if (lower.includes("augmenter")) {
      params.brightness = getIntensity(lower, true);
    } else if (lower.includes("réduire") || lower.includes("diminuer")) {
      params.brightness = getIntensity(lower, false);
    }
  }

  // Contraste
  if (lower.includes("contraste")) {
    if (lower.includes("augmenter") || lower.includes("plus fort")) {
      params.contrast = getIntensity(lower, true);
    } else if (lower.includes("réduire") || lower.includes("diminuer") || lower.includes("plus doux")) {
      params.contrast = getIntensity(lower, false);
    }
  }

  // Saturation
  if (lower.includes("saturation") || lower.includes("couleurs")) {
    if (lower.includes("augmenter") || lower.includes("plus vives")) {
      params.saturation = getIntensity(lower, true);
    } else if (lower.includes("réduire") || lower.includes("diminuer") || lower.includes("moins vives")) {
      params.saturation = getIntensity(lower, false);
    }
  }

  // Température/couleurs chaudes/froides
  if (lower.includes("température") || lower.includes("chaud") || lower.includes("froid") || lower.includes("bleu") || lower.includes("jaune")) {
    if (lower.includes("plus chaud") || lower.includes("augmenter la température") || lower.includes("jaune") || lower.includes("réduire le bleu")) {
      params.warmth = getIntensity(lower, true);
    } else if (lower.includes("plus froid") || lower.includes("augmenter le bleu") || lower.includes("réduire le jaune")) {
      params.warmth = getIntensity(lower, false);
    }
  }

  // Désaturation totale (noir & blanc)
  if (lower.includes("noir et blanc") || lower.includes("n&b") || lower.includes("désaturer totalement")) {
    params.grayscale = 1;
  }

  // Désaturation partielle
  if (lower.includes("désaturer") && !params.grayscale) {
    params.saturation = getIntensity(lower, false);
  }

  // Sepia
  if (lower.includes("sépia")) {
    if (lower.includes("léger")) params.sepia = 0.2;
    else if (lower.includes("très")) params.sepia = 0.8;
    else params.sepia = 0.5;
  }

  // Bleu/rouge/vert (teinte)
  if (lower.includes("réduire le bleu")) params.warmth = 15;
  if (lower.includes("réduire le rouge")) params.warmth = -15;
  if (lower.includes("réduire le vert")) params.tint = -10;
  if (lower.includes("augmenter le bleu")) params.warmth = -15;
  if (lower.includes("augmenter le rouge")) params.warmth = 15;
  if (lower.includes("augmenter le vert")) params.tint = 10;

  // Gamma
  if (lower.includes("gamma")) {
    if (lower.includes("augmenter")) params.gamma = 1.2;
    if (lower.includes("réduire") || lower.includes("diminuer")) params.gamma = 0.8;
  }

  // Highlights / shadows
  if (lower.includes("hautes lumières")) {
    if (lower.includes("augmenter")) params.highlights = 15;
    if (lower.includes("réduire") || lower.includes("diminuer")) params.highlights = -15;
  }
  if (lower.includes("ombres")) {
    if (lower.includes("augmenter")) params.shadows = 15;
    if (lower.includes("réduire") || lower.includes("diminuer")) params.shadows = -15;
  }

  return params;
};
