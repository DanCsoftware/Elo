import { createClient } from '@supabase/supabase-js'
import { config } from '@/config/keys'

export const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})

// 14 PM Skills
export type PMSkill = 
  | 'problem_framing'
  | 'user_empathy'
  | 'metrics_definition'
  | 'tradeoff_analysis'
  | 'prioritization'
  | 'strategic_thinking'
  | 'stakeholder_mgmt'
  | 'communication'
  | 'technical_judgment'
  | 'ambiguity_navigation'
  | 'systems_thinking'
  | 'market_sense'
  | 'experimentation'
  | 'risk_assessment';

export interface Question {
  id: string
  text: string
  category: 'strategy' | 'metrics' | 'prioritization' | 'design' // Keep for backwards compatibility
  difficulty: 'easy' | 'medium' | 'hard'
  skills: PMSkill[] // 🆕 NEW: Multi-skill tagging
  elo_difficulty: number // 🆕 NEW: ELO difficulty rating (1000-2000)
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
  skill_scores?: { [key in PMSkill]?: number } // 🆕 NEW: Score per skill
  elo_before?: number // 🆕 NEW: Rating before this question
  elo_after?: number // 🆕 NEW: Rating after
  elo_change?: number // 🆕 NEW: Rating change (+/- points)
  created_at: string
  category: string
  difficulty: string
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
  elo_rating: number // 🆕 NEW: Overall ELO rating
  skill_ratings: { [key in PMSkill]: number } // 🆕 NEW: ELO per skill
  updated_at: string
}

// Helper to get display names for skills
export const skillDisplayNames: { [key in PMSkill]: string } = {
  problem_framing: 'Problem Framing',
  user_empathy: 'User Empathy',
  metrics_definition: 'Metrics Definition',
  tradeoff_analysis: 'Trade-off Analysis',
  prioritization: 'Prioritization',
  strategic_thinking: 'Strategic Thinking',
  stakeholder_mgmt: 'Stakeholder Management',
  communication: 'Communication',
  technical_judgment: 'Technical Judgment',
  ambiguity_navigation: 'Ambiguity Navigation',
  systems_thinking: 'Systems Thinking',
  market_sense: 'Market Sense',
  experimentation: 'Experimentation',
  risk_assessment: 'Risk Assessment',
};

// Helper to get skill category groupings
export const skillCategories = {
  'Core Thinking': [
    'problem_framing',
    'user_empathy',
    'metrics_definition',
    'tradeoff_analysis',
    'prioritization',
    'strategic_thinking',
  ] as PMSkill[],
  'Execution': [
    'stakeholder_mgmt',
    'communication',
    'technical_judgment',
  ] as PMSkill[],
  'Advanced': [
    'ambiguity_navigation',
    'systems_thinking',
    'market_sense',
    'experimentation',
    'risk_assessment',
  ] as PMSkill[],
};