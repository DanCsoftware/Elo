export interface UserStats {
  streak: number;
  totalAnswered: number;
  avgScore: number;
  weeklyImprovement: number;
}

export interface SkillProgress {
  name: string;
  percentage: number;
  category: Category;
}

export type Category = 'strategy' | 'metrics' | 'prioritization' | 'design';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Question {
  id: string;
  text: string;
  category: Category;
  difficulty: Difficulty;
  hint: string;
}

export interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  recentScores: number[];
}

export interface HistoryItem {
  id: string;
  question: Question;
  userAnswer: string;
  feedback: Feedback;
  date: string;
}

export const userStats: UserStats = {
  streak: 7,
  totalAnswered: 23,
  avgScore: 6.8,
  weeklyImprovement: 12,
};

export const skillProgress: SkillProgress[] = [
  { name: 'Product Strategy', percentage: 72, category: 'strategy' },
  { name: 'Metrics & Analytics', percentage: 58, category: 'metrics' },
  { name: 'Prioritization', percentage: 85, category: 'prioritization' },
  { name: 'Product Design', percentage: 45, category: 'design' },
];

export const questions: Question[] = [
  {
    id: '1',
    text: 'You\'re the PM for a ride-sharing app. Monthly active users have dropped 15% over the last quarter. How would you diagnose the root cause and what metrics would you track?',
    category: 'metrics',
    difficulty: 'Hard',
    hint: 'Consider breaking down the user journey into stages and looking at drop-off points. Think about cohort analysis and segmentation.',
  },
  {
    id: '2',
    text: 'Your CEO wants to launch 5 new features this quarter, but you have resources for only 2. Walk me through your prioritization framework.',
    category: 'prioritization',
    difficulty: 'Medium',
    hint: 'Think about frameworks like RICE, ICE, or impact vs effort matrices. Consider stakeholder alignment too.',
  },
  {
    id: '3',
    text: 'How would you design an onboarding experience for a new B2B SaaS product targeting enterprise customers?',
    category: 'design',
    difficulty: 'Medium',
    hint: 'Consider the different stakeholders in B2B: admins, end users, IT. Think about progressive disclosure.',
  },
  {
    id: '4',
    text: 'Your company is considering entering the food delivery market. How would you assess whether this is a good strategic move?',
    category: 'strategy',
    difficulty: 'Hard',
    hint: 'Think about market size, competition, unit economics, and how it fits with your company\'s core competencies.',
  },
  {
    id: '5',
    text: 'Define the north star metric for a meditation app. Explain why you chose it and how it connects to business success.',
    category: 'metrics',
    difficulty: 'Easy',
    hint: 'A good north star metric should reflect user value, be measurable, and correlate with revenue growth.',
  },
  {
    id: '6',
    text: 'You have three feature requests: one from sales (urgent), one from your biggest customer, and one that improves technical debt. How do you decide?',
    category: 'prioritization',
    difficulty: 'Medium',
    hint: 'Consider short-term vs long-term impact, the cost of delay, and how to communicate trade-offs to stakeholders.',
  },
  {
    id: '7',
    text: 'Design a notification system for a project management tool. What types of notifications would you include and how would you prevent notification fatigue?',
    category: 'design',
    difficulty: 'Easy',
    hint: 'Think about urgency levels, user preferences, and smart defaults. Consider batching and timing.',
  },
  {
    id: '8',
    text: 'Your product has achieved product-market fit in one market. How would you approach expanding to a new geography?',
    category: 'strategy',
    difficulty: 'Hard',
    hint: 'Consider localization, regulatory requirements, competitive landscape, and go-to-market strategy.',
  },
];

export const sampleFeedback: Feedback = {
  score: 7.5,
  strengths: [
    'Strong understanding of the prioritization framework',
    'Good consideration of stakeholder alignment',
    'Clear communication of trade-offs',
  ],
  improvements: [
    'Could include more specific examples',
    'Consider adding quantitative criteria',
    'Address potential risks in implementation',
  ],
  detailedFeedback: 'Your answer demonstrates a solid grasp of prioritization principles. You correctly identified the need for a structured framework and considered multiple stakeholder perspectives. To strengthen your response, try incorporating specific examples from past experience and adding quantitative metrics to support your prioritization decisions. Consider how you would communicate these decisions to the CEO and handle pushback.',
  recentScores: [6.5, 7.0, 7.5],
};

export const historyItems: HistoryItem[] = [
  {
    id: 'h1',
    question: questions[1],
    userAnswer: 'I would use the RICE framework to evaluate each feature based on Reach, Impact, Confidence, and Effort...',
    feedback: sampleFeedback,
    date: '2024-01-20',
  },
  {
    id: 'h2',
    question: questions[4],
    userAnswer: 'The north star metric for a meditation app should be "weekly active meditation minutes"...',
    feedback: { ...sampleFeedback, score: 8.5, recentScores: [7.0, 7.5, 8.5] },
    date: '2024-01-19',
  },
  {
    id: 'h3',
    question: questions[2],
    userAnswer: 'For enterprise B2B onboarding, I would design a multi-phase approach...',
    feedback: { ...sampleFeedback, score: 6.0, recentScores: [5.5, 6.0, 6.0] },
    date: '2024-01-18',
  },
  {
    id: 'h4',
    question: questions[0],
    userAnswer: 'To diagnose the 15% drop in MAUs, I would first segment users by acquisition channel...',
    feedback: { ...sampleFeedback, score: 7.0, recentScores: [6.5, 6.5, 7.0] },
    date: '2024-01-17',
  },
];

export const categoryLabels: Record<Category, string> = {
  strategy: 'Product Strategy',
  metrics: 'Metrics & Analytics',
  prioritization: 'Prioritization',
  design: 'Product Design',
};

export const getCategoryColor = (category: Category): string => {
  const colors: Record<Category, string> = {
    strategy: 'bg-primary/10 text-primary',
    metrics: 'bg-success/10 text-success',
    prioritization: 'bg-warning/10 text-warning',
    design: 'bg-accent/10 text-accent',
  };
  return colors[category];
};

export const getDifficultyColor = (difficulty: Difficulty): string => {
  const colors: Record<Difficulty, string> = {
    Easy: 'bg-success/10 text-success',
    Medium: 'bg-warning/10 text-warning',
    Hard: 'bg-destructive/10 text-destructive',
  };
  return colors[difficulty];
};
