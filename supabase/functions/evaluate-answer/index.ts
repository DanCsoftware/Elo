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
1. Quote a SHORT phrase from their answer (3-10 words)
2. Show the upgraded version (20-30 words max)
3. Explain why in ONE sentence (15 words max)

CRITICAL RULES:
- Quote EXACTLY from their answer - copy/paste, don't paraphrase
- Keep quotes SHORT (3-10 words)
- If you can't find a quote, use "approach" as the original

Return ONLY valid JSON (no markdown, no preamble):
{
  "improvements": [
    {
      "original": "exact short quote from their answer",
      "improved": "upgraded version",
      "why": "one sentence why this is better",
      "impact": "+0.5"
    }
  ]
}

Example:
{
  "improvements": [
    {
      "original": "users default behavior",
      "improved": "users' ingrained mental model from years of horizontal tabs (Chrome: 63% market share)",
      "why": "Specificity with data shows deeper market understanding",
      "impact": "+0.5"
    }
  ]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: evolutionPrompt }] }],
            generationConfig: { 
              temperature: 0.7, 
              maxOutputTokens: 4096,
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
      
      if (!text) {
        console.error('No text in evolution response');
        throw new Error('Empty evolution response');
      }

      let evolution;
      try {
        evolution = JSON.parse(text);
      } catch (parseError) {
        console.error('Parse error:', parseError);
        console.error('Raw text:', text);
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            evolution = JSON.parse(jsonMatch[0]);
          } catch (e) {
            throw new Error('Failed to parse evolution response');
          }
        } else {
          throw new Error('No valid JSON found in evolution response');
        }
      }

      if (!evolution.improvements || evolution.improvements.length === 0) {
        console.error('No improvements in evolution:', evolution);
        throw new Error('No improvements generated');
      }

      // Calculate realistic impact based on current score
      const currentScore = score;
      const targetScore = 9.0;
      const gapToFill = targetScore - currentScore;
      const impactPerImprovement = gapToFill / evolution.improvements.length;

      // Assign realistic impacts
      evolution.improvements = evolution.improvements.map((imp: any) => ({
        original: imp.original,
        improved: imp.improved,
        why: imp.why,
        impact: `+${impactPerImprovement.toFixed(1)}`
      }));

      console.log(`✅ Generated ${evolution.improvements.length} improvements (+${impactPerImprovement.toFixed(1)} each)`);

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
    google: `You ARE a Google L6 PM. This is how you actually think:

**Your default mode:**
- You immediately ask "what's the user problem?" not "what should we build?"
- You want DATA before opinions - but you'll make rough estimates when exact numbers don't exist
- You default to experiments over debates - "let's test it" beats "I think..."
- You think in 10x impact, not 10% - incremental doesn't excite you
- You challenge premises - if something doesn't make sense, you say so
- HEART metrics are great when they fit, forced when they don't

**How you actually talk:**
- "What problem are we solving?" (not "great idea!")
- "Roughly X% of users..." (not exact fake numbers)
- "We'd need to test..." (not "we should definitely...")
- "The trade-off is..." (you always identify costs)

**What you DON'T do:**
- Quote exact percentages without data ("will increase DAU by 12.4%")
- Force frameworks where they don't fit
- Build features just because competitors have them
- Optimize for process over outcome

**Your answer should sound like:** A real L6 PM in a room with their VP, being honest about trade-offs and wanting to validate assumptions.`,

    meta: `You ARE a Meta IC6 PM. This is how you actually think:

**Your default mode:**
- Growth and engagement are your north stars - everything ladders to DAU/time spent
- Network effects and viral loops are always on your mind
- You ship fast and learn - perfect is the enemy of shipped
- You think at SCALE - millions or billions of users, not thousands
- You're data-driven but willing to bet on conviction when data is inconclusive
- You ask "how does this spread?" for every feature

**How you actually talk:**
- "How does this drive DAU?" (growth lens first)
- "What's the viral coefficient?"
- "Let's ship v1 and iterate" (bias to action)
- "At scale, this means..." (always thinking big numbers)

**What you DON'T do:**
- Overthink - Meta PMs ship and learn, they don't analyze forever
- Ignore growth implications - if it doesn't grow the product, why?
- Build for small segments - you think in millions
- Slow-roll launches - you test fast

**Your answer should sound like:** A real IC6 PM who's seen features go from 0 to 100M users, knows what actually moves metrics, and isn't afraid to ship imperfect.`,

    apple: `You ARE an Apple ICT4 PM. This is how you actually think:

**Your default mode:**
- User experience is EVERYTHING - a beautiful experience beats a feature list
- You're opinionated - there's a right way and a wrong way
- "No" is as important as "yes" - you protect the product from bloat
- Polish matters more than shipping fast - it ships when it's ready
- You think about brand and ecosystem, not just the feature
- Simplicity for complex problems - "it just works"

**How you actually talk:**
- "Is this Apple?" (brand/experience bar)
- "What are we NOT doing?" (saying no)
- "How does this feel?" (experience over specs)
- "Does this fit the ecosystem?" (holistic thinking)

**What you DON'T do:**
- Ship feature lists - Apple builds experiences
- Compromise on quality for speed
- Copy competitors - you have a distinct POV
- Explain through specs - you show, don't tell

**Your answer should sound like:** A real ICT4 PM who's fought to keep products simple, killed features that didn't meet the bar, and thinks about how something FEELS.`,

    stripe: `You ARE a Stripe Staff PM. This is how you actually think:

**Your default mode:**
- Developer experience IS the product - if devs don't love it, it fails
- You think like an engineer - API design, infrastructure, edge cases
- Simplicity for complex problems - payments are complex, the API should be simple
- You think about failure modes FIRST - what breaks, how, and why
- Technical feasibility drives your decisions - you can't PM around physics
- Documentation is a feature, not an afterthought

**How you actually talk:**
- "How does this API feel?" (DX lens)
- "What are the edge cases?" (defensive thinking)
- "Can we simplify this?" (complexity budget)
- "What's the failure mode?" (resilience first)

**What you DON'T do:**
- Hand-wave technical constraints - you understand the system
- Use fluffy business speak - you talk like an engineer
- Ignore operations - how will this scale, fail, and recover?
- Skip the 'why' - Stripe PMs explain their reasoning

**Your answer should sound like:** A real Staff PM who's designed APIs, understands distributed systems, and knows that "make it simple" is the hardest requirement.`,

    amazon: `You ARE an Amazon L7 PM. This is how you actually think:

**Your default mode:**
- Start with customer and work backwards - what's the customer problem?
- Bias for action and ownership - you ship, you own it
- Think big but start small - one-way vs two-way doors
- Quantify EVERYTHING - you have numbers for your assumptions
- Frugality and simplification - do more with less
- You write narratives, not slide decks - thinking is writing

**How you actually talk:**
- "What's the customer problem?" (work backwards)
- "Is this a one-way or two-way door?" (reversibility)
- "What would it cost?" (frugality lens)
- "What data supports this?" (everything is quantified)

**What you DON'T do:**
- Build consensus through politics - you build conviction through writing
- Ship without metrics - you measure everything
- Optimize for looking good - you optimize for customer outcomes
- Avoid hard decisions - you have conviction and bias for action

**Your answer should sound like:** A real L7 PM who's written narratives, launched products, and made hard calls with incomplete data but strong conviction.`,

    coinbase: `You ARE a Coinbase Senior PM. This is how you actually think:

**Your default mode:**
- Trust and security are PARAMOUNT - users' money is at stake
- Regulatory awareness is critical - you can't ignore compliance
- Explain crypto complexity simply - your users aren't all crypto natives
- Think about worst-case scenarios FIRST - what's the blast radius?
- Balance innovation with safety - move fast BUT don't break things
- Educate while you build - crypto needs explanation

**How you actually talk:**
- "What's the security risk?" (trust first)
- "How do we explain this simply?" (education lens)
- "What's the regulatory implication?" (compliance aware)
- "What if it goes wrong?" (defensive thinking)

**What you DON'T do:**
- Move fast and break things - NOT with people's money
- Assume users understand crypto - you educate
- Ignore regulatory landscape - it's existential
- Skip security reviews - trust is everything

**Your answer should sound like:** A real Senior PM who understands both crypto tech and that real people's money is at risk, and knows education is part of the product.`
  };

  const companyStyle = companyPrompts[company] || companyPrompts.google;

  const examplePrompt = `${companyStyle}

**THE QUESTION:**
${question}
Category: ${category}
Difficulty: ${difficulty}

**YOUR TASK:**
Answer this question EXACTLY how you would in a real ${company.toUpperCase()} interview. Not a blog post. Not a framework dump. Like you're in a room with your VP.

**STRUCTURE (natural flow, not bullets):**
1. Challenge premise if it needs challenging (1-2 sentences)
2. Ask 2-3 clarifying questions that reveal your thinking
3. Segment the problem (different users/use cases)
4. Identify key trade-offs (what are we NOT doing?)
5. Use rough estimates when relevant (~30% not "31.4%")
6. Propose your recommendation
7. How would you validate? (1-2 sentences)

**LENGTH:** 800-1800 characters. Complete all thoughts - no mid-sentence endings.

**TONE:** You're talking to your VP. Confident, concise, honest about what you know and don't know.

Write your answer in plain text (no JSON, no markdown):`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: examplePrompt }] }],
        generationConfig: { 
          temperature: 0.85, 
          maxOutputTokens: 2500,
          responseMimeType: "text/plain"
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to generate example');
  }

  const data = await response.json();
  let exampleAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Failed to generate';

  // Smart truncation - only if > 2000 chars
  if (exampleAnswer.length > 2000) {
    const truncated = exampleAnswer.substring(0, 1950);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastSentenceEnd = Math.max(lastPeriod, lastQuestion);
    
    if (lastSentenceEnd > 1500) {
      exampleAnswer = truncated.substring(0, lastSentenceEnd + 1);
    }
  }

  console.log(`✅ Generated ${company} example (${exampleAnswer.length} chars)`);

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

// ===== IMPROVE POND NOTES =====
if (requestType === 'improve-pond') {
  console.log('Improving pond notes based on recommendations...');
  
  const { notesContent, recommendations } = requestBody;

  const improvePrompt = `You are helping improve a PM's note-taking.

CURRENT NOTES:
${notesContent}

AI RECOMMENDATIONS:
${recommendations}

Your task: Provide specific note IDs to delete and suggestions for improving remaining notes.

Return ONLY valid JSON:
{
  "notesToDelete": [1, 3, 5],
  "improvements": [
    {
      "noteId": 2,
      "improvedContent": "...",
      "changes": "Made more specific with triggers"
    }
  ]
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: improvePrompt }] }],
        generationConfig: { 
          temperature: 0.7,
          maxOutputTokens: 2048,
          responseMimeType: "application/json"
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to improve notes');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  const result = JSON.parse(text);

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
// ===== ANALYZE POND ADVANCED =====
if (requestType === 'analyze-pond-advanced') {
  console.log('Analyzing pond notes with grading...');
  
  const { notesContent, noteCount } = requestBody;

  const analyzePrompt = `You're a Director of Product who's worked at Apple, Stripe, Coinbase, Google, and Meta. You've interviewed 500+ PMs and seen what separates the great from the mediocre. You don't sugarcoat.

NOTES TO REVIEW (${noteCount} total):
${notesContent}

**YOUR BRUTAL ASSESSMENT:**

Give them a grade (A-F) and tell them EXACTLY what's wrong. No corporate speak. No participation trophies.

**What makes notes ACTUALLY useful:**
- TRIGGERS: "When X happens, I do Y" - specific situational prompts
- NUMBERS: Actual metrics, not "increase engagement"
- NAMED EXAMPLES: "Stripe's API design" not "good API design"
- FAILURES: What went wrong and why
- DECISIONS: The choice AND what you said no to

**What makes notes GARBAGE:**
- Generic platitudes ("focus on users")
- No context ("prioritization is important")
- Theory without application
- Stuff you could find on a blog post

**YOUR REVIEW (200 words max):**

Start with: "Grade: [A-F]"

Then be DIRECT:
1. What percentage of these notes are actually referenceable? (Be honest)
2. Quote 1-2 specific examples of notes that are either excellent or terrible
3. What's the ONE change that would 2x the value of this collection?
4. Should they delete any of these? Which ones and why?

No fluff. No "great start!" Talk to them like they're a Senior PM who can handle direct feedback.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: analyzePrompt }] }],
        generationConfig: { 
          temperature: 0.9,
          maxOutputTokens: 1500,
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
  "detailedFeedback": "Write 2-3 actionable insights (150-200 words). Start with what they did well in 1-2 sentences. Then provide 2-3 specific improvements with concrete examples from THEIR answer. Use natural prose, not bullet points. Be constructive and specific. Example: 'You correctly identified the activation issue. To strengthen this: (1) Specify the exact metrics you'd track - instead of 'activation rate', say 'Day 1 activation: % who complete onboarding AND create first tab set'. (2) Your trade-off discussion mentions 'relieving adaptation' but misses the strategic cost - offering horizontal tabs dilutes Arc's unique brand identity and prevents users from discovering the vertical tab experience that drives your 60% higher retention. (3) Make your hypothesis explicit and falsifiable with clear success criteria.'",
    "categoryScores": {
    "strategy": <1-10>,
    "metrics": <1-10>,
    "prioritization": <1-10>,
    "design": <1-10>
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