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
const LOVABLE_CLOUD_URL = 'https://amalmykklpugtdeghooq.supabase.co'
const LOVABLE_CLOUD_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtYWxteWtrbHB1Z3RkZWdob29xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxMzkxMDUsImV4cCI6MjA4NDcxNTEwNX0.5goe3_ZQvtpUg2fgLPpswmZ0FhtcgCb_wboNv3-O1OU'
const EDGE_FUNCTION_URL = `${LOVABLE_CLOUD_URL}/functions/v1/evaluate-answer`

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
        'Authorization': `Bearer ${LOVABLE_CLOUD_ANON_KEY}`,
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
