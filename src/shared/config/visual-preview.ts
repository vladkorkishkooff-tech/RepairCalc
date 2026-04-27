import type { PackageType, VisualPresetType } from '../contracts/estimate'

type VisualPresetMeta = {
  label: string
  description: string
  note: string
}

type RoomPreviewAsset = {
  src: string
}

const visualPresetMeta: Record<VisualPresetType, VisualPresetMeta> = {
  light_minimal: {
    label: 'Светлый минимал',
    description: 'Белая база, чистый силуэт мебели и спокойная светлая подача.',
    note: 'Универсальный светлый интерьер.',
  },
  warm_natural: {
    label: 'Теплый натурал',
    description: 'Теплое дерево, мягкие оттенки и более домашнее ощущение.',
    note: 'Мягкий интерьер с теплой подачей.',
  },
  graphite_modern: {
    label: 'Графит modern',
    description: 'Более контрастная мебель, темные акценты и современный ритм.',
    note: 'Более выразительный премиальный тон.',
  },
}

const previewScenes: Record<PackageType, Record<VisualPresetType, RoomPreviewAsset>> = {
  cosmetic: {
    light_minimal: {
      src: '/room-preview/cosmetic.png',
    },
    warm_natural: {
      src: '/room-preview/capital.png',
    },
    graphite_modern: {
      src: '/room-preview/designer.png',
    },
  },
  capital: {
    light_minimal: {
      src: '/room-preview/capital.png',
    },
    warm_natural: {
      src: '/room-preview/capital.png',
    },
    graphite_modern: {
      src: '/room-preview/designer.png',
    },
  },
  designer: {
    light_minimal: {
      src: '/room-preview/capital.png',
    },
    warm_natural: {
      src: '/room-preview/designer.png',
    },
    graphite_modern: {
      src: '/room-preview/designer.png',
    },
  },
}

export const visualPresetOptions = (
  Object.entries(visualPresetMeta) as [VisualPresetType, VisualPresetMeta][]
).map(([value, meta]) => ({
  value,
  ...meta,
}))

export const roomPreviewAssets = {
  roomLabel: 'Demo-гостиная',
  scenes: previewScenes,
  bathroom: {
    src: '/room-preview/bathroom.png',
  },
}

export function getVisualPresetLabel(preset: VisualPresetType) {
  return visualPresetMeta[preset].label
}

export function getVisualPresetDescription(preset: VisualPresetType) {
  return visualPresetMeta[preset].description
}
