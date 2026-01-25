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
  userEloRating?: number; // 🆕 NEW: User's current ELO
  questionEloDifficulty?: number; // 🆕 NEW: Question's ELO difficulty
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
  skillScores?: { [key: string]: number }; // 🆕 NEW: 14 skill scores
  eloChange?: number; // 🆕 NEW: Rating change (+/- points)
  newEloRating?: number; // 🆕 NEW: Updated rating
}

// 🆕 UPDATED: More aggressive ELO calculation
function calculateEloChange(
  currentRating: number,
  questionDifficulty: number,
  scoreOutOf10: number,
  kFactor: number = 40 // Increased from 32 for bigger swings
): { newRating: number; change: number } {
  // Expected score based on rating difference
  const expectedScore = 1 / (1 + Math.pow(10, (questionDifficulty - currentRating) / 400));
  
  // Actual score (normalized to 0-1)
  const actualScore = scoreOutOf10 / 10;
  
  // 🆕 NEW: Apply multiplier for extreme performances
  let adjustedKFactor = kFactor;
  
  // Really bad answer (0-3/10)? Punish harder
  if (scoreOutOf10 < 4) {
    adjustedKFactor = kFactor * 1.5; // 50% more penalty
  }
  // Excellent answer (9-10/10)? Reward more
  else if (scoreOutOf10 >= 9) {
    adjustedKFactor = kFactor * 1.25; // 25% more reward
  }
  
  // Calculate change
  const change = Math.round(adjustedKFactor * (actualScore - expectedScore));
  
  // Apply change with floor/ceiling
  const newRating = Math.max(800, Math.min(2200, currentRating + change));
  
  console.log(`📊 ELO Calculation:
    Current: ${currentRating}
    Question Difficulty: ${questionDifficulty}
    Score: ${scoreOutOf10}/10
    Expected: ${(expectedScore * 10).toFixed(1)}/10
    Change: ${change > 0 ? '+' : ''}${change}
    New: ${newRating}`);
  
  return { newRating, change };
}

// 🆕 NEW: Get company-specific context
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

// 🆕 UPDATED: Function to generate example answers
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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: examplePrompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to generate example:', errorText);
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
      console.error('VITE_GEMINI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const isExampleRequest = url.searchParams.get('type') === 'example';
    const company = url.searchParams.get('company') || 'google';

    const { 
      question, 
      answer, 
      category, 
      difficulty,
      userEloRating,
      questionEloDifficulty
    }: EvaluationRequest = await req.json();

    // Handle example answer generation
    if (isExampleRequest) {
      console.log(`Generating example answer for ${company}, category: ${category}, difficulty: ${difficulty}`);
      
      const exampleAnswer = await generateExampleAnswer(
        question,
        category,
        difficulty,
        company,
        GEMINI_API_KEY
      );

      console.log('Example answer generated successfully');

      return new Response(
        JSON.stringify({ exampleAnswer }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ===== EVALUATION LOGIC WITH 14 SKILLS =====

    // Validate input
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

    console.log(`Evaluating answer for category: ${category}, difficulty: ${difficulty}`);

    // 🆕 UPDATED PROMPT: Evaluate against 14 skills
    const prompt = `You are a senior product management interviewer at Google with 10+ years of experience evaluating PM candidates. Your goal is to provide honest, calibrated feedback that helps candidates improve their PM thinking.

QUESTION CONTEXT:
Question: ${question}
Category: ${category}
Difficulty: ${difficulty}

CANDIDATE'S ANSWER:
${answer}

---

EVALUATION FRAMEWORK - 14 PM SKILLS:

**CORE THINKING SKILLS:**
1. **Problem Framing** - Defining the right problem to solve, clarifying assumptions, identifying constraints
2. **User Empathy** - Understanding user needs, pain points, segmentation, user research
3. **Metrics Definition** - Defining success criteria, KPIs, measurement frameworks (HEART, AARRR)
4. **Trade-off Analysis** - Evaluating costs/benefits, opportunity cost, "if we do X, we sacrifice Y"
5. **Prioritization** - RICE, ICE, Impact/Effort, sequencing decisions
6. **Strategic Thinking** - Long-term vision, positioning, market dynamics, competitive landscape

**EXECUTION SKILLS:**
7. **Stakeholder Management** - Aligning teams, executives, cross-functional collaboration
8. **Communication** - Clear articulation, storytelling, conciseness
9. **Technical Judgment** - Understanding feasibility, constraints, technical trade-offs

**ADVANCED SKILLS:**
10. **Ambiguity Navigation** - Thriving with incomplete information, comfort with uncertainty
11. **Systems Thinking** - Understanding second-order effects, interconnections, unintended consequences
12. **Market Sense** - Competitive positioning, market timing, TAM understanding
13. **Experimentation** - A/B testing, hypothesis-driven thinking, learning loops
14. **Risk Assessment** - Identifying and mitigating risks, reversibility analysis

---

SCORE CALIBRATION (Use full 1-10 range):

**9-10: Exceptional (Top 5%)**
- Leads with clear judgment
- Non-obvious core insight
- Creative alternatives
- Specific metrics with rationale
- Sounds like senior PM

**7-8: Strong (Top 25%)**
- Clear structure
- Trade-off thinking
- Specific metrics
- Competent but conventional

**5-6: Adequate (Middle 50%)**
- Basic structure
- Generic metrics OR no metrics
- Surface-level

**3-4: Weak (Bottom 25%)**
- Minimal structure
- No metrics
- Doesn't demonstrate PM thinking

**1-2: Very Weak (Bottom 5%)**
- Doesn't answer question
- Test/joke answers

CRITICAL RULES:
- No specific metrics = max 5/10
- No trade-offs = max 6/10
- Use decimals (6.5, 7.5)

---

OUTPUT FORMAT (Return ONLY valid JSON, no markdown):

{
  "score": <overall score 0-10>,
  "strengths": [
    "<Specific strength>",
    "<Another strength>",
    "<Third strength>"
  ],
  "weaknesses": [
    "<Specific gap>",
    "<Another gap>",
    "<Third gap>"
  ],
  "detailedFeedback": "<2-3 sentences of actionable advice>",
  "categoryScores": {
    "strategy": <1-10>,
    "metrics": <1-10>,
    "prioritization": <1-10>,
    "design": <1-10>
  },
  "skillScores": {
    "problem_framing": <1-10>,
    "user_empathy": <1-10>,
    "metrics_definition": <1-10>,
    "tradeoff_analysis": <1-10>,
    "prioritization": <1-10>,
    "strategic_thinking": <1-10>,
    "stakeholder_mgmt": <1-10>,
    "communication": <1-10>,
    "technical_judgment": <1-10>,
    "ambiguity_navigation": <1-10>,
    "systems_thinking": <1-10>,
    "market_sense": <1-10>,
    "experimentation": <1-10>,
    "risk_assessment": <1-10>
  }
}

Evaluate which skills are most relevant to this question and score them accordingly. Skills not heavily tested can be scored 0 or omitted.`;

    // Call Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

    // Extract JSON
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

    // 🆕 NEW: Calculate ELO change if ratings provided
    if (userEloRating && questionEloDifficulty) {
      const eloResult = calculateEloChange(
        userEloRating,
        questionEloDifficulty,
        feedback.score
      );
      
      feedback.eloChange = eloResult.change;
      feedback.newEloRating = eloResult.newRating;
      
      console.log(`ELO: ${userEloRating} → ${eloResult.newRating} (${eloResult.change > 0 ? '+' : ''}${eloResult.change})`);
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