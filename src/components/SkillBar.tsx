interface SkillBarProps {
  name: string;
  percentage: number;
}

const SkillBar = ({ name, percentage }: SkillBarProps) => {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground w-32 shrink-0">{name}</span>
      <div className="flex-1 h-1.5 bg-secondary overflow-hidden">
        <div
          className="h-full bg-muted-foreground transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-mono text-foreground w-12 text-right">{percentage}%</span>
    </div>
  );
};

export default SkillBar;
