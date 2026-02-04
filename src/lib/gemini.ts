const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
  skillScores: {
    problem_framing: number;
    user_empathy: number;
    metrics_definition: number;
    tradeoff_analysis: number;
    prioritization: number;
    strategic_thinking: number;
    stakeholder_mgmt: number;
    communication: number;
    technical_judgment: number;
    ambiguity_navigation: number;
    systems_thinking: number;
    market_sense: number;
    experimentation: number;
    risk_assessment: number;
  };
  eloChange?: number;
  newEloRating?: number;
}

export interface AnswerEvolution {
  improvements: Array<{
    yourAnswer: string;
    upgraded: string;
    why: string;
    scoreImpact: string;
  }>;
  upgradedAnswer: string;
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  category: string,
  difficulty: string,
  userEloRating: number,
  questionEloDifficulty: number
): Promise<FeedbackResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing');
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/evaluate-answer`, 
    {
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
        userEloRating,
        questionEloDifficulty,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Evaluation API error:', errorData);
    throw new Error('Failed to evaluate answer');
  }

  return response.json();
}

export async function generateAnswerEvolution(
  question: string,
  userAnswer: string,
  score: number
): Promise<AnswerEvolution> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase configuration is missing');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

  try {
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/evaluate-answer?type=evolution`, 
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          question,
          userAnswer,
          score,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Evolution API error:', errorData);
      throw new Error('Failed to generate evolution');
    }

    const data = await response.json();
    
    // Map the API response to match the expected interface
    return {
      improvements: data.improvements.map((imp: any) => ({
        yourAnswer: imp.original || '',
        upgraded: imp.improved || '',
        why: imp.why || '',
        scoreImpact: imp.impact || '+0.5'
      })),
      upgradedAnswer: data.upgradedAnswer || '' // This will be empty from the new API
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}