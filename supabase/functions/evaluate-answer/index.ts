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
            generationConfig: { 
              temperature: 0.7, 
              maxOutputTokens: 8192,
              responseMimeType: "text/plain"
            },
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

Return ONLY valid JSON (be CONCISE - max 10 words per field):
{
  "verdict": "UPHELD" | "PARTIALLY_ADJUSTED" | "FULLY_ADJUSTED",
  "newScore": <number>,
  "reasoning": "<max 80 words>",
  "counterpoints": ["<max 40 words>", "<max 40 words>"],
  "finalThoughts": "<max 40 words>"
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
              maxOutputTokens: 8192,
              responseMimeType: "application/json"
            },
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
      
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        const jsonMatch = text?.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('Could not parse pushback response');
        result = JSON.parse(jsonMatch[0]);
      }
      
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

const prompt = `You are an ELITE PM interviewer (ex-Google L7, 15+ years experience) known for RIGOROUS evaluation that develops world-class product leaders.

QUESTION: ${question}
CATEGORY: ${category}
DIFFICULTY: ${difficulty}

CANDIDATE'S ANSWER:
${answer}

YOUR EVALUATION STANDARDS (DIFFERENTIATED FROM CHATGPT):

**14 PM SKILLS - DEEP EVALUATION:**
1. Problem Framing: Did they reframe the problem? Challenge assumptions? Identify root cause vs symptom?
2. User Empathy: Specific user pain points? Segmentation? Jobs-to-be-done thinking?
3. Metrics Definition: Leading vs lagging indicators? Counter-metrics? Baseline numbers?
4. Trade-off Analysis: Explicit costs? Opportunity cost quantified? What are we NOT doing?
5. Prioritization: Clear ranking with reasoning? Impact/effort scoring? Sequencing logic?
6. Strategic Thinking: Long-term implications? Competitive positioning? Ecosystem effects?
7. Stakeholder Management: Cross-functional dependencies? Communication plan? Objection handling?
8. Communication: Structured thinking? Executive summary? Logical flow?
9. Technical Judgment: Feasibility assessment? Scalability considerations? Technical constraints?
10. Ambiguity Navigation: Handled missing info? Made assumptions explicit? Probabilistic thinking?
11. Systems Thinking: Second-order effects? Feedback loops? Unintended consequences?
12. Market Sense: Competitive dynamics? Market timing? Industry trends?
13. Experimentation: Hypothesis-driven? A/B test design? Statistical rigor?
14. Risk Assessment: What could go wrong? Mitigation strategies? Kill criteria?

**UNIQUE ELO STANDARDS (NOT FOUND IN CHATGPT):**
- Quantification Requirement: Every claim needs numbers (market size, conversion rates, timelines)
- Framework Naming: Must cite specific frameworks by name (RICE, HEART, Kano, etc.)
- Contrarian Thinking: Do they challenge the premise? Question hidden assumptions?
- Operator Mindset: Talk about implementation, not just strategy
- Failure Modes: What are the top 3 ways this could fail?

**HARSH SCORING CALIBRATION (use decimals for precision):**
9.5-10.0: Principal/Staff PM level - Would teach this internally
9.0-9.4: Senior/Lead PM - Reference answer quality
8.0-8.9: Strong PM - Detailed, quantified, demonstrates expertise
7.0-7.9: Solid PM - Good structure, some gaps in depth
6.0-6.9: Junior PM - Surface-level, missing frameworks
5.0-5.9: Associate PM - Basic understanding, major gaps
4.0-4.9: Needs coaching - Misses key concepts
3.0-3.9: Not ready - Fundamental misunderstandings
1.0-2.9: Test answer or incoherent

**AUTOMATIC SCORE CAPS (STRICTLY ENFORCED):**
- "This is a test" or placeholder text = 1.0 (instant fail)
- Under 50 words = MAX 3.0 (insufficient depth)
- No specific metrics or numbers = MAX 4.5 (lacks rigor)
- No trade-offs mentioned = MAX 5.5 (shallow analysis)
- No frameworks cited by name = MAX 6.5 (generic thinking)
- No prioritization or ranking = MAX 6.0 (lack of judgment)
- Doesn't question assumptions = MAX 7.0 (accepts premise blindly)

**OUTPUT FORMAT (BE CONCISE - Use SHORT, PUNCHY Feedback):**
Return ONLY valid JSON. Each strength/weakness must be under 100 characters. Be direct and brutal.

{
  "score": <0-10 with one decimal, e.g. 6.8>,
  "strengths": ["<80 char max>", "<80 char max>", "<80 char max>"],
  "weaknesses": ["<80 char max>", "<80 char max>", "<80 char max>"],
  "detailedFeedback": "<150 char max - most critical insight>",
  "categoryScores": {"strategy": <1-10>, "metrics": <1-10>, "prioritization": <1-10>, "design": <1-10>},
  "skillScores": {"problem_framing": <1-10>, "user_empathy": <1-10>, "metrics_definition": <1-10>, "tradeoff_analysis": <1-10>, "prioritization": <1-10>, "strategic_thinking": <1-10>, "stakeholder_mgmt": <1-10>, "communication": <1-10>, "technical_judgment": <1-10>, "ambiguity_navigation": <1-10>, "systems_thinking": <1-10>, "market_sense": <1-10>, "experimentation": <1-10>, "risk_assessment": <1-10>}
}

REMEMBER: This evaluation develops SKILLS, not interview tactics. Be rigorous. Be harsh. Be specific.`;

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

    console.log('Gemini response status:', geminiResponse.status);

    if (!geminiResponse.ok) {
      const errorBody = await geminiResponse.text();
      console.error('❌ Gemini API error:', errorBody);
      throw new Error(`Gemini API failed with status ${geminiResponse.status}: ${errorBody}`);
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('❌ No text in AI response:', JSON.stringify(geminiData));
      throw new Error('Invalid AI response - no text returned');
    }

    console.log('📄 Raw response length:', text.length);

    // Parse JSON (responseMimeType should give us clean JSON, but add fallback)
    let feedback;
    try {
      feedback = JSON.parse(text);
      console.log('✅ Direct JSON parse successful');
    } catch (directParseError) {
      console.log('⚠️ Direct parse failed, trying extraction...');
      
      // Fallback: Clean and extract
      let cleanedText = text
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^[^{]*/, '')
        .trim();
      
      // Find last complete closing brace
      const lastBrace = cleanedText.lastIndexOf('}');
      if (lastBrace !== -1) {
        cleanedText = cleanedText.substring(0, lastBrace + 1);
      }
      
      try {
        feedback = JSON.parse(cleanedText);
        console.log('✅ Extraction parse successful');
      } catch (extractError) {
        console.error('❌ All parsing failed');
        console.error('First 500 chars:', text.substring(0, 500));
        console.error('Last 500 chars:', text.substring(Math.max(0, text.length - 500)));
        throw new Error('Could not parse AI response - invalid JSON');
      }
    }

    if (!feedback.score || typeof feedback.score !== 'number') {
      throw new Error('Invalid feedback structure - missing score');
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