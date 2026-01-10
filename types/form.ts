export type QuestionType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'rating'
  | 'date'
  | 'email'
  | 'phone'

export interface FormQuestion {
  id: string
  form_id: string
  question_type: QuestionType
  title: string
  description?: string | null
  is_required: boolean
  options?: string[] | null
  order_index: number
  settings?: Record<string, unknown> | null
  created_at: string
}

export interface Form {
  id: string
  user_id: string
  code: string
  title: string
  description?: string | null
  is_published: boolean
  is_accepting_responses: boolean
  theme_color: string
  response_count: number
  qr_code_url?: string | null
  created_at: string
  updated_at: string
  questions?: FormQuestion[]
}

export interface FormResponse {
  id: string
  form_id: string
  answers: Record<string, string | string[]>
  respondent_info?: {
    ip?: string
    userAgent?: string
  } | null
  submitted_at: string
}

export const questionTypeLabels: Record<QuestionType, string> = {
  text: 'テキスト（1行）',
  textarea: 'テキスト（複数行）',
  select: 'ドロップダウン',
  radio: 'ラジオボタン',
  checkbox: 'チェックボックス',
  rating: '評価（5段階）',
  date: '日付',
  email: 'メールアドレス',
  phone: '電話番号'
}

export const questionTypeIcons: Record<QuestionType, string> = {
  text: 'T',
  textarea: '¶',
  select: '▼',
  radio: '○',
  checkbox: '☑',
  rating: '★',
  date: '📅',
  email: '@',
  phone: '📞'
}
