import { createClient } from '@supabase/supabase-js'

// Use external Supabase instance credentials
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})

export interface Question {
  id: string
  text: string
  category: 'strategy' | 'metrics' | 'prioritization' | 'design'
  difficulty: 'easy' | 'medium' | 'hard'
  hint?: string
  created_at: string
}

export interface UserSession {
  id: string
  user_id: string
  question_id: string
  answer_text: string
  score: number
  strengths: string[]
  weaknesses: string[]
  detailed_feedback: string
  category_scores: {
    strategy: number
    metrics: number
    prioritization: number
    design: number
  }
  created_at: string
}

export interface UserStats {
  user_id: string
  streak_days: number
  last_practice_date: string | null
  total_questions: number
  average_score: number
  skill_levels: {
    strategy: number
    metrics: number
    prioritization: number
    design: number
  }
  updated_at: string
}
