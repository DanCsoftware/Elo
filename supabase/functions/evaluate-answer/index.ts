import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvaluationRequest {
  question: string;
  answer: string;
  category: string;
  difficulty: string;
}

interface FeedbackResult {
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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('VITE_GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      console.error('VITE_GEMINI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { question, answer, category, difficulty }: EvaluationRequest = await req.json();

    // Validate input lengths
    if (!question || question.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Invalid question length (max 2000 chars)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!answer || answer.length < 10 || answer.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Answer must be between 10 and 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate enum values
    const validCategories = ['strategy', 'metrics', 'prioritization', 'design', 'product sense', 'execution', 'leadership'];
    const validDifficulties = ['easy', 'medium', 'hard'];

    const normalizedCategory = category?.toLowerCase() || '';
    const normalizedDifficulty = difficulty?.toLowerCase() || '';

    if (!validCategories.includes(normalizedCategory)) {
      return new Response(
        JSON.stringify({ error: 'Invalid category' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validDifficulties.includes(normalizedDifficulty)) {
      return new Response(
        JSON.stringify({ error: 'Invalid difficulty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Evaluating answer for category: ${category}, difficulty: ${difficulty}`);

    const prompt = `You are an experienced product management interviewer at a FAANG company evaluating a candidate's answer.

CRITICAL CONTEXT:
- There is NO single "correct answer" to PM questions
- You are evaluating THINKING PROCESS, not memorized answers
- Strong answers show: structure, trade-off analysis, metric-driven thinking, edge cases
- Weak answers: jump to solutions, ignore constraints, lack specificity

Question: ${question}
Category: ${category}
Difficulty: ${difficulty}
Candidate Answer: ${answer}

SCORING RUBRIC (be harsh but fair):
9-10: Exceptional - Structured, comprehensive, unprompted trade-offs
7-8: Strong - Clear structure, hits most key points
5-6: Adequate - Has some structure but incomplete
3-4: Weak - Lacks structure, major gaps
1-2: Very Weak - Fundamental misunderstandings

IMPORTANT: A score of 6/10 should feel like "okay but needs work", NOT "good job!"

Return ONLY valid JSON (no markdown):
{
  "score": 6.5,
  "strengths": [
    "Specific strength with evidence",
    "Another specific strength",
    "Third specific strength"
  ],
  "weaknesses": [
    "Specific gap",
    "Another gap",
    "Third gap"
  ],
  "detailedFeedback": "2-3 sentences of actionable advice. Be direct and honest.",
  "categoryScores": {
    "strategy": 7,
    "metrics": 5,
    "prioritization": 6,
    "design": 8
  }
}`;

    // Call Gemini API - use header for API key instead of URL parameter
    const geminiResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to evaluate answer with AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response received');

    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error('No text in Gemini response:', geminiData);
      return new Response(
        JSON.stringify({ error: 'Invalid AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      return new Response(
        JSON.stringify({ error: 'Could not parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const feedback: FeedbackResult = JSON.parse(jsonMatch[0]);

    if (!feedback.score || !feedback.strengths || !feedback.weaknesses) {
      console.error('Invalid feedback structure:', feedback);
      return new Response(
        JSON.stringify({ error: 'Invalid feedback structure from AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Evaluation complete, score:', feedback.score);

    return new Response(
      JSON.stringify(feedback),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
