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

SCORE CALIBRATION (Be honest, not inflated):

**9-10: Exceptional (Top 5% of candidates)**
- Uses recognized frameworks unprompted OR creates elegant custom structure
- Identifies non-obvious trade-offs and second-order effects
- Proposes specific metrics with clear rationale
- Considers edge cases without being prompted
- Shows deep understanding of user psychology and business constraints
- Example: "I'd use HEART framework here. Happiness: NPS by user segment (power vs new). Engagement: DAU/MAU split by feature complexity. For adoption, I'd track new users completing 3+ core workflows in first week, as that's our historical retention inflection point. The trade-off is that optimizing for power users (40 metrics) might increase our already-high activation friction for the 80% casual segment, so I'd propose progressive disclosure..."

**7-8: Strong (Top 25%)**
- Clear structure with logical flow
- Addresses multiple dimensions of the problem
- Proposes specific metrics and explains reasoning
- Considers at least one meaningful trade-off
- Shows PM intuition about user needs and business impact
- Example: "First, I'd segment users: power users need depth, new users need simplicity. I'd propose a tiered dashboard - simplified default view with 5 key metrics, plus a 'Pro Mode' toggle. We'd measure success via: (1) New user activation rate, (2) Power user retention, (3) Support ticket volume by user type. Main trade-off is dev time vs impact..."

**5-6: Adequate (Middle 50%)**
- Has some structure but incomplete
- Identifies the problem but misses key considerations
- Mentions metrics but they're generic or poorly justified
- Limited trade-off analysis
- Workable but needs significant improvement
- Example: "We should simplify the dashboard for new users and keep advanced features for power users. We could measure user satisfaction and engagement. We need to balance between the two groups."

**3-4: Weak (Bottom 25%)**
- Minimal or no structure
- Surface-level thinking, major gaps
- No specific metrics or very generic ones
- Misses core aspects of the problem
- Doesn't demonstrate PM thinking patterns
- Example: "Just make two different dashboards - one simple, one complex. Users will be happier."

**1-2: Very Weak (Bottom 5%)**
- Doesn't actually answer the question asked
- Test answers, jokes, meta-commentary about the evaluation itself
- Shows fundamental misunderstanding of PM role
- One-sentence answers with no analysis
- No evidence of PM thinking
- Example: "This is a test answer to see how you evaluate" OR "Add more features"

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

    // Call Gemini API - use header for API key instead of URL parameter
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
