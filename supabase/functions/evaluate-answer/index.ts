import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get API key from environment
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ GEMINI_API_KEY found');

    const url = new URL(req.url);
    const requestType = url.searchParams.get('type') || 'evaluation';
    const requestBody = await req.json();

    // ===== EXAMPLE ANSWER GENERATION =====
    if (requestType === 'example') {
      console.log('Generating example answer...');
      
      const { question, category, difficulty } = requestBody;
      const company = url.searchParams.get('company') || 'google';

      const companyStyles: { [key: string]: any } = {
        google: {
          style: "Data-driven, user-centric, emphasize metrics and experimentation.",
          frameworks: "Use HEART metrics, OKRs, A/B testing rigor.",
          tone: "Analytical, hypothesis-driven, metric-focused."
        },
        apple: {
          style: "User experience first, opinionated about design.",
          frameworks: "Jobs-to-be-done, user journey mapping.",
          tone: "Confident, design-forward, user-empathetic."
        },
        meta: {
          style: "Growth-obsessed, network effects, viral loops.",
          frameworks: "Growth accounting, cohort retention.",
          tone: "Aggressive, growth-focused, quantitative."
        },
        stripe: {
          style: "Developer-centric, API-first, infrastructure thinking.",
          frameworks: "Technical feasibility, API design.",
          tone: "Technical, thoughtful, infrastructure-minded."
        },
        amazon: {
          style: "Customer obsession, working backwards.",
          frameworks: "Working backwards, six-page narratives.",
          tone: "Customer-first, detail-oriented."
        },
        coinbase: {
          style: "Crypto-native, regulatory aware, trust paramount.",
          frameworks: "Security-first design, regulatory constraints.",
          tone: "Cautious, security-minded."
        },
        discord: {
          style: "Community-first, engagement-driven.",
          frameworks: "Community metrics, engagement loops.",
          tone: "Community-focused, creator-centric."
        },
        chainlink: {
          style: "Decentralization, oracle networks, Web3.",
          frameworks: "Decentralized systems, node economics.",
          tone: "Technical, decentralization-focused."
        },
        twitter: {
          style: "Real-time engagement, conversation health.",
          frameworks: "Engagement metrics, content moderation.",
          tone: "Fast-paced, engagement-focused."
        }
      };

      const companyInfo = companyStyles[company] || companyStyles.google;

      const examplePrompt = `You are generating a REFERENCE-QUALITY answer that would score 9.0-9.5 out of 10 in a ${company.toUpperCase()} PM interview.

QUESTION: ${question}
CATEGORY: ${category}
DIFFICULTY: ${difficulty}
COMPANY: ${company.toUpperCase()}

COMPANY STYLE: ${companyInfo.style}
FRAMEWORKS: ${companyInfo.frameworks}
TONE: ${companyInfo.tone}

CRITICAL REQUIREMENTS FOR A 9/10 ANSWER:

1. START WITH CLARIFYING QUESTIONS (30-50 words)
2. QUANTIFY THE FUNNEL (if relevant)
3. EXPLICIT PRIORITIZATION WITH REASONING
4. INCLUDE TRADEOFFS
5. SPECIFIC METRICS, NOT VAGUE GOALS
6. COMPANY-SPECIFIC FRAMEWORKS
7. END WITH VALIDATION PLAN

STRUCTURE:
[Clarifying Questions - 50 words]
[Framework/Approach - 100 words]
[Prioritized Analysis - 150 words]
[Specific Recommendation with Metrics - 100 words]
[Validation Plan - 50 words]

TOTAL: 400-500 words. Be PRECISE. Be SPECIFIC. Use NUMBERS.

Generate the answer now in plain text (no JSON, no markdown):`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: examplePrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('❌ Example generation error:', errorBody);
        throw new Error('Failed to generate example');
      }

      const data = await response.json();
      const exampleAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate';

      return new Response(
        JSON.stringify({ exampleAnswer }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== PUSHBACK EVALUATION =====
    if (requestType === 'pushback') {
      console.log('Evaluating pushback...');
      
      const { question, originalAnswer, originalScore, originalFeedback, pushbackText } = requestBody;

      const pushbackPrompt = `You are a Senior PM evaluating pushback on a score.

ORIGINAL QUESTION: ${question}
ORIGINAL ANSWER: ${originalAnswer}
ORIGINAL SCORE: ${originalScore}/10
PUSHBACK: ${pushbackText}

Be EXTREMELY skeptical. Most pushbacks are wrong. Only adjust if they provide concrete evidence.

Return ONLY valid JSON:
{
  "verdict": "UPHELD" | "PARTIALLY_ADJUSTED" | "FULLY_ADJUSTED",
  "newScore": <number>,
  "reasoning": "<explanation>",
  "counterpoints": ["<point 1>", "<point 2>"],
  "finalThoughts": "<advice>"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: pushbackPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('❌ Pushback evaluation error:', errorBody);
        throw new Error('Failed to evaluate pushback');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Could not parse pushback response');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== NORMAL EVALUATION =====
    const { question, answer, category, difficulty, userEloRating, questionEloDifficulty } = requestBody;

    if (!question || question.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Invalid question length' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!answer || answer.length < 10 || answer.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Answer must be between 10 and 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a senior PM interviewer at Google with 10+ years experience.

QUESTION: ${question}
CATEGORY: ${category}
DIFFICULTY: ${difficulty}

CANDIDATE'S ANSWER:
${answer}

EVALUATION - 14 PM SKILLS:
1. Problem Framing 2. User Empathy 3. Metrics Definition 4. Trade-off Analysis 5. Prioritization 6. Strategic Thinking 7. Stakeholder Management 8. Communication 9. Technical Judgment 10. Ambiguity Navigation 11. Systems Thinking 12. Market Sense 13. Experimentation 14. Risk Assessment

SCORE CALIBRATION (use decimals: 6.2, 7.5, 8.3):
9.0-10.0: Exceptional (Top 5%)
7.0-8.9: Strong (Top 25%)
5.0-6.9: Adequate (Middle 50%)
3.0-4.9: Weak (Bottom 25%)
1.0-2.9: Very Weak (Bottom 5%)

CRITICAL RULES:
- "This is a test" = 1/10
- Under 30 words = MAX 3/10
- No specific metrics = MAX 5/10
- No trade-offs = MAX 6/10

Return ONLY valid JSON (no markdown):
{
  "score": <0-10 with decimals>,
  "strengths": ["<specific quote> - <why good>", "<quote>", "<quote>"],
  "weaknesses": ["<what's missing> - <evidence>", "<gap>", "<gap>"],
  "detailedFeedback": "<2-3 sentences with SPECIFIC quotes>",
  "categoryScores": {"strategy": <1-10>, "metrics": <1-10>, "prioritization": <1-10>, "design": <1-10>},
  "skillScores": {"problem_framing": <1-10>, "user_empathy": <1-10>, "metrics_definition": <1-10>, "tradeoff_analysis": <1-10>, "prioritization": <1-10>, "strategic_thinking": <1-10>, "stakeholder_mgmt": <1-10>, "communication": <1-10>, "technical_judgment": <1-10>, "ambiguity_navigation": <1-10>, "systems_thinking": <1-10>, "market_sense": <1-10>, "experimentation": <1-10>, "risk_assessment": <1-10>}
}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    console.log('Gemini response status:', geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorBody);
      throw new Error(`Gemini API failed with status ${geminiResponse.status}: ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      throw new Error('Invalid AI response');
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const feedback = JSON.parse(jsonMatch[0]);

    if (!feedback.score) {
      throw new Error('Invalid feedback structure');
    }

    // Calculate ELO
    if (userEloRating && questionEloDifficulty) {
      const expectedScore = 1 / (1 + Math.pow(10, (questionEloDifficulty - userEloRating) / 400));
      const actualScore = feedback.score / 10;
      
      let kFactor = 40;
      if (feedback.score < 4) {
        kFactor = 60;
      } else if (feedback.score >= 9) {
        kFactor = 50;
      }
      
      const change = Math.round(kFactor * (actualScore - expectedScore));
      const newRating = Math.max(800, Math.min(2200, userEloRating + change));
      
      feedback.eloChange = change;
      feedback.newEloRating = newRating;
      
      console.log(`📊 ELO: ${userEloRating} → ${newRating} (${change > 0 ? '+' : ''}${change})`);
    }

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