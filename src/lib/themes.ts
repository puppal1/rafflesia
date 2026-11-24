// created: 2026-11-24T11:45:00-08:00 — 12 pastel theme packs for hourly rotation

export type ThemeId =
  | 'sky-mint'
  | 'peach-cream'
  | 'lemon-sage'
  | 'rose-mist'
  | 'seafoam'
  | 'apricot-sky'
  | 'lilac-haze'
  | 'coral-foam'
  | 'powder-blue'
  | 'honeydew'
  | 'blush-teal'
  | 'lavender-sand'

export type ThemeDef = {
  // created: 2026-11-24T11:45:00-08:00
  id: ThemeId
  name: string
  washTop: string
  washMid: string
  washEdge: string
  text: string
  muted: string
  cardBg: string
  cardBorder: string
  btnPrimary: string
  btnPrimaryEnd: string
  btnGhostBg: string
  btnGhostBorder: string
  btnGhostText: string
  accent: string
  inputBorder: string
  swatch: [string, string, string]
}

/** created: 2026-11-24T11:45:00-08:00 — pastel set, no dark navy */
export const THEMES: ThemeDef[] = [
  {
    id: 'sky-mint',
    name: 'Sky Mint',
    washTop: '#d9f3ff',
    washMid: '#c8ebf8',
    washEdge: '#b7f0e2',
    text: '#1f4a5c',
    muted: '#4d7382',
    cardBg: '#f4fcff',
    cardBorder: '#8fd4ea',
    btnPrimary: '#3db8d9',
    btnPrimaryEnd: '#2aa897',
    btnGhostBg: '#dffaf3',
    btnGhostBorder: '#7ad9c4',
    btnGhostText: '#1a6b5c',
    accent: '#2aa897',
    inputBorder: '#9adceb',
    swatch: ['#d9f3ff', '#3db8d9', '#b7f0e2'],
  },
  {
    id: 'peach-cream',
    name: 'Peach Cream',
    washTop: '#ffe8d6',
    washMid: '#ffd9c2',
    washEdge: '#ffe9f0',
    text: '#5c2f28',
    muted: '#8a5a52',
    cardBg: '#fff8f2',
    cardBorder: '#f0b89a',
    btnPrimary: '#f08a5a',
    btnPrimaryEnd: '#e86b8a',
    btnGhostBg: '#ffe9f0',
    btnGhostBorder: '#f0a0b8',
    btnGhostText: '#8a3a55',
    accent: '#e86b8a',
    inputBorder: '#f0c0a8',
    swatch: ['#ffe8d6', '#f08a5a', '#ffe9f0'],
  },
  {
    id: 'lemon-sage',
    name: 'Lemon Sage',
    washTop: '#fff6c8',
    washMid: '#eaf5c8',
    washEdge: '#d4efd4',
    text: '#3a4a28',
    muted: '#62704a',
    cardBg: '#fffcf0',
    cardBorder: '#c8d98a',
    btnPrimary: '#9cbc3c',
    btnPrimaryEnd: '#6aaa78',
    btnGhostBg: '#eaf8ea',
    btnGhostBorder: '#98d0a0',
    btnGhostText: '#2f6a40',
    accent: '#6aaa78',
    inputBorder: '#d0dc98',
    swatch: ['#fff6c8', '#9cbc3c', '#d4efd4'],
  },
  {
    id: 'rose-mist',
    name: 'Rose Mist',
    washTop: '#ffe4ec',
    washMid: '#f8d4e4',
    washEdge: '#e8d4f8',
    text: '#5a2a48',
    muted: '#865a72',
    cardBg: '#fff5f8',
    cardBorder: '#e8a8c0',
    btnPrimary: '#e878a0',
    btnPrimaryEnd: '#b878d0',
    btnGhostBg: '#f5e8ff',
    btnGhostBorder: '#d0a8e8',
    btnGhostText: '#6a3a88',
    accent: '#b878d0',
    inputBorder: '#e8b8cc',
    swatch: ['#ffe4ec', '#e878a0', '#e8d4f8'],
  },
  {
    id: 'seafoam',
    name: 'Seafoam',
    washTop: '#d8f8f0',
    washMid: '#c4f0e8',
    washEdge: '#c8e8f8',
    text: '#1e4a48',
    muted: '#4a7470',
    cardBg: '#f2fffb',
    cardBorder: '#88d4c8',
    btnPrimary: '#3cbcb0',
    btnPrimaryEnd: '#4a9fd0',
    btnGhostBg: '#e4f4ff',
    btnGhostBorder: '#90c8e8',
    btnGhostText: '#2a5a7a',
    accent: '#4a9fd0',
    inputBorder: '#98dccf',
    swatch: ['#d8f8f0', '#3cbcb0', '#c8e8f8'],
  },
  {
    id: 'apricot-sky',
    name: 'Apricot Sky',
    washTop: '#ffe6c8',
    washMid: '#ffd8b0',
    washEdge: '#d0e8ff',
    text: '#4a3420',
    muted: '#7a5a40',
    cardBg: '#fff9f0',
    cardBorder: '#f0c090',
    btnPrimary: '#f0a050',
    btnPrimaryEnd: '#6898d8',
    btnGhostBg: '#e8f2ff',
    btnGhostBorder: '#a0c0e8',
    btnGhostText: '#2e5080',
    accent: '#6898d8',
    inputBorder: '#f0c8a0',
    swatch: ['#ffe6c8', '#f0a050', '#d0e8ff'],
  },
  {
    id: 'lilac-haze',
    name: 'Lilac Haze',
    washTop: '#eee4ff',
    washMid: '#e0d4f8',
    washEdge: '#f8e0f0',
    text: '#3e2a58',
    muted: '#6a5880',
    cardBg: '#faf6ff',
    cardBorder: '#c8b0e8',
    btnPrimary: '#a888d8',
    btnPrimaryEnd: '#d888b8',
    btnGhostBg: '#ffe8f4',
    btnGhostBorder: '#e8a8c8',
    btnGhostText: '#7a3860',
    accent: '#d888b8',
    inputBorder: '#d0bce8',
    swatch: ['#eee4ff', '#a888d8', '#f8e0f0'],
  },
  {
    id: 'coral-foam',
    name: 'Coral Foam',
    washTop: '#ffe0d8',
    washMid: '#ffd0c8',
    washEdge: '#d8f4ec',
    text: '#5c2828',
    muted: '#8a5850',
    cardBg: '#fff6f4',
    cardBorder: '#f0a898',
    btnPrimary: '#f07868',
    btnPrimaryEnd: '#48b8a0',
    btnGhostBg: '#e4f8f2',
    btnGhostBorder: '#88d4c0',
    btnGhostText: '#1e6a58',
    accent: '#48b8a0',
    inputBorder: '#f0b8ac',
    swatch: ['#ffe0d8', '#f07868', '#d8f4ec'],
  },
  {
    id: 'powder-blue',
    name: 'Powder Blue',
    washTop: '#e0ecff',
    washMid: '#d0e0f8',
    washEdge: '#e8e0ff',
    text: '#2a3a68',
    muted: '#586890',
    cardBg: '#f6f9ff',
    cardBorder: '#a8bce8',
    btnPrimary: '#6a90e0',
    btnPrimaryEnd: '#9080d8',
    btnGhostBg: '#f0ecff',
    btnGhostBorder: '#c0b0e8',
    btnGhostText: '#4a3a88',
    accent: '#9080d8',
    inputBorder: '#b8c8e8',
    swatch: ['#e0ecff', '#6a90e0', '#e8e0ff'],
  },
  {
    id: 'honeydew',
    name: 'Honeydew',
    washTop: '#e8f8d8',
    washMid: '#d8f0c8',
    washEdge: '#fff4c8',
    text: '#2e4820',
    muted: '#5a7450',
    cardBg: '#f8fff2',
    cardBorder: '#b0d890',
    btnPrimary: '#78b848',
    btnPrimaryEnd: '#e0b040',
    btnGhostBg: '#fff8e0',
    btnGhostBorder: '#e8d080',
    btnGhostText: '#6a5820',
    accent: '#e0b040',
    inputBorder: '#c0dc98',
    swatch: ['#e8f8d8', '#78b848', '#fff4c8'],
  },
  {
    id: 'blush-teal',
    name: 'Blush Teal',
    washTop: '#ffe8f0',
    washMid: '#f8d8e4',
    washEdge: '#d0f0f0',
    text: '#4a2a3a',
    muted: '#7a5868',
    cardBg: '#fff6fa',
    cardBorder: '#e8a8c0',
    btnPrimary: '#e07098',
    btnPrimaryEnd: '#30b0b0',
    btnGhostBg: '#e0f8f8',
    btnGhostBorder: '#80d0d0',
    btnGhostText: '#1e6868',
    accent: '#30b0b0',
    inputBorder: '#e8b8cc',
    swatch: ['#ffe8f0', '#e07098', '#d0f0f0'],
  },
  {
    id: 'lavender-sand',
    name: 'Lavender Sand',
    washTop: '#ebe4f8',
    washMid: '#e0d8f0',
    washEdge: '#f8ecd8',
    text: '#3a3050',
    muted: '#686078',
    cardBg: '#faf8ff',
    cardBorder: '#c8bce0',
    btnPrimary: '#9888c8',
    btnPrimaryEnd: '#d8a878',
    btnGhostBg: '#fff4e4',
    btnGhostBorder: '#e8c898',
    btnGhostText: '#6a5028',
    accent: '#d8a878',
    inputBorder: '#d0c4e4',
    swatch: ['#ebe4f8', '#9888c8', '#f8ecd8'],
  },
]

/** created: 2026-11-24T11:45:00-08:00 */
export function themeById(id: string | null | undefined): ThemeDef {
  return THEMES.find((t) => t.id === id) || THEMES[0]
}
