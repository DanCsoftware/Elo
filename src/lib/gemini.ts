import { GoogleGenerativeAI } from "@google/generative-ai"

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

if (!apiKey) {
  throw new Error('Missing Gemini API key')
}

const genAI = new GoogleGenerativeAI(apiKey)

export interface FeedbackResult {
  score: number
  strengths: string[]
  weaknesses: string[]
  detailedFeedback: string
  categoryScores: {
    strategy: number
    metrics: number
    prioritization: number
    design: number
  }
}

export async function evaluateAnswer(
  question: string,
  answer: string,
  category: string,
  difficulty: string
): Promise<FeedbackResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

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
}`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response")
    }
    
    const feedback: FeedbackResult = JSON.parse(jsonMatch[0])
    
    if (!feedback.score || !feedback.strengths || !feedback.weaknesses) {
      throw new Error("Invalid feedback structure from AI")
    }
    
    return feedback
  } catch (error) {
    console.error("Gemini API error:", error)
    throw new Error("Failed to evaluate answer. Please try again.")
  }
}
