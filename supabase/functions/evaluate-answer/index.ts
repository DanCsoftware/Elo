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

    // 🆕 UPDATED: Check if this is a request for example answer and extract company
    const url = new URL(req.url);
    const isExampleRequest = url.searchParams.get('type') === 'example';
    const company = url.searchParams.get('company') || 'google';

    const { question, answer, category, difficulty }: EvaluationRequest = await req.json();

    // 🆕 UPDATED: Handle example answer generation with company
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

    // ===== ORIGINAL EVALUATION LOGIC CONTINUES =====

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

    const prompt = `You are a senior product management interviewer at Google with 10+ years of experience evaluating PM candidates. Your goal is to provide honest, calibrated feedback that helps candidates improve their PM thinking.

QUESTION CONTEXT:
Question: ${question}
Category: ${category}
Difficulty: ${difficulty}

CANDIDATE'S ANSWER:
${answer}

---

EVALUATION FRAMEWORK:

You are evaluating PM THINKING QUALITY across these dimensions:

1. **STRUCTURED APPROACH**
   - Good: Uses frameworks (CIRCLES, HEART, 5 Whys, Impact/Effort matrix) or creates their own logical structure
   - Bad: Stream of consciousness, jumps between ideas randomly

2. **PROBLEM UNDERSTANDING**
   - Good: Clarifies assumptions, identifies constraints, defines success
   - Bad: Jumps to solutions without understanding the problem space

3. **ANALYTICAL DEPTH**
   - Good: Considers trade-offs, thinks through second-order effects, identifies risks
   - Bad: Surface-level thinking, doesn't explore implications

4. **METRIC-DRIVEN THINKING**
   - Good: Proposes specific, measurable metrics; explains why they matter
   - Bad: No metrics, or generic ones like "increase engagement"

5. **USER EMPATHY**
   - Good: Considers different user segments, pain points, contexts
   - Bad: Generic "users want" statements without segmentation

6. **BUSINESS ACUMEN**
   - Good: Connects decisions to business outcomes, considers costs/ROI
   - Bad: Ignores business viability or resource constraints

7. **COMMUNICATION**
   - Good: Clear, concise, well-organized with signposts
   - Bad: Verbose, unclear, hard to follow

---

SCORE CALIBRATION (Use the full 1-10 range):

**9-10: Exceptional (Top 5%)**
- Leads with clear decision/judgment
- Identifies non-obvious core insight (like "reversibility" or "foundational primitive")
- Proposes creative alternatives beyond given options
- Names specific metrics with clear rationale (not generic)
- Sounds like a senior PM, not a student
- Example: "I wouldn't ship this. Issue categorization is a foundational primitive - wrong 40% means users lose trust. Instead: opt-in suggestions, track correction rate."

**7-8: Strong (Top 25%)**
- Clear structure and decision
- Shows trade-off thinking
- Specific metrics with reasoning
- Missing the "aha" insight or creative approach
- Sounds competent but conventional
- Example: "I'd delay. 40% error rate damages trust. Focus on improving model accuracy to 80%+. Track accuracy and user satisfaction."

**5-6: Adequate (Middle 50%)** 
- Has basic structure
- Identifies the problem
- Generic metrics OR no metrics
- No real trade-off analysis
- Feels surface-level
- Example: "I'd delay it. Need to improve accuracy. Could track user feedback."

**3-4: Weak (Bottom 25%)**
- Minimal structure
- Misses key considerations
- No metrics
- Doesn't demonstrate PM thinking
- Example: "Just ship it as beta and iterate based on feedback."

**1-2: Very Weak (Bottom 5%)**
- Doesn't answer the question
- Test/joke answers
- Shows fundamental misunderstanding
- Example: "This is a test answer" or "Add more features"

CRITICAL CALIBRATION RULES:
1. **Most answers should be 3-4 or 7-8, NOT 5-6**
2. **5.5 should be RARE** - it means exactly average, which is unusual
3. **Be harsh on missing metrics** - No specific metrics = max 5/10
4. **Be harsh on no trade-offs** - No trade-offs mentioned = max 6/10
5. **Use decimals** - Don't default to whole numbers. 6.5, 7.5 are valid.
6. **Framework name-dropping alone ≠ high score** - Saying "I'll use RICE" doesn't make it good

SCORE DISTRIBUTION TARGET:
- 1-2: 5% (nonsense answers)
- 3-4: 20% (weak, missing basics)
- 5-6: 30% (adequate, safe but unremarkable)
- 7-8: 35% (strong, would advance in interview)
- 9-10: 10% (exceptional, would strongly advance)

If you're tempted to give 5.5 again, ask: "What separates this from an average answer?" If nothing, go lower (4) or higher (7).

---

SCORING DECISION TREE:

1. **Does the answer actually address the question?**
   - No → Score 1-2 (regardless of writing quality)
   - Yes → Continue

2. **Is there ANY analytical structure or framework?**
   - No structure → Max 4/10
   - Some structure → 5-7/10 range
   - Strong structure → 7-10/10 range

3. **Are trade-offs explicitly considered?**
   - No trade-offs → Cannot exceed 6/10
   - Generic trade-offs → 6-7/10 range
   - Specific, insightful trade-offs → 7-10/10 range

4. **Are metrics specific and justified?**
   - No metrics → Cannot exceed 5/10
   - Generic metrics → 5-6/10 range  
   - Specific, well-reasoned metrics → 7-10/10 range

5. **Depth of analysis for difficulty level:**
   - Easy questions: Should be thorough and complete → Incomplete = max 6/10
   - Medium questions: Should show trade-off thinking → No trade-offs = max 5/10
   - Hard questions: Should show sophisticated judgment → No sophistication = max 4/10

---

OUTPUT FORMAT (Return ONLY valid JSON, no markdown):

{
  "score": <number 0-10, can use decimals like 6.5>,
  "strengths": [
    "<Specific strength with evidence from their answer>",
    "<Another specific strength>",
    "<Third specific strength>"
  ],
  "weaknesses": [
    "<Specific gap with what was missing>",
    "<Another specific gap>",
    "<Third specific gap>"
  ],
  "detailedFeedback": "<2-3 sentences of actionable advice on how to improve. Be direct but constructive. Reference specific frameworks or approaches they should learn.>",
  "categoryScores": {
    "strategy": <1-10>,
    "metrics": <1-10>,
    "prioritization": <1-10>,
    "design": <1-10>
  }
}

Remember: Your feedback shapes PM careers. Be honest, be calibrated, be helpful.`;

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