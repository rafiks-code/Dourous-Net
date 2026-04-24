export const LEVELS = ['1AS', '2AS', '3AS'] as const
export type Level = typeof LEVELS[number]

export const FILIERES = [
  'Scientifique',
  'Lettres & Langues',
  'Gestion & Économie',
] as const
export type Filiere = typeof FILIERES[number]

export const MODULES_BY_LEVEL_FILIERE: Record<Level, Record<Filiere, string[]>> = {
  '1AS': {
    'Scientifique': ['Mathématiques', 'Physique', 'SVT', 'Français', 'Arabe', 'Anglais', 'Histoire-Géo', 'Informatique'],
    'Lettres & Langues': ['Arabe', 'Français', 'Anglais', 'Histoire-Géo', 'Philosophie', 'Mathématiques'],
    'Gestion & Économie': ['Mathématiques', 'Économie', 'Comptabilité', 'Français', 'Arabe', 'Anglais'],
  },
  '2AS': {
    'Scientifique': ['Mathématiques', 'Physique', 'SVT', 'Chimie', 'Français', 'Arabe', 'Anglais'],
    'Lettres & Langues': ['Arabe', 'Français', 'Anglais', 'Histoire-Géo', 'Philosophie', 'Littérature'],
    'Gestion & Économie': ['Mathématiques', 'Économie', 'Comptabilité', 'Droit', 'Français', 'Anglais'],
  },
  '3AS': {
    'Scientifique': ['Mathématiques', 'Physique', 'SVT', 'Chimie', 'Français', 'Arabe', 'Anglais', 'Philosophie'],
    'Lettres & Langues': ['Arabe', 'Français', 'Anglais', 'Espagnol', 'Philosophie', 'Histoire-Géo'],
    'Gestion & Économie': ['Mathématiques', 'Économie', 'Comptabilité', 'Droit', 'Français', 'Arabe'],
  },
}

export const MODULE_ICONS: Record<string, string> = {
  'Mathématiques': '📐',
  'Physique': '⚛️',
  'SVT': '🌿',
  'Chimie': '🧪',
  'Français': '📖',
  'Arabe': '📜',
  'Anglais': '🇬🇧',
  'Espagnol': '🇪🇸',
  'Histoire-Géo': '🗺️',
  'Philosophie': '💭',
  'Informatique': '💻',
  'Économie': '📊',
  'Comptabilité': '🧾',
  'Droit': '⚖️',
  'Littérature': '📚',
}

export const STORAGE_KEYS = {
  LANGUAGE: 'dourous_language',
  LEVEL: 'dourous_level',
  FILIERE: 'dourous_filiere',
} as const

export const LANGUAGES = {
  fr: 'Français',
  ar: 'العربية',
} as const
