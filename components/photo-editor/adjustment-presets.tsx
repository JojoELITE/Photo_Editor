"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Preset = {
  name: string;
  description: string;
  params: Record<string, number>;
};

export const PRESETS: Preset[] = [
  {
    name: "Lumineux & doux",
    description: "Luminosité accrue, contraste doux, tons chauds.",
    params: { brightness: 20, contrast: -10, warmth: 10 },
  },
  {
    name: "Couleurs vives",
    description: "Saturation et contraste renforcés pour un impact maximal.",
    params: { saturation: 25, contrast: 10 },
  },
  {
    name: "Noir & blanc équilibré",
    description: "Conversion N&B classique avec un contraste naturel.",
    params: { grayscale: 1, contrast: 5 },
  },
  {
    name: "Sépia Classique",
    description: "Effet vieilli chaleureux avec une teinte sépia subtile.",
    params: { sepia: 0.8, warmth: 8, contrast: -5, brightness: 5 },
  },
  {
    name: "Contraste Artistique",
    description: "Look dramatique, ombres intenses, hautes lumières percutantes.",
    params: { contrast: 25, brightness: -5, saturation: 5 },
  },
  {
    name: "Pastel Doux",
    description: "Couleurs désaturées et lumineuses pour une ambiance éthérée.",
    params: { saturation: -20, brightness: 10, warmth: 5, contrast: -5 },
  },
  {
    name: "Portrait Subtil",
    description: "Netteté douce, légère chaleur, sublime le teint naturel.",
    params: { brightness: 5, contrast: 5, warmth: 3, saturation: 3 },
  },
  {
    name: "Paysage Vibrant",
    description: "Contraste et saturation accrus pour des paysages riches et profonds.",
    params: { contrast: 15, saturation: 12, brightness: 3 },
  },
  {
    name: "Look Cinéma Froid",
    description: "Ambiance cinématographique avec teintes bleutées et contraste marqué.",
    params: { warmth: -12, contrast: 12, saturation: -8, brightness: -3 },
  },
  {
    name: "Produit Éclatant",
    description: "Haute luminosité et contraste pour des détails nets et précis.",
    params: { brightness: 12, contrast: 18, saturation: 5 },
  },
  {
    name: "HDR Dynamique",
    description: "Simule un effet HDR avec détails accentués et couleurs riches.",
    params: { contrast: 20, saturation: 15, brightness: 5 },
  },
  {
    name: "Vintage Années 70",
    description: "Teintes chaudes délavées, faible contraste, look rétro authentique.",
    params: { warmth: 15, saturation: -15, contrast: -10, brightness: 5, sepia: 0.1 },
  },
  {
    name: "Urbain Sombre & Grinçant",
    description: "Fort contraste, désaturation partielle, ambiance urbaine intense.",
    params: { contrast: 22, saturation: -25, brightness: -5, warmth: -5 },
  },
  {
    name: "Rêve Éthéré",
    description: "Très lumineux, faible contraste, couleurs douces, effet onirique.",
    params: { brightness: 25, contrast: -15, saturation: -10, warmth: 8 },
  },
  {
    name: "Photo Culinaire Pro",
    description: "Lumineux, couleurs appétissantes, contraste léger pour la nourriture.",
    params: { brightness: 15, saturation: 10, warmth: 5, contrast: 8 },
  },
  {
    name: "Architecture Moderne",
    description: "Lignes nettes, contraste élevé, souvent avec une légère désaturation.",
    params: { contrast: 18, saturation: -10, brightness: 2, warmth: -3 },
  },
  {
    name: "N&B Haut Contraste",
    description: "Noir et blanc percutant avec des noirs profonds et des blancs éclatants.",
    params: { grayscale: 1, contrast: 25, brightness: -3 },
  },
  {
    name: "Ambiance Dorée",
    description: "Lumière chaude et dorée, idéal pour les couchers de soleil ou intérieurs.",
    params: { warmth: 25, brightness: 8, contrast: 5, saturation: 5 },
  },
  {
    name: "Froid Polaire",
    description: "Teintes froides intenses, saturation réduite, effet glacial.",
    params: { warmth: -20, saturation: -15, brightness: 5, contrast: 8 },
  },
  {
    name: "Mat Clair & Aéré",
    description: "Look mat avec des ombres adoucies et une luminosité ambiante.",
    params: { contrast: -12, brightness: 10, saturation: -5 },
  }
];

interface AdjustmentPresetsProps {
  onApplyPreset: (params: Record<string, number>) => void;
  disabled?: boolean;
}

export function AdjustmentPresets({ onApplyPreset, disabled }: AdjustmentPresetsProps) {
  const [selectedPresetName, setSelectedPresetName] = useState<string | undefined>(PRESETS[0]?.name);

  const handleApply = () => {
    const selectedPreset = PRESETS.find(p => p.name === selectedPresetName);
    if (selectedPreset) {
      onApplyPreset(selectedPreset.params);
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow bg-white/50 backdrop-blur-sm w-full max-w-md mt-8">
      <h3 className="text-lg font-semibold mb-3 text-gray-700">Palettes d&apos;ajustements prédéfinis</h3>
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        <Select 
          value={selectedPresetName} 
          onValueChange={setSelectedPresetName} 
          disabled={disabled}
        >
          <SelectTrigger className="flex-grow">
            <SelectValue placeholder="Choisir une palette" />
          </SelectTrigger>
          <SelectContent>
            {PRESETS.map((preset) => (
              <SelectItem key={preset.name} value={preset.name}>
                {preset.name} - <span className="text-xs text-gray-500">{preset.description}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button 
          onClick={handleApply} 
          disabled={disabled || !selectedPresetName} 
          className="w-full sm:w-auto bg-green-500 hover:bg-green-600"
        >
          Appliquer les ajustements
        </Button>
      </div>
    </div>
  );
}