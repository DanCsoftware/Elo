import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

interface InlineImprovementProps {
  original: string;
  improved: string;
  why: string;
}

export function InlineImprovement({ original, improved, why }: InlineImprovementProps) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <span className="border-b-2 border-dashed border-warning cursor-help hover:border-primary transition-colors">
          {original}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-4">
        <div className="space-y-2">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Your version:</p>
            <p className="text-sm text-destructive/80 line-through">{original}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Upgraded:</p>
            <p className="text-sm font-medium text-success">{improved}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">Why:</span> {why}
            </p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}