-- Add ELO rating to user_stats
ALTER TABLE user_stats 
ADD COLUMN elo_rating INTEGER DEFAULT 1200,
ADD COLUMN skill_ratings JSONB DEFAULT '{
  "problem_framing": 1200,
  "user_empathy": 1200,
  "metrics_definition": 1200,
  "tradeoff_analysis": 1200,
  "prioritization": 1200,
  "strategic_thinking": 1200,
  "stakeholder_mgmt": 1200,
  "communication": 1200,
  "technical_judgment": 1200,
  "ambiguity_navigation": 1200,
  "systems_thinking": 1200,
  "market_sense": 1200,
  "experimentation": 1200,
  "risk_assessment": 1200
}'::jsonb;

-- Add ELO change tracking to user_sessions
ALTER TABLE user_sessions
ADD COLUMN elo_before INTEGER,
ADD COLUMN elo_after INTEGER,
ADD COLUMN elo_change INTEGER,
ADD COLUMN skill_scores JSONB;

-- Add new fields to questions table
ALTER TABLE questions
ADD COLUMN skills TEXT[] DEFAULT '{}',
ADD COLUMN elo_difficulty INTEGER DEFAULT 1400;

-- Drop the old category constraint since we're moving to multi-skill tagging
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_category_check;

-- Update questions to have array of skills instead of single category
-- We'll populate this via code, but add the column structure