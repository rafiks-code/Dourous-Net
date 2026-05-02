export const LEVELS = ['1AS', '2AS', '3AS'] as const
export type Level = typeof LEVELS[number]

export const FILIERES = [
  'Scientifique',
  'Lettres',
  'Sciences Expérimentales',
  'Mathématiques',
  'Lettres et Philosophie',
  'Langues Étrangères',
  'Technique Mathématique',
  'Gestion et Économie'
] as const
export type Filiere = typeof FILIERES[number]

export const FILIERES_BY_LEVEL: Record<string, string[]> = {
  '1AS': ['Scientifique', 'Lettres'],
  '2AS': ['Sciences Expérimentales', 'Mathématiques', 
          'Lettres et Philosophie', 'Langues Étrangères'],
  '3AS': ['Sciences Expérimentales', 'Mathématiques', 
          'Technique Mathématique', 'Lettres et Philosophie', 
          'Langues Étrangères', 'Gestion et Économie']
}

export const MODULES_BY_LEVEL_FILIERE: Record<string, Record<string, string[]>> = {
  '1AS': {
    'Scientifique': [
      'Mathématiques', 'Sciences Physiques', 'Sciences Naturelles',
      'Français', 'Arabe', 'Anglais', 'Histoire-Géographie',
      'Éducation Islamique', 'Éducation Civique', 
      'Informatique', 'Éducation Physique'
    ],
    'Lettres': [
      'Langue Arabe', 'Langue Française', 'Langue Anglaise',
      'Histoire-Géographie', 'Philosophie', 'Éducation Islamique',
      'Éducation Civique', 'Mathématiques', 
      'Informatique', 'Éducation Physique'
    ]
  },
  '2AS': {
    'Sciences Expérimentales': [
      'Mathématiques', 'Sciences Physiques', 'Sciences Naturelles',
      'Français', 'Arabe', 'Anglais', 'Histoire-Géographie',
      'Éducation Islamique', 'Éducation Physique'
    ],
    'Mathématiques': [
      'Mathématiques', 'Sciences Physiques', 'Informatique',
      'Français', 'Arabe', 'Anglais', 'Histoire-Géographie',
      'Éducation Islamique', 'Éducation Physique'
    ],
    'Lettres et Philosophie': [
      'Langue Arabe', 'Langue Française', 'Langue Anglaise',
      'Philosophie', 'Histoire-Géographie', 'Éducation Islamique',
      'Éducation Civique', 'Mathématiques', 'Éducation Physique'
    ],
    'Langues Étrangères': [
      'Langue Française', 'Langue Anglaise', 'Langue Arabe',
      'Espagnol', 'Histoire-Géographie', 'Philosophie',
      'Éducation Islamique', 'Mathématiques', 'Éducation Physique'
    ]
  },
  '3AS': {
    'Sciences Expérimentales': [
      'Mathématiques', 'Sciences Physiques', 'Sciences Naturelles',
      'Français', 'Arabe', 'Anglais', 'Histoire-Géographie',
      'Philosophie', 'Éducation Islamique', 'Éducation Physique'
    ],
    'Mathématiques': [
      'Mathématiques', 'Sciences Physiques', 'Informatique',
      'Français', 'Arabe', 'Anglais', 'Philosophie',
      'Éducation Islamique', 'Éducation Physique'
    ],
    'Technique Mathématique': [
      'Mathématiques', 'Sciences Physiques', 'Technologie',
      'Dessin Technique', 'Français', 'Arabe', 'Anglais',
      'Philosophie', 'Éducation Islamique', 'Éducation Physique'
    ],
    'Lettres et Philosophie': [
      'Langue Arabe', 'Langue Française', 'Langue Anglaise',
      'Philosophie', 'Histoire-Géographie', 'Éducation Islamique',
      'Mathématiques', 'Éducation Physique'
    ],
    'Langues Étrangères': [
      'Langue Française', 'Langue Anglaise', 'Langue Arabe',
      'Espagnol', 'Philosophie', 'Histoire-Géographie',
      'Éducation Islamique', 'Mathématiques', 'Éducation Physique'
    ],
    'Gestion et Économie': [
      'Mathématiques', 'Économie et Gestion', 'Droit',
      'Histoire-Géographie', 'Français', 'Arabe', 'Anglais',
      'Comptabilité', 'Philosophie', 'Éducation Islamique',
      'Éducation Physique'
    ]
  }
}

export const MODULE_ICONS: Record<string, string> = {
  'Mathématiques': '📐',
  'Sciences Physiques': '⚗️',
  'Sciences Naturelles': '🌿',
  'Français': '🇫🇷',
  'Langue Française': '🇫🇷',
  'Arabe': '📖',
  'Langue Arabe': '📖',
  'Anglais': '🇬🇧',
  'Langue Anglaise': '🇬🇧',
  'Histoire-Géographie': '🗺️',
  'Éducation Islamique': '☪️',
  'Éducation Civique': '🏛️',
  'Informatique': '💻',
  'Éducation Physique': '⚽',
  'Philosophie': '🧠',
  'Espagnol': '🇪🇸',
  'Technologie': '⚙️',
  'Dessin Technique': '📏',
  'Économie et Gestion': '📊',
  'Droit': '⚖️',
  'Comptabilité': '🧾',
}

export const MODULE_ARABIC: Record<string, string> = {
  'Mathématiques': 'الرياضيات',
  'Sciences Physiques': 'العلوم الفيزيائية',
  'Sciences Naturelles': 'علوم الطبيعة والحياة',
  'Français': 'اللغة الفرنسية',
  'Langue Française': 'اللغة الفرنسية',
  'Arabe': 'اللغة العربية',
  'Langue Arabe': 'اللغة العربية',
  'Anglais': 'اللغة الإنجليزية',
  'Langue Anglaise': 'اللغة الإنجليزية',
  'Histoire-Géographie': 'التاريخ والجغرافيا',
  'Éducation Islamique': 'التربية الإسلامية',
  'Éducation Civique': 'التربية المدنية',
  'Informatique': 'الإعلام الآلي',
  'Éducation Physique': 'التربية البدنية',
  'Philosophie': 'الفلسفة',
  'Espagnol': 'اللغة الإسبانية',
  'Technologie': 'التكنولوجيا',
  'Dessin Technique': 'الرسم التقني',
  'Économie et Gestion': 'الاقتصاد والتسيير',
  'Droit': 'القانون',
  'Comptabilité': 'المحاسبة',
}

export const FILIERE_ARABIC: Record<string, string> = {
  'Scientifique': 'علوم',
  'Lettres': 'آداب',
  'Sciences Expérimentales': 'علوم تجريبية',
  'Mathématiques': 'رياضيات',
  'Technique Mathématique': 'تقني رياضي',
  'Lettres et Philosophie': 'آداب وفلسفة',
  'Langues Étrangères': 'لغات أجنبية',
  'Gestion et Économie': 'تسيير واقتصاد',
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
