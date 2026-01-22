import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import SkillBar from '@/components/SkillBar';
import { Button } from '@/components/ui/button';
import { userStats, skillProgress } from '@/lib/mockData';

const Index = () => {
  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border">
          <StatCard
            label="Solved"
            value={`${userStats.totalAnswered}/${userStats.totalQuestions}`}
          />
          <StatCard
            label="Streak"
            value={userStats.streak}
            suffix=" days"
          />
          <StatCard
            label="Avg Score"
            value={userStats.avgScore.toFixed(1)}
          />
          <StatCard
            label="This Week"
            value={`+${userStats.weeklyImprovement}%`}
          />
          <div className="bg-card border border-border p-4 col-span-2 md:col-span-1 lg:col-span-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Difficulty</p>
            <div className="flex items-center gap-4 font-mono text-sm">
              <span className="text-success">E: {userStats.easyCount}</span>
              <span className="text-warning">M: {userStats.mediumCount}</span>
              <span className="text-destructive">H: {userStats.hardCount}</span>
            </div>
          </div>
        </section>

        {/* Category Performance */}
        <section className="bg-card border border-border p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground uppercase tracking-wide">Category Performance</h2>
          </div>
          <div className="space-y-3">
            {skillProgress.map((skill) => (
              <SkillBar
                key={skill.name}
                name={skill.name}
                percentage={skill.percentage}
              />
            ))}
          </div>
        </section>

        {/* Action Button */}
        <section className="flex gap-3">
          <Button variant="default" size="sm" asChild>
            <Link to="/practice">
              Practice
            </Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/history">
              History
            </Link>
          </Button>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
