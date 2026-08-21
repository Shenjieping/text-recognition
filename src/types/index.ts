export type FileType = 'image' | 'pdf'

export type LanguageOption = 'chi_sim+eng' | 'chi_sim' | 'eng'

export interface PageResult {
  page: number
  text: string
  source: 'text' | 'ocr'
}

export interface RecognitionData {
  type: FileType
  pages: PageResult[]
  totalPages: number
}

export interface OCRProgress {
  status: string
  progress: number
}

export const LANGUAGE_LABELS: Record<LanguageOption, string> = {
  'chi_sim+eng': '中文 + 英文',
  chi_sim: '纯中文',
  eng: '纯英文',
}
