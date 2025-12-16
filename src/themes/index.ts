// Interior Design-Inspired Themes for Rick & Share-ah
// Based on 2025/2026 Interior Design Trends from Architectural Digest

export type ThemeId =
  | 'brutalist-cute'
  | 'color-drenched'
  | 'moody-palette'
  | 'livable-luxury'
  | 'vintage-soul'
  | 'dark-wood'
  | 'warmth-comfort'
  | 'biophilic';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  variables: {
    colorCream: string;
    colorCoral: string;
    colorSage: string;
    colorPlum: string;
    colorSunshine: string;
    colorSky: string;
    colorLavender: string;
  };
}

export const themes: ThemeDefinition[] = [
  {
    id: 'brutalist-cute',
    name: 'Brutalist Cute',
    description: 'Playful & bold with chunky borders',
    preview: {
      primary: '#FF6B6B',
      secondary: '#95D5B2',
      accent: '#FFE66D',
      background: '#FFF8F0',
    },
    variables: {
      colorCream: '#FFF8F0',
      colorCoral: '#FF6B6B',
      colorSage: '#95D5B2',
      colorPlum: '#5C374C',
      colorSunshine: '#FFE66D',
      colorSky: '#74C0FC',
      colorLavender: '#E4C1F9',
    },
  },
  {
    id: 'color-drenched',
    name: 'Color Drenched',
    description: 'Bold burgundy monochrome maximalism',
    preview: {
      primary: '#722F37',
      secondary: '#A45A52',
      accent: '#D4A574',
      background: '#FDF6F0',
    },
    variables: {
      colorCream: '#FDF6F0',
      colorCoral: '#722F37',
      colorSage: '#A45A52',
      colorPlum: '#4A1C24',
      colorSunshine: '#D4A574',
      colorSky: '#8B6969',
      colorLavender: '#C9A9A6',
    },
  },
  {
    id: 'moody-palette',
    name: 'Moody Palette',
    description: 'Aubergine, olive & ochre depth',
    preview: {
      primary: '#614051',
      secondary: '#606C38',
      accent: '#DDA15E',
      background: '#FEFAE0',
    },
    variables: {
      colorCream: '#FEFAE0',
      colorCoral: '#614051',
      colorSage: '#606C38',
      colorPlum: '#3D2B3D',
      colorSunshine: '#DDA15E',
      colorSky: '#BC6C25',
      colorLavender: '#9B7B8E',
    },
  },
  {
    id: 'livable-luxury',
    name: 'Livable Luxury',
    description: 'Timeless elegance meets comfort',
    preview: {
      primary: '#1E3A5F',
      secondary: '#C9A961',
      accent: '#E8D5B7',
      background: '#FAF9F6',
    },
    variables: {
      colorCream: '#FAF9F6',
      colorCoral: '#1E3A5F',
      colorSage: '#C9A961',
      colorPlum: '#2C3E50',
      colorSunshine: '#E8D5B7',
      colorSky: '#5D7B93',
      colorLavender: '#D5C4D7',
    },
  },
  {
    id: 'vintage-soul',
    name: 'Vintage Soul',
    description: 'Antique charm with aged patina',
    preview: {
      primary: '#B4838D',
      secondary: '#A68A64',
      accent: '#D4C5B9',
      background: '#F5F0EB',
    },
    variables: {
      colorCream: '#F5F0EB',
      colorCoral: '#B4838D',
      colorSage: '#A68A64',
      colorPlum: '#5C5552',
      colorSunshine: '#D4C5B9',
      colorSky: '#8E9AAF',
      colorLavender: '#C9B8C4',
    },
  },
  {
    id: 'dark-wood',
    name: 'Dark Wood',
    description: 'Rich walnut & mahogany warmth',
    preview: {
      primary: '#5C4033',
      secondary: '#8B5A2B',
      accent: '#D4A574',
      background: '#FBF7F4',
    },
    variables: {
      colorCream: '#FBF7F4',
      colorCoral: '#5C4033',
      colorSage: '#8B5A2B',
      colorPlum: '#3E2723',
      colorSunshine: '#D4A574',
      colorSky: '#6D4C41',
      colorLavender: '#BCAAA4',
    },
  },
  {
    id: 'warmth-comfort',
    name: 'Warmth & Comfort',
    description: 'Terracotta earth tones & soft edges',
    preview: {
      primary: '#C2704E',
      secondary: '#D4B896',
      accent: '#E8DCC4',
      background: '#FDF8F3',
    },
    variables: {
      colorCream: '#FDF8F3',
      colorCoral: '#C2704E',
      colorSage: '#D4B896',
      colorPlum: '#6B4D3A',
      colorSunshine: '#E8DCC4',
      colorSky: '#A67C52',
      colorLavender: '#D7C4B5',
    },
  },
  {
    id: 'biophilic',
    name: 'Biophilic',
    description: 'Natural greens & organic textures',
    preview: {
      primary: '#355E3B',
      secondary: '#7D8471',
      accent: '#C9B896',
      background: '#F7F9F4',
    },
    variables: {
      colorCream: '#F7F9F4',
      colorCoral: '#355E3B',
      colorSage: '#7D8471',
      colorPlum: '#2D3B2D',
      colorSunshine: '#C9B896',
      colorSky: '#5F7161',
      colorLavender: '#A8B5A0',
    },
  },
];

export const getThemeById = (id: ThemeId): ThemeDefinition | undefined => {
  return themes.find((theme) => theme.id === id);
};

export const DEFAULT_THEME: ThemeId = 'brutalist-cute';
