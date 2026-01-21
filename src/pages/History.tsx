import { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import Layout from '@/components/Layout';
import ScoreDisplay from '@/components/ScoreDisplay';
import { Button } from '@/components/ui/button';
import { 
  historyItems, 
  categoryLabels, 
  getCategoryColor, 
  getDifficultyColor,
  Category 
} from '@/lib/mockData';

type FilterType = 'all' | Category;

const History = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Strategy', value: 'strategy' },
    { label: 'Metrics', value: 'metrics' },
    { label: 'Prioritization', value: 'prioritization' },
    { label: 'Design', value: 'design' },
  ];

  const filteredItems = filter === 'all' 
    ? historyItems 
    : historyItems.filter(item => item.question.category === filter);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <section className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Answer History</h1>
          <p className="text-muted-foreground">Review your past practice sessions</p>
        </section>

        {/* Filter Tabs */}
        <section className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </section>

        {/* History List */}
        <section className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="bg-card rounded-xl shadow-card p-8 text-center">
              <p className="text-muted-foreground">No answers found for this category.</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-xl shadow-card overflow-hidden transition-all duration-200 hover:shadow-card-hover"
              >
                {/* Card Header */}
                <div 
                  className="p-5 cursor-pointer"
                  onClick={() => toggleExpand(item.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className={`px-2.5 py-0.5 rounded-full font-medium ${getCategoryColor(item.question.category)}`}>
                          {categoryLabels[item.question.category]}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full font-medium ${getDifficultyColor(item.question.difficulty)}`}>
                          {item.question.difficulty}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <p className="text-foreground font-medium line-clamp-2">
                        {item.question.text}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <ScoreDisplay score={item.feedback.score} size="sm" />
                      {expandedId === item.id ? (
                        <ChevronUp className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === item.id && (
                  <div className="px-5 pb-5 border-t border-border animate-slide-up">
                    <div className="pt-5 space-y-4">
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Your Answer</h4>
                        <p className="text-sm text-foreground bg-secondary rounded-lg p-3">
                          {item.userAnswer}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Feedback</h4>
                        <p className="text-sm text-foreground">
                          {item.feedback.detailedFeedback}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      </div>
    </Layout>
  );
};

export default History;
