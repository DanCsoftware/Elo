import { config } from '@/config/keys'

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

const EDGE_FUNCTION_URL = `${config.supabaseUrl}/functions/v1/evaluate-answer`

export async function evaluateAnswer(
  question: string,
  answer: string,
  category: string,
  difficulty: string
): Promise<FeedbackResult> {
  try {
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.supabaseAnonKey}`,
      },
      body: JSON.stringify({
        question,
        answer,
        category,
        difficulty,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to evaluate answer (${response.status})`)
    }

    const feedback: FeedbackResult = await response.json()

    if (!feedback.score || !feedback.strengths || !feedback.weaknesses) {
      throw new Error('Invalid feedback structure from API')
    }

    return feedback
  } catch (error) {
    console.error('Evaluation error:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to evaluate answer. Please try again.')
  }
}
