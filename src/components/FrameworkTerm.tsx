import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

interface FrameworkTermProps {
  term: string;
}

const frameworkDefinitions: { [key: string]: { description: string; example: string; related?: string[] } } = {
  "HEART": {
    description: "Google's framework for measuring user experience quality",
    example: "Happiness (surveys), Engagement (usage), Adoption (new users), Retention (return rate), Task Success (completion)",
    related: ["metrics", "engagement"]
  },
  "5 Whys": {
    description: "Root cause analysis technique by asking 'why' repeatedly",
    example: "Why did users abandon checkout? → Shipping was too expensive. Why? → Free threshold too high. Why? → Competing with Amazon Prime.",
    related: ["problem framing"]
  },
  "CIRCLES": {
    description: "Product design framework: Comprehend → Identify → Report → Cut → List → Evaluate → Summarize",
    example: "Used for 'design a product for X' questions in interviews",
    related: ["product design", "frameworks"]
  },
  "RICE": {
    description: "Prioritization scoring: Reach × Impact × Confidence / Effort",
    example: "Feature A: (10000 × 3 × 0.8) / 5 = 4800. Feature B: (5000 × 5 × 0.9) / 2 = 11,250. Ship B first.",
    related: ["prioritization"]
  },
  "Impact/Effort": {
    description: "2×2 matrix for quick prioritization decisions",
    example: "High impact, low effort = do first. Low impact, high effort = avoid.",
    related: ["prioritization", "RICE"]
  },
  "NPS": {
    description: "Net Promoter Score: % promoters (9-10) minus % detractors (0-6)",
    example: "Survey: 'How likely to recommend 0-10?' 50% give 9-10, 20% give 0-6. NPS = 30.",
    related: ["metrics", "HEART"]
  },
  "DAU/MAU": {
    description: "Daily Active Users / Monthly Active Users = stickiness ratio",
    example: "100K DAU / 500K MAU = 20% stickiness. Higher = better engagement.",
    related: ["metrics", "engagement"]
  },
  "activation": {
    description: "New user reaching 'aha moment' or first value",
    example: "Facebook: Adding 7 friends in 10 days. Slack: Sending 2000 messages as a team.",
    related: ["growth", "metrics"]
  },
  "retention": {
    description: "% of users who return after initial use",
    example: "Day 1: 100 users. Day 7: 40 return. D7 retention = 40%.",
    related: ["metrics", "engagement"]
  },
  "cohort": {
    description: "Group users by common characteristic to track behavior over time",
    example: "Jan 2024 signups: How many are still active in March? Compare to Feb cohort.",
    related: ["analytics", "retention"]
  },
  "funnel": {
    description: "Step-by-step user journey showing drop-off at each stage",
    example: "1000 visitors → 300 sign up → 100 activate → 50 purchase. Optimize weakest step.",
    related: ["metrics", "conversion"]
  },
  "A/B test": {
    description: "Randomly show different versions to users and measure which performs better",
    example: "Test red vs blue CTA button. 50% see red, 50% see blue. After 10,000 visitors: Red converts 3.2%, blue converts 4.1%. Ship blue!",
    related: ["experimentation", "metrics"]
  },
  "MVP": {
    description: "Minimum Viable Product: Smallest version that delivers core value",
    example: "Airbnb MVP: Just a website listing 3 air mattresses in founders' apartment.",
    related: ["product strategy"]
  },
  "product-market fit": {
    description: "When your product deeply satisfies a strong market demand",
    example: "40%+ users say they'd be 'very disappointed' if product disappeared (Sean Ellis test)",
    related: ["strategy", "growth"]
  },
  "user segmentation": {
    description: "Dividing users into groups with similar behaviors or needs",
    example: "Power users (daily), casual users (weekly), churned users (inactive 30+ days)",
    related: ["analytics", "targeting"]
  },
  "churn": {
    description: "Rate at which customers stop using your product",
    example: "Start with 1000 users. 50 cancel this month. Monthly churn = 5%.",
    related: ["retention", "metrics"]
  },
};

export function FrameworkTerm({ term }: FrameworkTermProps) {
  const info = frameworkDefinitions[term] || frameworkDefinitions[term.toLowerCase()];
  
  if (!info) {
    return <span className="underline decoration-dotted text-primary">{term}</span>;
  }

  return (
    <HoverCard openDelay={200}>
      <HoverCardTrigger asChild>
        <span className="underline decoration-dotted cursor-help text-primary hover:text-primary/80 transition-colors">
          {term}
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

          {info.related && info.related.length > 0 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold mb-2">Related Concepts</p>
              <div className="flex flex-wrap gap-1">
                {info.related.map(concept => (
                  <span 
                    key={concept}
                    className="px-2 py-0.5 text-xs bg-secondary rounded-md"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}