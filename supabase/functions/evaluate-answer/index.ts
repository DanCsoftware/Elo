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
  userEloRating?: number;
  questionEloDifficulty?: number;
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
  skillScores?: { [key: string]: number };
  eloChange?: number;
  newEloRating?: number;
}

// ELO calculation
function calculateEloChange(
  currentRating: number,
  questionDifficulty: number,
  scoreOutOf10: number,
  kFactor: number = 40
): { newRating: number; change: number } {
  const expectedScore = 1 / (1 + Math.pow(10, (questionDifficulty - currentRating) / 400));
  const actualScore = scoreOutOf10 / 10;
  
  let adjustedKFactor = kFactor;
  
  if (scoreOutOf10 < 4) {
    adjustedKFactor = kFactor * 1.5;
  } else if (scoreOutOf10 >= 9) {
    adjustedKFactor = kFactor * 1.25;
  }
  
  const change = Math.round(adjustedKFactor * (actualScore - expectedScore));
  const newRating = Math.max(800, Math.min(2200, currentRating + change));
  
  console.log(`📊 ELO: ${currentRating} → ${newRating} (${change > 0 ? '+' : ''}${change})`);
  
  return { newRating, change };
}

// Company contexts
function getCompanyContext(company: string) {
  const contexts: { [key: string]: any } = {
    google: {
      name: 'Google',
      philosophy: 'Data-driven decisions, user research, experimentation at scale. "Focus on the user and all else will follow." OKRs and 10x thinking.',
      prioritizes: [
        '- A/B test everything with statistical rigor',
        '- User research to validate assumptions',
        '- Metrics-driven decision making',
        '- Think 10x improvements, not 10%',
      ],
    },
    apple: {
      name: 'Apple',
      philosophy: 'Quality bar above all. Vertical integration. "It just works." Design as competitive advantage. Willing to delay for perfection.',
      prioritizes: [
        '- User experience perfection over shipping fast',
        '- Cohesive ecosystem thinking',
        '- Control the entire stack (hardware + software)',
        '- "A thousand no\'s for every yes"',
      ],
    },
    coinbase: {
      name: 'Coinbase',
      philosophy: 'Increase economic freedom through crypto. Trust is everything. Regulatory compliance first. Conservative approach to risk.',
      prioritizes: [
        '- Security and regulatory compliance above all',
        '- User education and trust-building',
        '- Conservative on which tokens/features to launch',
        '- Be the trusted on-ramp to crypto',
      ],
    },
    chainlink: {
      name: 'Chainlink',
      philosophy: 'Decentralized oracle infrastructure. Developer-first. Cross-chain interoperability. "Hybrid smart contracts" vision.',
      prioritizes: [
        '- Oracle network reliability and decentralization',
        '- Developer documentation and tooling',
        '- Cross-chain and blockchain-agnostic',
        '- Infrastructure that other projects build on',
      ],
    },
    discord: {
      name: 'Discord',
      philosophy: 'Communities own their spaces. Server admins are power users. Authentic connections. Gaming roots (low-latency, reliable voice).',
      prioritizes: [
        '- Server owner control and customization',
        '- Community authenticity over growth hacks',
        '- Performance (especially voice quality)',
        '- Respect free users (Nitro is cosmetic)',
      ],
    },
    stripe: {
      name: 'Stripe',
      philosophy: 'Increase GDP of the internet. Developer experience IS the product. API design matters. Infrastructure reliability is non-negotiable.',
      prioritizes: [
        '- Developer experience and API design',
        '- Infrastructure reliability (downtime = merchants lose money)',
        '- Documentation quality',
        '- Build the financial infrastructure for the internet',
      ],
    },
    meta: {
      name: 'Meta',
      philosophy: 'Ship to learn. Engagement loops. Network effects. "Move fast" culture. Growth as a discipline.',
      prioritizes: [
        '- Engagement time and DAU metrics',
        '- Ship imperfect and iterate quickly',
        '- Growth loops and virality',
        '- Network effects and social graphs',
      ],
    },
    amazon: {
      name: 'Amazon',
      philosophy: 'Customer obsession. Work backwards from customer needs. 16 Leadership Principles. Bias for action. Frugality.',
      prioritizes: [
        '- Customer obsession beats competitor obsession',
        '- Work backwards from customer (PR/FAQ process)',
        '- Bias for action and ownership',
        '- Frugality and operational excellence',
      ],
    },
    twitter: {
      name: 'Twitter',
      philosophy: 'Public conversation. Real-time information network. Creator economy. Brevity and speed.',
      prioritizes: [
        '- Real-time public conversation',
        '- Creator monetization and tools',
        '- Speed and simplicity',
        '- Free expression and open dialogue',
      ],
    },
  };
  
  return contexts[company] || contexts['google'];
}

// Generate example answers
async function generateExampleAnswer(
  question: string,
  category: string,
  difficulty: string,
  company: string,
  apiKey: string
): Promise<string> {
  
  const companyContext = getCompanyContext(company);
  
  const examplePrompt = `You are a Senior PM at ${companyContext.name} with 10+ years of experience.

COMPANY PHILOSOPHY:
${companyContext.philosophy}

WHAT ${companyContext.name.toUpperCase()} PRIORITIZES:
${companyContext.prioritizes.join('\n')}

Question: ${question}
Category: ${category}
Difficulty: ${difficulty}

CRITICAL: Excellent PM thinking is universal - metrics, trade-offs, user focus, business impact. Your answer should reflect ${companyContext.name}'s *approach* to solving problems, but the fundamentals of good product thinking don't change. Don't "play a character" - demonstrate real PM judgment through ${companyContext.name}'s lens.

REQUIREMENTS:
1. Lead with judgment - Clear decision/POV immediately
2. Reflect ${companyContext.name}'s priorities naturally (don't force it)
3. Be concise - 150-250 words MAX
4. Sound human and confident
5. Show creativity and insight
6. Specific metrics with rationale
7. NO framework name-dropping

Answer as a ${companyContext.name} PM would think through this problem:`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: examplePrompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 2048 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to generate example answer');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('VITE_GEMINI_API_KEY');
    
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const requestType = url.searchParams.get('type');
    const company = url.searchParams.get('company') || 'google';

    const requestBody = await req.json();

    // 🆕 NEW: Handle pushback evaluation
    if (requestType === 'pushback') {
      console.log('Evaluating pushback...');
      
      const { question, originalAnswer, originalScore, originalFeedback, pushbackText } = requestBody;

      const pushbackPrompt = `You are a Senior PM at Google evaluating another PM's pushback on their score.

ORIGINAL QUESTION: ${question}
THEIR ANSWER: ${originalAnswer}
ORIGINAL SCORE: ${originalScore}/10
ORIGINAL FEEDBACK: ${JSON.stringify(originalFeedback)}

THEIR PUSHBACK:
${pushbackText}

Your job: Evaluate their pushback like a peer PM would in a healthy debate.

CRITICAL RULES:
1. DO NOT automatically agree. Be skeptical but fair.
2. If they make valid points you missed, acknowledge it and adjust score.
3. If they're wrong, explain WHY with specific examples from their answer.
4. If they're partially right, give partial credit.
5. Challenge weak arguments. Don't let them off easy.
6. Maintain professional tone - this is peer debate, not adversarial.

RESPONSE FORMAT (Return ONLY valid JSON, no markdown):
{
  "verdict": "UPHELD" | "PARTIALLY_ADJUSTED" | "FULLY_ADJUSTED",
  "newScore": <number 0-10>,
  "reasoning": "<2-3 sentences explaining your decision>",
  "counterpoints": [
    "<Specific point they made and your response>",
    "<Another point>"
  ],
  "finalThoughts": "<1 sentence - what they should focus on next>"
}

EXAMPLES:

**UPHELD:**
"You claim you addressed metrics, but saying 'track engagement' isn't specific. Which engagement metric? What's the target? Generic metrics don't count. Score stands."

**PARTIALLY_ADJUSTED:**
"Fair point - you did mention 'DAU increase of 10%' which I missed. However, you didn't define success for the secondary segment. Adjusting from 5.5 to 6.5."

**FULLY_ADJUSTED:**
"You're right. You clearly outlined metrics (DAU, retention, NPS), trade-offs (speed vs quality), and segments. I was too harsh. Adjusting to 7.5."

Be specific. Be fair. Be rigorous.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
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
        throw new Error('Failed to evaluate pushback');
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const jsonMatch = text?.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('Could not parse pushback response');
      }

      const result = JSON.parse(jsonMatch[0]);
      console.log('Pushback evaluated:', result.verdict);
      
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle example answer generation
    if (requestType === 'example') {
      const { question, category, difficulty } = requestBody;
      console.log(`Generating example for ${company}`);
      
      const exampleAnswer = await generateExampleAnswer(
        question,
        category,
        difficulty,
        company,
        GEMINI_API_KEY
      );

      return new Response(
        JSON.stringify({ exampleAnswer }),
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

    const prompt = `You are a senior product management interviewer at Google with 10+ years of experience evaluating PM candidates.

QUESTION: ${question}
CATEGORY: ${category}
DIFFICULTY: ${difficulty}

CANDIDATE'S ANSWER:
${answer}

EVALUATION FRAMEWORK - 14 PM SKILLS:

**CORE THINKING:**
1. Problem Framing 2. User Empathy 3. Metrics Definition 4. Trade-off Analysis 5. Prioritization 6. Strategic Thinking

**EXECUTION:**
7. Stakeholder Management 8. Communication 9. Technical Judgment

**ADVANCED:**
10. Ambiguity Navigation 11. Systems Thinking 12. Market Sense 13. Experimentation 14. Risk Assessment

SCORE CALIBRATION:
**9-10:** Exceptional - Non-obvious insight, specific metrics, creative alternatives
**7-8:** Strong - Clear structure, trade-offs, specific metrics
**5-6:** Adequate - Basic structure, generic or missing metrics
**3-4:** Weak - Minimal structure, no metrics, no PM thinking
**1-2:** Very Weak - Test answers, doesn't address question, under 30 words

CRITICAL RULES:
- "This is a test" = 1/10
- Under 30 words = MAX 3/10
- No specific metrics = MAX 5/10
- No trade-offs = MAX 6/10

OUTPUT (JSON only, no markdown):
{
  "score": <0-10>,
  "strengths": ["<specific>", "<specific>", "<specific>"],
  "weaknesses": ["<specific>", "<specific>", "<specific>"],
  "detailedFeedback": "<2-3 sentences>",
  "categoryScores": {"strategy": <1-10>, "metrics": <1-10>, "prioritization": <1-10>, "design": <1-10>},
  "skillScores": {"problem_framing": <1-10>, "user_empathy": <1-10>, "metrics_definition": <1-10>, "tradeoff_analysis": <1-10>, "prioritization": <1-10>, "strategic_thinking": <1-10>, "stakeholder_mgmt": <1-10>, "communication": <1-10>, "technical_judgment": <1-10>, "ambiguity_navigation": <1-10>, "systems_thinking": <1-10>, "market_sense": <1-10>, "experimentation": <1-10>, "risk_assessment": <1-10>}
}`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!geminiResponse.ok) {
      throw new Error('Failed to evaluate answer');
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

    const feedback: FeedbackResult = JSON.parse(jsonMatch[0]);

    if (!feedback.score) {
      throw new Error('Invalid feedback structure');
    }

    // Calculate ELO
    if (userEloRating && questionEloDifficulty) {
      const eloResult = calculateEloChange(userEloRating, questionEloDifficulty, feedback.score);
      feedback.eloChange = eloResult.change;
      feedback.newEloRating = eloResult.newRating;
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