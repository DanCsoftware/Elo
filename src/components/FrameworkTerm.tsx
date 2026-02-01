import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface FrameworkTermProps {
  term: string;
  children?: React.ReactNode;
}

const frameworkDefinitions: { [key: string]: { description: string; example: string; related?: string } } = {
  // Strategic Frameworks
  'okr': {
    description: 'Objectives and Key Results - Goal-setting framework used by Google. Objectives are qualitative goals, Key Results are measurable outcomes.',
    example: 'Objective: Improve user engagement. KR1: Increase DAU/MAU from 35% to 40%. KR2: Reduce churn by 15%.',
    related: 'Used with SMART goals'
  },
  'okrs': {
    description: 'Objectives and Key Results - Goal-setting framework used by Google. Objectives are qualitative goals, Key Results are measurable outcomes.',
    example: 'Objective: Improve user engagement. KR1: Increase DAU/MAU from 35% to 40%. KR2: Reduce churn by 15%.',
    related: 'Used with SMART goals'
  },
  'rice': {
    description: 'Reach × Impact × Confidence ÷ Effort - Prioritization framework to score features.',
    example: 'Feature A: (5000 users × 3 impact × 80% confidence) ÷ 2 months = 6000 RICE score',
    related: 'Alternative to impact/effort matrix'
  },
  'heart': {
    description: 'Happiness, Engagement, Adoption, Retention, Task Success - Google\'s user-centric metrics framework.',
    example: 'Happiness: NPS 45. Engagement: 15 min/session. Adoption: 60% of users try new feature. Retention: 70% D7. Task Success: 85% completion rate.',
    related: 'User experience metrics'
  },
  'bluf': {
    description: 'Bottom Line Up Front - Communication style that leads with the conclusion, then provides supporting details.',
    example: 'BLUF: We need to delay launch 2 weeks to fix critical bugs. Details: 15 P0 issues discovered in testing...',
    related: 'Used in military and consulting'
  },
  
  // Metrics & Analytics
  'dau/mau': {
    description: 'Daily Active Users ÷ Monthly Active Users - Measures product stickiness. 20%+ is good, 50%+ is excellent.',
    example: 'If 100K DAU and 500K MAU, DAU/MAU = 20% (users engage 6 days/month on average)',
    related: 'Stickiness metric'
  },
  'ltv/cac': {
    description: 'Lifetime Value ÷ Customer Acquisition Cost - Unit economics metric. LTV/CAC > 3 is healthy.',
    example: 'Customer worth $1200 over lifetime, costs $300 to acquire → LTV/CAC = 4.0 (profitable)',
    related: 'Also called CAC payback period'
  },
  'ltv': {
    description: 'Lifetime Value - Total revenue a customer generates over their entire relationship with your product.',
    example: '$50/month subscription × 24 months average retention = $1200 LTV',
    related: 'Used with CAC and churn'
  },
  'cac': {
    description: 'Customer Acquisition Cost - Total sales and marketing spend divided by number of customers acquired.',
    example: '$300K marketing spend ÷ 1000 new customers = $300 CAC',
    related: 'Should be < 33% of LTV'
  },
  'nps': {
    description: 'Net Promoter Score - Customer loyalty metric. % promoters (9-10) minus % detractors (0-6). Scale: -100 to +100.',
    example: 'Survey 100 users: 60 promoters, 20 detractors → NPS = 40 (good)',
    related: 'Alternative: CSAT, CES'
  },
  'nrr': {
    description: 'Net Revenue Retention - Revenue retained from existing customers, including expansion. NRR > 100% = growth from existing base.',
    example: 'Start: $1M ARR. Lost $200K (churn), added $400K (upsells) → NRR = 120%',
    related: 'Also called NDR (Net Dollar Retention)'
  },
  'arr': {
    description: 'Annual Recurring Revenue - Yearly value of recurring subscriptions. Key SaaS metric.',
    example: '1000 customers × $100/month × 12 months = $1.2M ARR',
    related: 'Monthly version is MRR'
  },
  'churn': {
    description: 'Rate at which customers stop using your product. Lower is better. Calculate monthly or annually.',
    example: 'Lost 50 out of 1000 customers last month → 5% monthly churn (60% annual churn - very bad!)',
    related: 'Opposite of retention'
  },
  'retention': {
    description: 'Percentage of users who return after first use. D1, D7, D30 retention are common.',
    example: '1000 signups. 400 return Day 1 (D1=40%), 250 return Day 7 (D7=25%)',
    related: 'Cohort retention curves'
  },
  'cohort': {
    description: 'Group of users who share a common characteristic or start date. Used to track behavior over time.',
    example: 'January 2024 cohort: 1000 signups. Track their D7, D30, D90 retention separately from other months.',
    related: 'Cohort analysis'
  },
  
  // Product Development
  'mvp': {
    description: 'Minimum Viable Product - Smallest version that tests core hypothesis with real users.',
    example: 'Instead of building full marketplace, launch with 10 sellers, manual payments, basic search to validate demand.',
    related: 'Validate before scaling'
  },
  'pmf': {
    description: 'Product-Market Fit - When product solves a real problem for a large enough market. 40%+ "very disappointed" if product went away.',
    example: 'Survey users: "How disappointed if we shut down?" >40% say "very disappointed" = PMF achieved',
    related: 'Sean Ellis test'
  },
  'product-market fit': {
    description: 'Product-Market Fit - When product solves a real problem for a large enough market. 40%+ "very disappointed" if product went away.',
    example: 'Survey users: "How disappointed if we shut down?" >40% say "very disappointed" = PMF achieved',
    related: 'Sean Ellis test'
  },
  'a/b test': {
    description: 'Controlled experiment comparing two variants. Statistical significance typically requires 95% confidence.',
    example: 'Variant A: 5% conversion (control). Variant B: 6% conversion (treatment). 10K users/variant, p<0.05 → ship B!',
    related: 'Multivariate testing'
  },
  'funnel': {
    description: 'User journey from awareness to conversion. Measure drop-off at each step to identify bottlenecks.',
    example: '1M visitors → 100K signups (10%) → 50K activated (50%) → 10K paid (20%). Fix activation step!',
    related: 'Conversion optimization'
  },
  'activation': {
    description: 'Moment when a new user first experiences core product value. Key metric: % of signups who activate.',
    example: 'Slack: User sends first message. Dropbox: User uploads first file. Measure time-to-activation and % activated.',
    related: 'Aha moment'
  },
  
  // Prioritization & Strategy
  'impact/effort': {
    description: 'Prioritization matrix plotting estimated impact vs. implementation effort. Focus on high impact, low effort (quick wins).',
    example: 'Quick win: Fix onboarding bug (high impact, 2 days). Avoid: Rebuild entire UI (medium impact, 6 months).',
    related: 'Alternative to RICE'
  },
  'north star metric': {
    description: 'Single metric that best captures core value delivered to customers. Guides all product decisions.',
    example: 'Airbnb: Nights booked. Spotify: Time listening. Amazon: Purchases per month.',
    related: 'Focus metric'
  },
  'tam': {
    description: 'Total Addressable Market - Total revenue opportunity if you captured 100% of market.',
    example: '10M potential customers × $100 average sale = $1B TAM',
    related: 'SAM (Serviceable), SOM (Obtainable)'
  },
  'moat': {
    description: 'Competitive advantage that prevents others from stealing your customers. Warren Buffett concept.',
    example: 'Network effects (Facebook), switching costs (Salesforce), brand (Apple), economies of scale (Amazon)',
    related: 'Defensibility'
  },
  
  // Execution & Operations
  'sprint': {
    description: 'Fixed time period (usually 2 weeks) for completing planned work. Scrum/Agile methodology.',
    example: 'Sprint 24: Build checkout flow, fix 10 bugs, ship iOS update. Review and plan every 2 weeks.',
    related: 'Agile development'
  },
  'backlog': {
    description: 'Prioritized list of features, bugs, and technical debt waiting to be worked on.',
    example: 'Current sprint: 15 items in progress. Backlog: 200 items ranked by RICE score. Groom weekly.',
    related: 'Product roadmap'
  },
  'tech debt': {
    description: 'Cost of rework caused by choosing quick solution now vs. better approach later. Must be paid eventually.',
    example: 'Hardcoded config to ship fast. Now scaling issues. Need 2 weeks to refactor. That\'s tech debt.',
    related: 'Refactoring'
  },
  'kpi': {
    description: 'Key Performance Indicator - Critical metrics that measure success toward objectives.',
    example: 'Company KPIs: ARR growth 40% YoY, NRR > 110%, CAC payback < 12 months, NPS > 40',
    related: 'OKRs track KPIs'
  },
  
  // Business Models
  'freemium': {
    description: 'Business model with free tier and paid premium features. Challenge: converting free to paid users.',
    example: 'Spotify: Free (ads) → Premium ($10/mo, no ads, offline). Dropbox: 2GB free → 2TB paid.',
    related: 'Conversion rate critical'
  },
  'saas': {
    description: 'Software as a Service - Subscription-based software delivery. Predictable recurring revenue.',
    example: 'Salesforce, Slack, Adobe Creative Cloud. Monthly/annual subscriptions vs. perpetual licenses.',
    related: 'Track MRR, ARR, churn'
  },
  'marketplace': {
    description: 'Platform connecting buyers and sellers. Challenge: chicken-and-egg problem (need both sides).',
    example: 'Airbnb (hosts/guests), Uber (drivers/riders), Upwork (freelancers/clients). Take rate: 15-30%.',
    related: 'Two-sided network'
  },
  'gmv': {
    description: 'Gross Merchandise Value - Total value of transactions on a marketplace before fees.',
    example: '$10M in bookings on platform. Platform takes 20% → $2M revenue. GMV = $10M.',
    related: 'Marketplace metric'
  },
  
  // User Research
  'persona': {
    description: 'Fictional character representing a user segment. Based on research, not assumptions.',
    example: '"Busy Beth": Working mom, 35, wants quick grocery delivery. Uses mobile 90%, price-sensitive.',
    related: 'Jobs to be done'
  },
  'jobs to be done': {
    description: 'Framework focusing on user\'s underlying goal, not demographics. "When X, I want to Y, so I can Z."',
    example: 'When I commute, I want to listen to podcasts, so I can learn new skills. Not: "Millennial podcast app."',
    related: 'Customer needs'
  },
  'user segmentation': {
    description: 'Dividing users into groups based on behavior, demographics, or needs. Enables targeted features/marketing.',
    example: 'Segment 1: Power users (10% of users, 60% of revenue). Segment 2: Casual users. Build for Segment 1 first.',
    related: 'Cohorts, personas'
  },
};

export function FrameworkTerm({ term, children }: FrameworkTermProps) {
  const info = frameworkDefinitions[term] || frameworkDefinitions[term.toLowerCase()];
  
  if (!info) {
    return <span className="underline decoration-dotted text-primary">{children || term}</span>;
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <span className="underline decoration-dotted cursor-help text-primary hover:text-primary/80 transition-colors">
          {children || term}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-96 p-4" side="top">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <img 
              src="https://media.tenor.com/KuBAp-1E3GgAAAAm/pato-aaa.webp"
              alt="Duck mascot"
              className="w-12 h-12 object-contain flex-shrink-0"
            />
            <div className="flex-1">
              <h4 className="text-sm font-semibold mb-1">{term}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {info.description}
              </p>
            </div>
          </div>

          {info.example && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold mb-1">Real Example</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {info.example}
              </p>
            </div>
          )}

          {info.related && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold mb-1">Related</p>
              <p className="text-xs text-muted-foreground">
                {info.related}
              </p>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}