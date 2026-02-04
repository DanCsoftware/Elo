# Elo

An ELO-rated PM interview practice platform that helps product managers develop real skills through rigorous AI evaluation.

## The Problem

Traditional PM interview prep platforms teach you how to "perform" in interviews, not how to actually improve your product thinking. They give generic feedback and don't track skill development over time. Elo is different: it uses competitive ELO ratings (like chess) to measure your actual PM capabilities across 14 distinct skills.

## What It Does

- **Adaptive Practice**: Questions automatically match your skill level (800-2200 ELO range)
- **Rigorous AI Evaluation**: Elite-level feedback that develops real skills, not interview tricks
- **14-Skill Breakdown**: Track granular performance across Problem Framing, Metrics Definition, Trade-off Analysis, Strategic Thinking, etc.
- **Rating Journey**: Visualize your improvement over time with interactive charts
- **Company-Specific Examples**: Generate reference answers styled for Google, Meta, Stripe, Amazon, etc.
- **Push Back System**: Contest your scores with evidence-based arguments
- **Percentile Ranking**: See how you compare against other users

**Philosophy:** This platform develops SKILLS (quantification, framework usage, contrarian thinking), not interview tactics.

## How It Works
```
User Answer → Supabase Edge Function → Gemini 2.5 Flash → Rigorous Evaluation
                                              ↓
                                    Score (0-10 with decimals)
                                    14-skill breakdown
                                    Category scores
                                              ↓
                                    ELO Calculation (±5-60 points)
                                              ↓
                                    PostgreSQL (user_sessions table)
                                              ↓
                            Rating Journey Chart + Percentile Badge
```

**Architecture decisions:**
- Supabase backend: Authentication, database, edge functions
- Server-side AI evaluation: Keeps API keys secure
- Adaptive difficulty: Questions ±150 points from your rating
- Persistent practice: LocalStorage saves in-progress answers

## Tech Stack

**Frontend:**
- React 18 + TypeScript + Vite
- Tailwind CSS + shadcn/ui (components)
- Recharts (rating journey visualization)
- React Router (navigation)

**Backend:**
- Supabase (PostgreSQL database + edge functions)
- Google Gemini 2.5 Flash (AI evaluation)
- Row Level Security (RLS policies)

**Data Model:**
- `users` - User profiles
- `user_stats` - ELO ratings and category performance
- `user_sessions` - Historical answer evaluations
- `questions` - Question bank with difficulty ratings

## Setup

### Prerequisites
- Node.js 18+
- Supabase account (free tier)
- Google AI Studio account (Gemini API)

### 1. Install Dependencies
```bash
git clone https://github.com/DanCsoftware/Elo.git
cd Elo
npm install
```

### 2. Configure Supabase

**Create Supabase Project:**
1. Create project at [Supabase Dashboard](https://supabase.com/dashboard)
2. Copy your project URL and anon key
3. Run the SQL migrations in `supabase/migrations/` to set up tables

**Deploy Edge Function:**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy evaluation function
supabase functions deploy evaluate-answer
```

**Set Edge Function Secrets:**
```bash
# Get Gemini API key from https://aistudio.google.com/apikey
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Configure Google OAuth

**Enable Google Sign-In:**
1. In Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Client ID and Client Secret
4. Add authorized redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

### 4. Environment Variables

Create `.env`:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 5. Run Locally
```bash
npm run dev
```

Visit `http://localhost:5173`

## Usage

1. **Sign In**: Click "Sign In with email"
2. **Practice**: Answer PM interview questions
3. **Get Evaluated**: Receive rigorous AI feedback with ELO rating change
4. **Track Progress**: View your rating journey and percentile ranking
5. **Adapt Difficulty**: System automatically serves questions matching your skill level
6. **Generate Examples**: See how a 9/10 answer would look for different companies
7. **Push Back**: Contest scores by providing evidence the evaluator missed

## Data Storage

**PostgreSQL (Supabase):**
- User profiles and authentication
- Historical answer sessions with full evaluation data
- ELO ratings and skill breakdowns
- Question bank with difficulty ratings

**LocalStorage (Browser):**
- Current in-progress answer (persists across tab switches)
- Prevents data loss during practice

## Development
```bash
# Install dependencies
npm install

# Run dev server (frontend)
npm run dev

# Build for production
npm run build

# Deploy Edge Function (backend)
supabase functions deploy evaluate-answer

# Run Supabase locally (optional)
supabase start
```

## Project Structure
```
Elo/
├── src/
│   ├── components/
│   │   ├── Layout.tsx              # Main layout wrapper
│   │   ├── QuestionCard.tsx        # Question display
│   │   ├── AnswerTextarea.tsx      # Answer input
│   │   ├── RatingChart.tsx         # ELO journey visualization
│   │   └── FrameworkTerm.tsx       # Hover tooltips (🦆 duck mascot)
│   ├── pages/
│   │   ├── Index.tsx               # Dashboard + stats
│   │   ├── Practice.tsx            # Adaptive practice mode
│   │   ├── Feedback.tsx            # Evaluation results
│   │   └── History.tsx             # Past sessions
│   ├── hooks/
│   │   ├── useUserStats.ts         # Fetch user ELO + performance
│   │   └── useRatingPercentile.ts  # Calculate rank
│   ├── lib/
│   │   ├── supabase.ts             # Supabase client
│   │   └── gemini.ts               # AI evaluation wrapper
│   └── contexts/
│       └── AuthContext.tsx         # Google OAuth
├── supabase/
│   └── functions/
│       └── evaluate-answer/
│           └── index.ts            # Edge function for AI eval
├── .env                            # API keys (not in git)
└── README.md
```

## Evaluation Rubric

**Unique Elo Standards (Differentiated from ChatGPT):**
- ✅ Quantification Requirement: Every claim needs numbers
- ✅ Framework Naming: Must cite frameworks by name (RICE, HEART, etc.)
- ✅ Contrarian Thinking: Challenge assumptions, question premise
- ✅ Operator Mindset: Implementation details, not just strategy
- ✅ Failure Modes: What are the top 3 ways this could fail?

**Automatic Score Caps:**
- "This is a test" = 1.0/10 (instant fail)
- Under 50 words = MAX 3.0/10
- No metrics = MAX 4.5/10
- No trade-offs = MAX 5.5/10
- No frameworks cited = MAX 6.5/10
- No prioritization = MAX 6.0/10

## Known Limitations

- No mobile app (web-only for now)
- Question bank needs expansion (currently ~50 questions)
- Push back feature requires manual review
- Example answers sometimes hit token limits
- Skill radar chart not yet implemented

## Future Improvements

- 📊 **Skill Radar Chart**: 14-dimensional visualization
- 🏆 **Anonymous Leaderboard**: Compare globally
- 🔁 **Spaced Repetition**: Target weak skill areas
- 📱 **Mobile App**: Native iOS/Android
- 🎯 **Interview Simulation Mode**: Timed, multi-question sessions
- 🤝 **Peer Review**: Community feedback on answers
- 📈 **Company-Specific Tracks**: Specialized prep for FAANG companies

## Contributing

Pull requests welcome! For major changes, please open an issue first to discuss.

## License

MIT

---

Built to develop real PM skills, not interview tricks. 🦆