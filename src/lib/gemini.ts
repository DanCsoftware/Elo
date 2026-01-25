export interface FeedbackResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  detailedFeedback: string;
  categoryScores: {
    strategy: number;
    metrics: number;
    prioritization: number;
    design: number;
  };
  skillScores?: { [key: string]: number }; // 🆕 ADD THIS
  eloChange?: number; // 🆕 ADD THIS
  newEloRating?: number; // 🆕 ADD THIS
}

// Use Lovable Cloud's Supabase for Edge Functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/evaluate-answer`

// Function to evaluate answer using Supabase Edge Function
export async function evaluateAnswer(
  question: string,
  answer: string,
  category: string,
  difficulty: string,
  userEloRating?: number, // 🆕 ADD THIS
  questionEloDifficulty?: number // 🆕 ADD THIS
): Promise<FeedbackResult> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing');
  }

  const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate-answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      question,
      answer,
      category,
      difficulty,
      userEloRating, // 🆕 ADD THIS
      questionEloDifficulty, // 🆕 ADD THIS
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to evaluate answer');
  }

  return response.json();
}