import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface FrameworkTooltipProps {
  term: string;
}

const frameworkDefinitions: { [key: string]: string } = {
  "HEART": "HEART Framework: Happiness (user satisfaction), Engagement (level of user involvement), Adoption (new users), Retention (repeat usage), Task success (efficiency). Google's framework for measuring user experience.",
  
  "5 Whys": "5 Whys: A root cause analysis technique where you ask 'why' five times to dig deeper into a problem. Developed by Toyota to identify underlying issues.",
  
  "CIRCLES": "CIRCLES Method: Comprehend the situation, Identify the customer, Report needs, Cut through prioritization, List solutions, Evaluate trade-offs, Summarize recommendation. Framework for product design questions.",
  
  "RICE": "RICE Prioritization: Reach (how many people), Impact (how much), Confidence (how sure are you), Effort (how much work). Score = (R × I × C) / E. Used to prioritize features.",
  
  "Impact/Effort": "Impact/Effort Matrix: 2×2 grid plotting features by impact (high/low) vs effort (high/low). Prioritize high-impact, low-effort 'quick wins' first.",
  
  "NPS": "Net Promoter Score: Measures customer loyalty by asking 'How likely are you to recommend us?' on a 0-10 scale. Score = % Promoters (9-10) minus % Detractors (0-6).",
  
  "DAU/MAU": "Daily Active Users / Monthly Active Users: Ratio measuring 'stickiness'. Higher ratio = users return more frequently. Good products aim for 20%+ (users active 6+ days/month).",
  
  "activation": "Activation: The 'aha moment' when a new user first realizes value from your product. Critical metric for converting signups to engaged users.",
  
  "retention": "Retention: Percentage of users who return after their first use. Often measured as Day 1, Day 7, Day 30 retention. Key indicator of product-market fit.",
  
  "cohort": "Cohort Analysis: Grouping users by signup date to track behavior over time. Helps identify if product improvements are working for new users.",
  
  "funnel": "Conversion Funnel: Sequential steps users take toward a goal. Example: Visit → Signup → Activate → Subscribe. Optimize by improving each step's conversion rate.",
  
  "A/B test": "A/B Testing: Randomly showing different versions to users and measuring which performs better. Gold standard for validating product decisions with data.",
  
  "MVP": "Minimum Viable Product: Simplest version that delivers core value, used to validate assumptions with real users before building more features.",
  
  "product-market fit": "Product-Market Fit: When your product satisfies strong market demand. Measured by high retention, organic growth, and users saying they'd be 'very disappointed' without it.",
  
  "user segmentation": "User Segmentation: Dividing users into groups with similar characteristics or behaviors. Enables targeted features and messaging for each group.",
  
  "churn": "Churn: Percentage of users who stop using your product. Inverse of retention. High churn indicates users aren't finding sustained value.",
};

export function FrameworkTooltip({ term }: FrameworkTooltipProps) {
  const definition = frameworkDefinitions[term];
  
  if (!definition) return <span>{term}</span>;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 cursor-help border-b border-dotted border-primary">
            {term}
            <HelpCircle className="w-3 h-3 text-muted-foreground" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-xs">{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}