export interface PhotoEditorParams {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  warmth?: number;
  tint?: number;
  gamma?: number;
  highlights?: number;
  shadows?: number;
  grayscale?: number;
  sepia?: number;
}

export interface Preset {
  name: string;
  description: string;
  params: PhotoEditorParams;
}

export interface PhotoEditorState {
  hoveredPreset: Preset | null;
  isComparing: boolean;
  isProcessing: boolean;
  showOriginal: boolean;
  activePreset: string | null;
  originalImage: string | null;
  selectedImage: string | null;
  customText: string;
  customError: string | null;
}
