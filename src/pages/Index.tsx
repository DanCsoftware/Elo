import { Link } from 'react-router-dom';
import { Flame, Target, TrendingUp, BarChart3 } from 'lucide-react';
import Layout from '@/components/Layout';
import StatCard from '@/components/StatCard';
import SkillBar from '@/components/SkillBar';
import { Button } from '@/components/ui/button';
import { userStats, skillProgress } from '@/lib/mockData';

const Index = () => {
  return (
    <Layout>
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="text-center space-y-3 py-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Level up your PM skills
          </h1>
          <p className="text-muted-foreground text-lg">
            Practice real interview questions and get instant feedback
          </p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Flame className="text-warning" />}
            label="Current Streak"
            value={userStats.streak}
            suffix=" days"
          />
          <StatCard
            icon={<Target className="text-primary" />}
            label="Questions Answered"
            value={userStats.totalAnswered}
          />
          <StatCard
            icon={<BarChart3 className="text-success" />}
            label="Average Score"
            value={userStats.avgScore.toFixed(1)}
            suffix="/10"
          />
          <StatCard
            icon={<TrendingUp className="text-accent" />}
            label="This Week"
            value={`+${userStats.weeklyImprovement}%`}
            trend={{ value: userStats.weeklyImprovement, isPositive: true }}
          />
        </section>

        {/* Skill Breakdown */}
        <section className="bg-card rounded-2xl shadow-card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Skill Breakdown</h2>
            <span className="text-sm text-muted-foreground">Based on your answers</span>
          </div>
          <div className="space-y-4">
            {skillProgress.map((skill) => (
              <SkillBar
                key={skill.name}
                name={skill.name}
                percentage={skill.percentage}
                category={skill.category}
              />
            ))}
          </div>
        </section>

        {/* Action Buttons */}
        <section className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button variant="gradient" size="lg" className="flex-1" asChild>
            <Link to="/practice">
              🎯 Start Daily Practice
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="flex-1" asChild>
            <Link to="/history">
              📚 Review Past Answers
            </Link>
          </Button>
        </section>
      </div>
    </Layout>
  );
};

export default Index;
