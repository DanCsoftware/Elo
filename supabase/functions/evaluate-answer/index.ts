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
if (requestType === 'example') {
  console.log('Generating example answer...');
  
  const { question, category, difficulty } = requestBody;
  const company = url.searchParams.get('company') || 'google';

  // Company-specific philosophies
  const companyStyles = {
    google: {
      style: "Data-driven, user-centric, emphasize metrics and experimentation. Google PMs lead with 'What does the data say?' and always quantify impact.",
      frameworks: "Use HEART metrics, OKRs, A/B testing rigor. Always show funnel analysis and conversion math.",
      tone: "Analytical, hypothesis-driven, metric-focused. Start with data, end with experiments."
    },
    apple: {
      style: "User experience first, opinionated about design. Apple PMs defend product decisions with conviction about user needs.",
      frameworks: "Jobs-to-be-done, user journey mapping. Less metrics, more 'this is the right experience because...'",
      tone: "Confident, design-forward, user-empathetic. Strong POV on what users want."
    },
    meta: {
      style: "Growth-obsessed, network effects, viral loops. Meta PMs speak in DAU/MAU and retention curves.",
      frameworks: "Growth accounting, cohort retention, viral coefficient. Everything ties to growth.",
      tone: "Aggressive, growth-focused, quantitative. Every answer includes growth metrics."
    },
    stripe: {
      style: "Developer-centric, API-first, infrastructure thinking. Stripe PMs consider system design and developer experience.",
      frameworks: "Technical feasibility, API design, backwards compatibility. Consider platform implications.",
      tone: "Technical, thoughtful, infrastructure-minded. Balance user needs with system constraints."
    },
    amazon: {
      style: "Customer obsession, working backwards from customer needs. Amazon PMs write press releases before building.",
      frameworks: "Working backwards, six-page narratives, dive deep. Start with customer problem.",
      tone: "Customer-first, detail-oriented, long-term thinking. Cite customer pain points."
    },
    coinbase: {
      style: "Crypto-native, regulatory aware, trust and security paramount. Coinbase PMs balance innovation with compliance.",
      frameworks: "Security-first design, regulatory constraints, crypto economics.",
      tone: "Cautious, security-minded, regulatory-aware. Consider trust implications."
    },
    discord: {
      style: "Community-first, engagement-driven, creator empowerment. Discord PMs optimize for community health.",
      frameworks: "Community metrics, engagement loops, creator tools.",
      tone: "Community-focused, engagement-driven, creator-centric."
    },
    chainlink: {
      style: "Decentralization, oracle networks, Web3 infrastructure. Deep technical understanding required.",
      frameworks: "Decentralized systems, blockchain architecture, node economics.",
      tone: "Technical, decentralization-focused, infrastructure-level thinking."
    },
    twitter: {
      style: "Real-time engagement, conversation health, public discourse. Balance virality with safety.",
      frameworks: "Engagement metrics, conversation quality, content moderation.",
      tone: "Fast-paced, engagement-focused, balance growth and safety."
    }
  };

  const companyInfo = companyStyles[company as keyof typeof companyStyles] || companyStyles.google;

  const examplePrompt = `You are generating a REFERENCE-QUALITY answer that would score 9.0-9.5 out of 10 in a ${company.toUpperCase()} PM interview.

QUESTION: ${question}
CATEGORY: ${category}
DIFFICULTY: ${difficulty}
COMPANY: ${company.toUpperCase()}

COMPANY PHILOSOPHY:
${companyInfo.style}

KEY FRAMEWORKS FOR ${company.toUpperCase()}:
${companyInfo.frameworks}

TONE:
${companyInfo.tone}

CRITICAL REQUIREMENTS FOR A 9/10 ANSWER:

1. **START WITH CLARIFYING QUESTIONS** (30-50 words)
   - Ask about context, constraints, metrics
   - Show you need data before deciding
   - Example: "Before I dive in, I'd want to understand: What's our current conversion rate? Where is traffic coming from? What's our baseline?"

2. **QUANTIFY THE FUNNEL** (if relevant)
   - Break down the flow with actual %s
   - Example: "If 1M visitors but only 100K reach checkout, that's a 10% progression rate - the issue is earlier in the funnel"
   - Show math, not just stages

3. **EXPLICIT PRIORITIZATION WITH REASONING** (critical)
   - Don't list 5 things equally
   - Say: "I'd start with X because Y, then move to Z if that doesn't work"
   - Rank by impact/effort or likelihood

4. **INCLUDE TRADEOFFS** (required)
   - "The risk of X is Y, but the benefit is Z"
   - "If we do A, we can't do B because..."
   - Show you understand constraints

5. **SPECIFIC METRICS, NOT VAGUE GOALS**
   - Bad: "improve engagement"
   - Good: "increase DAU/MAU from 35% to 40% in 3 months"
   - Always include timeframes and targets

6. **COMPANY-SPECIFIC FRAMEWORKS**
   - Use ${company}'s actual language and tools
   - Reference their known practices
   - ${companyInfo.frameworks}

7. **END WITH VALIDATION PLAN**
   - How would you test this?
   - What metrics prove success?
   - What would make you change course?

STRUCTURE:
[Clarifying Questions - 50 words]

[Framework/Approach - explain your thinking model - 100 words]

[Prioritized Analysis - ranked options with reasoning - 150 words]

[Specific Recommendation with Metrics - 100 words]

[Validation Plan - how you'd test - 50 words]

TOTAL: 400-500 words. Be PRECISE. Be SPECIFIC. Use NUMBERS.

This should be a REFERENCE answer that shows mastery of PM craft.

Generate the answer now in plain text (no JSON, no markdown formatting):`;

  try {
    const completion = await model.generateContent(examplePrompt);
    const exampleAnswer = completion.response.text();

    return new Response(
      JSON.stringify({ exampleAnswer }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Example generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
}

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

CRITICAL INSTRUCTIONS:
1. **DEFAULT TO UPHELD** - Most pushbacks are wrong. The original evaluation was done carefully.
2. **BE EXTREMELY SKEPTICAL** - They need to prove the evaluation missed something significant, not just complain.
3. **Require CONCRETE EVIDENCE** - Vague claims like "I did mention metrics" don't count unless they quote EXACTLY where.
4. **Compare to Staff+ PM standards** - Would a Principal PM at Google/Meta/Stripe answer this way?
5. **Check for reading comprehension** - Did they actually understand what the original feedback said?

WHAT COUNTS AS VALID PUSHBACK:
✅ They quote SPECIFIC text from their answer that was overlooked
✅ They cite a framework/metric by name that WAS in their answer but wasn't credited
✅ They provide industry context that makes their approach valid (with sources)
✅ They correctly identify a factual error in the evaluation

WHAT DOES NOT COUNT:
❌ "I think my answer was better than the score suggests" (opinion, no evidence)
❌ "I mentioned metrics" without quoting where
❌ Disagreeing with the rubric itself
❌ Arguing semantics or word choice
❌ Claiming implied knowledge that wasn't written

ADJUSTMENT GUIDELINES:
- **UPHELD (85% of cases)**: Original score was fair. Pushback is emotional, not substantive.
- **PARTIALLY ADJUSTED (+1-2 points)**: Found ONE legitimate overlooked element, but overall assessment stands.
- **FULLY ADJUSTED (+3-5 points)**: Multiple significant elements were missed AND answer truly deserves higher score.

NEVER adjust more than 5 points. If they claim they deserve 9/10 from a 4/10, they're delusional.

RESPONSE FORMAT (Return ONLY valid JSON, no markdown):
{
  "verdict": "UPHELD" | "PARTIALLY_ADJUSTED" | "FULLY_ADJUSTED",
  "newScore": <number 0-10>,
  "reasoning": "<2-3 sentences explaining decision with SPECIFIC examples from their answer>",
  "counterpoints": [
    "<Challenge their weakest argument with evidence>",
    "<Another specific counterpoint>"
  ],
  "finalThoughts": "<1 sentence - what they should actually focus on improving>"
}

EXAMPLES:

**UPHELD (Most common):**
"You claim you 'clearly defined metrics' but your answer only says 'track engagement' with no baseline, target, or timeframe. That's not a defined metric. Score remains 5.5/10."

**PARTIALLY ADJUSTED (Rare):**
"You're right - you did specify 'increase DAU by 10% in Q2' which I initially missed. However, you still didn't address the secondary user segment at all. Adjusting from 5.5 to 6.5/10."

**FULLY ADJUSTED (Very rare, <5% of cases):**
"After re-reading, you did provide: (1) Specific metrics with targets, (2) Clear trade-offs with opportunity cost analysis, (3) Risk mitigation strategies. I was too harsh on initial read. Adjusting to 8.0/10."

Be rigorous. Be fair. But be MUCH more likely to uphold than adjust.`;


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

SCORE CALIBRATION (Use the full 1-10 range WITH DECIMALS):

Use decimals for precision: 6.2, 6.9, 7.5, 8.3, etc.

**9.0-10.0: Exceptional (Top 5%)**
- 9.8-10.0: Perfect answer, nothing to improve
- 9.0-9.7: Outstanding, minor refinements possible

**7.0-8.9: Strong (Top 25%)**
- 8.0-8.9: Very strong, would definitely advance
- 7.0-7.9: Solid, likely to advance

**5.0-6.9: Adequate (Middle 50%)** 
- 6.0-6.9: Acceptable but needs improvement
- 5.0-5.9: Barely adequate, significant gaps

**3.0-4.9: Weak (Bottom 25%)**
- 4.0-4.9: Major gaps, unlikely to advance
- 3.0-3.9: Fundamental issues

**1.0-2.9: Very Weak (Bottom 5%)**
- 2.0-2.9: Misunderstands question
- 1.0-1.9: Test answer or gibberish

Always lean to use decimals - they matter. 6.2 vs 6.9 is a significant difference.

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
}
OUTPUT FORMAT (Return ONLY valid JSON, no markdown):

{
  "score": <overall score 0-10>,
  "strengths": [
    "<Quote exact phrase from answer> - <Why this is good>",
    "<Another quote> - <Explanation>",
    "<Third quote> - <Explanation>"
  ],
  "weaknesses": [
    "<What's missing or weak> - <Quote where this was attempted or should have been>",
    "<Another gap> - <Specific example>",
    "<Third gap> - <Evidence>"
  ],
  "detailedFeedback": "<Reference SPECIFIC phrases from their answer, not vague descriptions>",
  // ... rest
}

CRITICAL: Always QUOTE the candidate's exact words when praising or criticizing. Don't say "you mentioned metrics" - say "you said 'increase DAU by 10%' which shows..."`;


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