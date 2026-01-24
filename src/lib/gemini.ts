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

// Use Lovable Cloud's Supabase for Edge Functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/evaluate-answer`

export async function evaluateAnswer(
  question: string,
  answer: string,
  category: string,
  difficulty: string
): Promise<FeedbackResult> {
  console.log('Calling Edge Function:', EDGE_FUNCTION_URL)
  
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        question,
        answer,
        category,
        difficulty,
      }),
    })

    console.log('Edge Function response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge Function error response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }
      throw new Error(errorData.error || `Failed to evaluate answer (${response.status})`)
    }

    const feedback: FeedbackResult = await response.json()
    console.log('Edge Function feedback received:', feedback)

    if (!feedback.score || !feedback.strengths || !feedback.weaknesses) {
      throw new Error('Invalid feedback structure from API')
    }

    return feedback
  } catch (error) {
    console.error('Evaluation error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to evaluate answer. Please try again.')
  }
}
