import type { URLAnalysis } from '@/types/analysis'

export type MotifKey =
  | 'fish'
  | 'dinosaur'
  | 'coffee'
  | 'ai'
  | 'company'
  | 'museum'
  | 'nature'
  | 'travel'
  | 'education'
  | 'health'
  | 'abstract'

interface MotifEntry {
  key: MotifKey
  synonyms: string[]
}

const MOTIF_ENTRIES: MotifEntry[] = [
  {
    key: 'fish',
    synonyms: [
      'aquarium',
      'fish',
      'ocean',
      'marine',
      'sea',
      'aqua',
      'water',
      '水族館',
      'さかな',
      '魚',
      '海'
    ]
  },
  {
    key: 'dinosaur',
    synonyms: ['dinosaur', 'jurassic', 'prehistoric', '恐竜', 'ジュラ', '化石']
  },
  {
    key: 'coffee',
    synonyms: ['coffee', 'cafe', 'latte', 'espresso', 'roast', 'カフェ', '珈琲']
  },
  {
    key: 'ai',
    synonyms: [
      'ai',
      'artificial intelligence',
      'artificialintelligence',
      'tech',
      'digital',
      'robot',
      'neural',
      'future',
      'circuit',
      '人工知能',
      'システム',
      'テック'
    ]
  },
  {
    key: 'company',
    synonyms: ['company', 'enterprise', 'business', 'corporate', 'startup', 'firm', '会社', '企業']
  },
  {
    key: 'museum',
    synonyms: ['museum', 'culture', 'art', 'gallery', 'heritage', '文化', '美術館']
  },
  {
    key: 'nature',
    synonyms: ['nature', 'forest', 'eco', 'green', 'organic', 'garden', '植物', '自然', '森']
  },
  {
    key: 'travel',
    synonyms: ['travel', 'tour', 'journey', 'flight', 'airline', 'trip', '観光', '旅']
  },
  {
    key: 'education',
    synonyms: ['education', 'school', 'learning', 'academy', 'university', 'college', '学園', '教育']
  },
  {
    key: 'health',
    synonyms: ['health', 'medical', 'clinic', 'wellness', 'care', 'hospital', 'ヘルス', '医療']
  }
]

export function deriveMotifKeyword(analysis: URLAnalysis, candidate?: string): string {
  const candidateText = candidate?.toLowerCase().trim()
  const haystackSources = [
    candidateText,
    analysis.motif,
    analysis.theme,
    analysis.category,
    analysis.description,
    analysis.title
  ]
  const haystack = haystackSources
    .filter(Boolean)
    .map((value) => value!.toLowerCase())
    .join(' ')
  const sanitizedTokens = haystackSources
    .map((value) => sanitizeKeyword(value))
    .filter(Boolean)

  for (const entry of MOTIF_ENTRIES) {
    if (
      entry.synonyms.some((synonym) => {
        const synonymLower = synonym.toLowerCase()
        const synonymSanitized = sanitizeKeyword(synonymLower)
        return haystack.includes(synonymLower) || sanitizedTokens.includes(synonymSanitized)
      })
    ) {
      return entry.key
    }
  }

  const sanitizedCandidate = sanitizeKeyword(candidate)
  if (sanitizedCandidate) {
    return sanitizedCandidate
  }

  const fallback = sanitizeKeyword(analysis.category?.split(/[・\/\s]+/)[0])
  return fallback || 'abstract'
}

export function motifShapeKey(keyword?: string): MotifKey {
  const normalized = sanitizeKeyword(keyword)
  if (!normalized) return 'abstract'

  const entry =
    MOTIF_ENTRIES.find((item) => item.key === normalized) ||
    MOTIF_ENTRIES.find((item) =>
      item.synonyms.some((synonym) => sanitizeKeyword(synonym) === normalized)
    )
  return entry?.key ?? 'abstract'
}

function sanitizeKeyword(keyword?: string) {
  if (!keyword) return ''
  const trimmed = keyword.toLowerCase().trim()
  if (!trimmed) return ''
  const token = trimmed.split(/[,\s\/\-・｜|]/)[0]
  const sanitized = token.replace(/[^a-z0-9\u3040-\u30ff\u4e00-\u9faf]/g, '')
  return sanitized
}
