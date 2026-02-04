import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const requestType = url.searchParams.get('type') || 'evaluation';
    const requestBody = await req.json();
    
// ===== ANSWER EVOLUTION =====
if (requestType === 'evolution') {
  console.log('Generating answer evolution...');
  
  const { question, userAnswer, score } = requestBody;

  const evolutionPrompt = `You are helping a PM improve their answer from ${score}/10 to 9/10.

QUESTION: ${question}

THEIR ANSWER:
${userAnswer}

Generate 3-4 specific improvements. For EACH improvement:
1. Quote 5-15 words from their answer
2. Show the upgraded version
3. Explain why in ONE sentence

Return ONLY valid JSON (no markdown, no preamble):
{
  "improvements": [
    {
      "original": "exact quote from their answer (5-15 words)",
      "improved": "upgraded version (20-30 words max)",
      "why": "one sentence explanation",
      "impact": "+0.5" or "+1.0"
    }
  ]
}

Keep it concise. Focus on the BIGGEST impact improvements.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: evolutionPrompt }] }],
        generationConfig: { 
          temperature: 0.7, 
          maxOutputTokens: 2000, // Reduced from 3000
          responseMimeType: "application/json"
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Evolution error:', errorText);
    throw new Error('Failed to generate evolution');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  
  let evolution;
  try {
    evolution = JSON.parse(text);
  } catch (parseError) {
    console.error('Parse error:', parseError);
    console.error('Raw text:', text);
    throw new Error('Failed to parse evolution response');
  }

  // Don't generate full upgraded answer - just improvements
  return new Response(
    JSON.stringify({ improvements: evolution.improvements }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

    // ===== EXAMPLE ANSWER GENERATION =====
    if (requestType === 'example') {
      console.log('Generating example answer...');
      
      const { question, category, difficulty } = requestBody;
      const company = url.searchParams.get('company') || 'google';

      const companyPrompts: { [key: string]: string } = {
        google: `You're a Google L6 PM. Think like a Googler:
- Start with user problem, not solution
- Obsess over metrics and experimentation  
- Default to data, acknowledge when it's missing
- Focus on 10x impact, not 10% improvements
- Use rough estimates when exact data unavailable
- Challenge assumptions before answering

Avoid: Forcing HEART if metrics don't fit, quoting exact percentages without data, over-indexing on process over outcome.`,

        meta: `You're a Meta IC6 PM. Think like Meta:
- Growth and engagement are north stars
- Network effects and viral loops matter
- Move fast, ship experiments
- Scale thinking (billions of users)
- Data-driven but willing to bet on conviction

Avoid: Slow, overthought analysis. Meta PMs ship and learn.`,

        apple: `You're an Apple ICT4 PM. Think like Apple:
- User experience is everything
- Opinionated about design and quality
- "No" is as important as "yes"
- Polish over features
- Think about brand and ecosystem

Avoid: Feature lists. Apple builds experiences, not checklists.`,

        stripe: `You're a Stripe Staff PM. Think like Stripe:
- Developer experience is the product
- API design and infrastructure thinking
- Simplicity for complex problems
- Think about edge cases and failure modes
- Technical feasibility is critical

Avoid: Fluffy business speak. Stripe PMs are technical.`,

        amazon: `You're an Amazon L7 PM. Think like Amazon:
- Start with customer and work backwards
- Bias for action and ownership
- Think big but start small (two-way doors)
- Quantify everything
- Frugality and simplification

Avoid: Politics and process. Amazon rewards builders.`,

        coinbase: `You're a Coinbase Senior PM. Think crypto-native:
- Trust and security paramount
- Regulatory awareness is critical
- Explain crypto complexity simply
- Think about worst-case scenarios
- Balance innovation with safety

Avoid: Moving fast and breaking things. Users' money is at stake.`
      };

      const companyStyle = companyPrompts[company] || companyPrompts.google;

      const examplePrompt = `${companyStyle}

QUESTION: ${question}
CATEGORY: ${category}
DIFFICULTY: ${difficulty}

Generate a 9/10 answer (400-500 words) that would impress in a ${company.toUpperCase()} PM interview.

STRUCTURE:
1. Challenge the premise (if relevant) - WHY are we doing this?
2. Ask clarifying questions
3. Segment the problem (different users, use cases, contexts)
4. Identify trade-offs and second-order effects
5. Use rough estimates where concrete (avoid false precision)
6. Propose alternatives or better solutions
7. End with how you'd validate

Write in plain text (no JSON, no markdown). Sound like a senior PM, not an AI.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: examplePrompt }] }],
            generationConfig: { 
              temperature: 0.8, 
              maxOutputTokens: 4096,
              responseMimeType: "text/plain"
            },
          }),
        }
      );

      if (!response.ok) {
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
      
      const { question, originalAnswer, originalScore, pushbackText } = requestBody;

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
  "reasoning": "<80 words max>",
  "counterpoints": ["<40 words>", "<40 words>"],
  "finalThoughts": "<40 words>"
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: pushbackPrompt }] }],
            generationConfig: { 
              temperature: 0.7, 
              maxOutputTokens: 2048,
              responseMimeType: "application/json"
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to evaluate pushback');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const result = JSON.parse(text);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== ANALYZE POND NOTES =====
    if (requestType === 'analyze-pond') {
      console.log('Analyzing pond notes...');
      
      const { notesContent } = requestBody;

      const analyzePrompt = `You're a Principal PM reviewing note-taking habits.

THEIR NOTES:
${notesContent}

HEALTHY NOTES: Specific triggers ("When I [situation], I [action]"), named frameworks, numbers, personal lessons
UNHEALTHY NOTES: Generic platitudes, no context, theory without application

YOUR REVIEW (120 words max):
Start with "✅ HEALTHY" or "⚠️ UNHEALTHY"
Then: What makes them healthy/unhealthy (quote examples), one concrete fix

Be brutally honest and conversational.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: analyzePrompt }] }],
            generationConfig: { 
              temperature: 0.9,
              maxOutputTokens: 512,
              responseMimeType: "text/plain"
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to analyze notes');
      }

      const data = await response.json();
      const review = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate review';

      return new Response(
        JSON.stringify({ review }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== MAIN EVALUATION =====
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

    const prompt = `You are an ELITE PM interviewer evaluating answers to develop world-class product thinking.

QUESTION: ${question}
CATEGORY: ${category}
DIFFICULTY: ${difficulty}

CANDIDATE'S ANSWER:
${answer}

**EVALUATION PHILOSOPHY:**
Your job is to evaluate REASONING QUALITY, not pattern matching. A 9/10 answer with zero framework names beats a 5/10 answer that mentions "RICE" ten times.

**PRIMARY CRITERIA (80% of score):**

1. **REASONING DEPTH (30%)**
   - Did they explain WHY, not just WHAT?
   - Did they challenge assumptions when appropriate?
   - Did they connect decisions to outcomes?
   - Did they consider second-order effects?

2. **USER SEGMENTATION (20%)**
   - Did they identify different user types/use cases?
   - Did they think about who benefits vs who loses?
   - Did they consider platform dynamics (not just end users)?

3. **TRADE-OFF CLARITY (15%)**
   - Did they identify what we're NOT doing?
   - Did they explain costs/downsides?
   - Did they propose alternatives vs just yes/no?

4. **CONCRETENESS (15%)**
   - Did they avoid vague language where specifics matter?
   - Did they use rough estimates appropriately? (~5% vs ~80%)
   - Did they give timelines when relevant?

**BONUSES (20% of score):**
- Framework usage (+1.0 if used appropriately, not forced)
- Challenging the premise (+1.0 if done well)
- Proposing better alternatives (+0.5)
- Second-order thinking (+0.5)

**RED FLAGS (DEDUCT HEAVILY):**
- Vague language where specifics matter ("increase engagement" vs "DAU/MAU from 35% to 45%")
- Accepting premise without question when it should be questioned
- No trade-offs identified
- Pattern matching (forcing frameworks where they don't fit)
- Made-up precision ("will increase DAU by 14.7%")

**SCORING SCALE:**
9.5-10.0: Principal/Staff PM - Would use this as training material
9.0-9.4: Senior/Lead PM - Reference quality
8.0-8.9: Strong PM - Detailed reasoning, minor gaps
7.0-7.9: Solid PM - Good thinking, needs more depth
6.0-6.9: Junior PM - Surface-level, missing key insights
5.0-5.9: Associate PM - Basic understanding, major gaps
4.0-4.9: Needs coaching - Fundamental issues
1.0-3.9: Not ready - Incoherent or test answer

**INSTANT FAILS:**
- "This is a test" or placeholder = 1.0
- Under 50 words = MAX 3.0

**CRITICAL: NO ARBITRARY CAPS**
An answer can score 9.5/10 with:
- Zero framework names (if reasoning is exceptional)
- Zero numbers (if the question doesn't need quantification)
- Framework names are NICE TO HAVE, not required

**OUTPUT FORMAT:**
Return ONLY valid JSON. Quote their actual answer in feedback to prove you read it.

{
  "score": <0-10 with one decimal>,
  "strengths": ["Quote their words: 'X' - why this is strong", "...", "..."],
  "weaknesses": ["Quote their words: 'Y' - how to upgrade: 'Z'", "...", "..."],
  "detailedFeedback": "Start with what they did well. Then show 2-3 specific upgrades with examples from THEIR answer. Be constructive but honest.",
  "categoryScores": {"strategy": <1-10>, "metrics": <1-10>, "prioritization": <1-10>, "design": <1-10>},
  "skillScores": {"problem_framing": <1-10>, "user_empathy": <1-10>, "metrics_definition": <1-10>, "tradeoff_analysis": <1-10>, "prioritization": <1-10>, "strategic_thinking": <1-10>, "stakeholder_mgmt": <1-10>, "communication": <1-10>, "technical_judgment": <1-10>, "ambiguity_navigation": <1-10>, "systems_thinking": <1-10>, "market_sense": <1-10>, "experimentation": <1-10>, "risk_assessment": <1-10>}
}

REMEMBER: Evaluate reasoning, not checklist completion. Be rigorous but fair.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.7, 
            maxOutputTokens: 8192,
            responseMimeType: "application/json"
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorBody);
      throw new Error(`Gemini API failed`);
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Invalid AI response');
    }

    let feedback;
    try {
      feedback = JSON.parse(text);
    } catch {
      const cleanedText = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      feedback = JSON.parse(cleanedText);
    }

    if (!feedback.score || typeof feedback.score !== 'number') {
      throw new Error('Invalid feedback structure');
    }

    // ===== CALCULATE ELO =====
    if (userEloRating && questionEloDifficulty) {
      const actualScore = feedback.score / 10;
      const ratingDiff = questionEloDifficulty - userEloRating;
      const expectedScore = 1 / (1 + Math.pow(10, ratingDiff / 400));
      
      console.log(`🎯 Expected: ${(expectedScore * 10).toFixed(1)}/10, Actual: ${feedback.score}/10`);
      
      let qualityPenalty = 0;
      if (feedback.score < 6.0) {
        qualityPenalty = -(6.0 - feedback.score) * 10;
        console.log(`⚠️ Quality penalty: ${qualityPenalty}`);
      } else if (feedback.score >= 8.5) {
        qualityPenalty = (feedback.score - 8.5) * 5;
        console.log(`✨ Quality bonus: +${qualityPenalty}`);
      }
      
      let difficultyMultiplier = 1.0;
      if (questionEloDifficulty >= 1700) difficultyMultiplier = 1.4;
      else if (questionEloDifficulty >= 1500) difficultyMultiplier = 1.2;
      else if (questionEloDifficulty <= 1000) difficultyMultiplier = 0.7;
      
      let kFactor = 32;
      if (userEloRating < 1000) kFactor = 50;
      else if (userEloRating > 1800) kFactor = 24;
      
      const baseChange = kFactor * (actualScore - expectedScore);
      const difficultyAdjustedChange = baseChange * difficultyMultiplier;
      const totalChange = difficultyAdjustedChange + qualityPenalty;
      const cappedChange = Math.max(-150, Math.min(150, Math.round(totalChange)));
      const newRating = Math.max(800, Math.min(2200, userEloRating + cappedChange));
      
      feedback.eloChange = cappedChange;
      feedback.newEloRating = newRating;
      
      console.log(`📊 ELO: ${userEloRating} → ${newRating} (${cappedChange > 0 ? '+' : ''}${cappedChange})`);
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