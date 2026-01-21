import { Category, getCategoryColor } from '@/lib/mockData';

interface SkillBarProps {
  name: string;
  percentage: number;
  category: Category;
}

const SkillBar = ({ name, percentage, category }: SkillBarProps) => {
  const colorClass = getCategoryColor(category);
  
  const getBarColor = () => {
    const colors: Record<Category, string> = {
      strategy: 'bg-primary',
      metrics: 'bg-success',
      prioritization: 'bg-warning',
      design: 'bg-accent',
    };
    return colors[category];
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${colorClass}`}>
          {name}
        </span>
        <span className="text-sm font-semibold text-foreground">{percentage}%</span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getBarColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default SkillBar;
