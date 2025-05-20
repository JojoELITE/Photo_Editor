import { useState, useRef, useCallback } from 'react';
import { PhotoEditorState, PhotoEditorParams, Preset } from '@/types/photo-editor';
import { processImage } from '@/lib/image-processing';
import { parseFrenchAdjustment } from '@/lib/text-parser';

export const usePhotoEditor = () => {
  const [state, setState] = useState<Omit<PhotoEditorState, 'fileInputRef'>>({
    hoveredPreset: null,
    isComparing: false,
    isProcessing: false,
    showOriginal: false,
    activePreset: null,
    originalImage: null,
    selectedImage: null,
    customText: "",
    customError: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateState = (updates: Partial<PhotoEditorState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const handleDownload = useCallback(() => {
    if (!state.selectedImage) return;
    
    const link = document.createElement('a');
    link.download = `photo-retouchee-${new Date().getTime()}.jpg`;
    link.href = state.selectedImage;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [state.selectedImage]);

  const handleReset = useCallback(() => {
    if (state.originalImage) {
      updateState({
        selectedImage: state.originalImage,
        activePreset: null,
        customText: "",
        customError: null,
      });
    }
  }, [state.originalImage]);

  const handleCustomAdjust = useCallback(() => {
    if (!state.customText.trim()) return;
    
    const params = parseFrenchAdjustment(state.customText);
    if (Object.keys(params).length === 0) {
      updateState({
        customError: "Ajustement non reconnu. Essayez des expressions comme 'augmenter légèrement la luminosité', 'réduire le bleu', etc."
      });
      return;
    }
    
    handleApplyPreset(params);
  }, [state.customText]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      updateState({
        originalImage: result,
        selectedImage: result,
        customText: "",
        customError: null,
        activePreset: null,
      });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleApplyPreset = useCallback((params: PhotoEditorParams, presetName?: string) => {
    if (!state.originalImage) return;
    
    updateState({
      isProcessing: true,
      activePreset: presetName || null,
      customError: null,
    });

    processImage(
      state.originalImage,
      params,
      (dataUrl) => {
        updateState({
          selectedImage: dataUrl,
          isProcessing: false,
        });
      }
    );
  }, [state.originalImage]);

  return {
    ...state,
    fileInputRef,
    handleDownload,
    handleReset,
    handleCustomAdjust,
    handleImportClick,
    handleFileChange,
    handleApplyPreset,
    setCustomText: (text: string) => updateState({ customText: text }),
    setHoveredPreset: (preset: Preset | null) => updateState({ hoveredPreset: preset }),
  };
};
