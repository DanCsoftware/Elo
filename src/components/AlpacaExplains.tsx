import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import alpacaMascot from '@/assets/alpaca-mascot.png';

interface AlpacaExplainsProps {
  term: string;
  open: boolean;
  onClose: () => void;
}

const frameworkExplanations: { [key: string]: {
  title: string;
  explanation: string;
  example: string;
  related?: string[];
}} = {
  "HEART": {
    title: "HEART Framework",
    explanation: "Google's framework for measuring user experience across 5 dimensions: Happiness (satisfaction), Engagement (involvement), Adoption (new users), Retention (repeat usage), and Task success (efficiency).",
    example: "For a meditation app: Happiness = NPS score, Engagement = sessions per week, Adoption = new signups, Retention = Day 7 return rate, Task success = % completing 10-min session.",
    related: ["NPS", "retention", "activation"]
  },
  
  "CIRCLES": {
    title: "CIRCLES Method",
    explanation: "A structured approach for product design questions: Comprehend the situation, Identify the customer, Report needs, Cut through prioritization, List solutions, Evaluate trade-offs, Summarize recommendation.",
    example: "When asked 'Design a fridge for blind people,' use CIRCLES to methodically work through user needs, constraints, solutions, and trade-offs rather than jumping straight to features.",
    related: ["user segmentation", "MVP"]
  },
  
  "RICE": {
    title: "RICE Prioritization",
    explanation: "A framework to score and prioritize features: Reach (how many users), Impact (how much value), Confidence (how sure you are), Effort (work required). Score = (R × I × C) / E.",
    example: "Feature A: Reach=1000, Impact=3/5, Confidence=80%, Effort=2 weeks = (1000 × 3 × 0.8) / 2 = 1200. Compare scores to prioritize your roadmap.",
    related: ["Impact/Effort", "MVP"]
  },
  
  "5 Whys": {
    title: "5 Whys Technique",
    explanation: "A root cause analysis method where you ask 'why' five times to dig past surface symptoms and find the real problem. Developed by Toyota for quality improvement.",
    example: "Problem: Users aren't completing onboarding. Why? Forms are too long. Why? We ask for too much info. Why? We want perfect data. Why? We don't trust users. Why? Fear of spam. Real problem: Trust issue, not form length!",
    related: ["cohort", "funnel"]
  },
  
  "Impact/Effort": {
    title: "Impact/Effort Matrix",
    explanation: "A 2×2 grid that plots potential features by their impact (high/low) and effort required (high/low). Helps visualize which projects to tackle first.",
    example: "Quick wins (high impact, low effort) = do first. Big bets (high impact, high effort) = plan for next quarter. Fill-ins (low impact, low effort) = delegate. Money pits (low impact, high effort) = avoid!",
    related: ["RICE", "MVP"]
  },
  
  "NPS": {
    title: "Net Promoter Score",
    explanation: "Measures customer loyalty with one question: 'How likely are you to recommend us (0-10)?' Promoters (9-10) minus Detractors (0-6) = your NPS. Above 50 is excellent.",
    example: "Survey 100 users: 60 give 9-10 (promoters), 10 give 0-6 (detractors), 30 are passive (7-8). NPS = 60% - 10% = 50. You have strong word-of-mouth potential!",
    related: ["HEART", "retention"]
  },
  
  "DAU/MAU": {
    title: "Daily/Monthly Active Users",
    explanation: "The ratio of Daily Active Users to Monthly Active Users measures how 'sticky' your product is. Higher ratio = users return more often. 20%+ is generally good (6+ days/month).",
    example: "App has 10,000 MAU and 3,000 DAU = 30% DAU/MAU. Users open it almost every 3 days. Social apps target 50%+, B2B tools might be happy with 15%.",
    related: ["retention", "engagement"]
  },
  
  "activation": {
    title: "Activation Metric",
    explanation: "The 'aha moment' when a new user first experiences core value. This is THE critical metric for converting signups into engaged users.",
    example: "For Slack: Activation = team sends 2,000 messages. For Dropbox: First file shared. For Airbnb: First booking made. Find your product's 'aha moment' and optimize for it!",
    related: ["retention", "funnel"]
  },
  
  "retention": {
    title: "Retention Rate",
    explanation: "Percentage of users who return after their first use. Measured as Day 1, Day 7, Day 30 retention. This is the #1 indicator of product-market fit.",
    example: "100 users sign up Monday. 40 return Tuesday (40% Day 1), 25 return next Monday (25% Day 7), 15 return a month later (15% Day 30). If Day 7 < 20%, you have a problem.",
    related: ["activation", "churn", "product-market fit"]
  },
  
  "cohort": {
    title: "Cohort Analysis",
    explanation: "Grouping users by when they signed up, then tracking their behavior over time. Reveals if your product improvements are actually working for new users.",
    example: "January cohort: 15% Day 30 retention. February cohort (after onboarding redesign): 25% Day 30 retention. Your changes worked! Track each month to measure progress.",
    related: ["retention", "A/B test"]
  },
  
  "funnel": {
    title: "Conversion Funnel",
    explanation: "The sequential steps users take toward a goal. Each step has a conversion rate. Multiply them to get overall conversion. Optimize the biggest dropoff first.",
    example: "E-commerce: Visit (100%) → Add to cart (30%) → Checkout (70%) → Purchase (85%). Overall: 100% × 30% × 70% × 85% = 18% conversion. The 30% add-to-cart is your biggest opportunity!",
    related: ["activation", "A/B test"]
  },
  
  "A/B test": {
    title: "A/B Testing",
    explanation: "Randomly show different versions to users and measure which performs better. The gold standard for making data-driven product decisions.",
    example: "Test red vs blue CTA button. 50% see red, 50% see blue. After 10,000 visitors: Red converts 3.2%, blue converts 4.1%. Ship blue! But always test one variable at a time.",
    related: ["cohort", "funnel"]
  },
  
  "MVP": {
    title: "Minimum Viable Product",
    explanation: "The simplest version that delivers core value. Used to validate assumptions with real users before building more. Focus on learning, not perfection.",
    example: "Airbnb's MVP: Founders rented their own apartment with air mattresses and photos. No payments, no booking system. Just validated: 'Will people pay to stay in strangers' homes?'",
    related: ["product-market fit", "A/B test"]
  },
  
  "product-market fit": {
    title: "Product-Market Fit",
    explanation: "When your product satisfies strong market demand. You know you have it when users would be 'very disappointed' without it, and growth becomes a problem of scaling, not convincing.",
    example: "Signs you have it: 40%+ users say 'very disappointed' if product disappeared, organic growth without paid acquisition, high retention (40%+ Day 30), users asking for more features.",
    related: ["retention", "NPS", "MVP"]
  },
  
  "user segmentation": {
    title: "User Segmentation",
    explanation: "Dividing users into groups based on shared characteristics or behaviors. Enables you to build features and messaging that actually resonate with each group.",
    example: "B2B SaaS: Segment by company size (1-10, 11-50, 51-200, 201+). Small companies want ease, large want customization. One product experience won't work for both!",
    related: ["cohort", "CIRCLES"]
  },
  
  "churn": {
    title: "Churn Rate",
    explanation: "Percentage of users who stop using your product in a given period. The inverse of retention. High churn means users aren't finding sustained value.",
    example: "Start month with 1,000 subscribers. 100 cancel. Churn = 10%/month. Annual: (1-0.9)^12 = 72% churn. At that rate, you lose almost all users yearly. Need churn < 5%/month for SaaS!",
    related: ["retention", "product-market fit"]
  },
};

export function AlpacaExplains({ term, open, onClose }: AlpacaExplainsProps) {
  const content = frameworkExplanations[term];
  
  if (!content) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <img 
              src={alpacaMascot} 
              alt="Alpa mascot" 
              className="w-16 h-16 object-contain" 
            />
            <div className="flex-1">
              <DialogTitle className="text-xl">{content.title}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Let me explain this concept!
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Explanation */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">What is it?</h4>
            <p className="text-muted-foreground leading-relaxed">
              {content.explanation}
            </p>
          </div>

          {/* Example */}
          <div className="bg-secondary/50 rounded-lg p-4">
            <h4 className="font-semibold text-foreground mb-2">Real Example</h4>
            <p className="text-muted-foreground leading-relaxed">
              {content.example}
            </p>
          </div>

          {/* Related Concepts */}
          {content.related && content.related.length > 0 && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Related Concepts</h4>
              <div className="flex flex-wrap gap-2">
                {content.related.map(relatedTerm => (
                  <span 
                    key={relatedTerm}
                    className="px-3 py-1 bg-secondary rounded-full text-xs text-muted-foreground"
                  >
                    {relatedTerm}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}