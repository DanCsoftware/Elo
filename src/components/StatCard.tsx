import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  suffix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard = ({ icon, label, value, suffix, trend }: StatCardProps) => {
  return (
    <div className="bg-card rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{icon}</div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold text-foreground">
              {value}
              {suffix && <span className="text-lg font-medium text-muted-foreground">{suffix}</span>}
            </p>
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
