import { useState } from 'react';
import { Check, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  historyItems, 
  getDifficultyColor,
  Category 
} from '@/lib/mockData';

type FilterType = 'all' | Category;

const categoryAbbrev: Record<string, string> = {
  strategy: 'Strat',
  metrics: 'Metr',
  prioritization: 'Prior',
  design: 'Dsgn',
};

const History = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters: { label: string; value: FilterType }[] = [
    { label: 'All', value: 'all' },
    { label: 'Strat', value: 'strategy' },
    { label: 'Metr', value: 'metrics' },
    { label: 'Prior', value: 'prioritization' },
    { label: 'Dsgn', value: 'design' },
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
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success';
    if (score >= 6) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Layout>
      <div className="space-y-4">
        {/* Filter Tabs */}
        <section className="flex gap-1">
          {filters.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'default' : 'secondary'}
              size="sm"
              onClick={() => setFilter(f.value)}
              className="text-xs"
            >
              {f.label}
            </Button>
          ))}
        </section>

        {/* History Table */}
        <section className="bg-card border border-border">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No answers found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="w-12">Status</TableHead>
                  <TableHead>Problem</TableHead>
                  <TableHead className="w-16">Cat</TableHead>
                  <TableHead className="w-12">Diff</TableHead>
                  <TableHead className="w-20 text-right">Score</TableHead>
                  <TableHead className="w-20 text-right">Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <>
                    <TableRow 
                      key={item.id}
                      className="cursor-pointer hover:bg-secondary border-border"
                      onClick={() => toggleExpand(item.id)}
                    >
                      <TableCell>
                        {item.feedback.score >= 6 ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Minus className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-foreground">
                        {item.question.text}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {categoryAbbrev[item.question.category]}
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono text-xs ${getDifficultyColor(item.question.difficulty)}`}>
                          {item.question.difficulty.charAt(0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono ${getScoreColor(item.feedback.score)}`}>
                          {item.feedback.score.toFixed(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell>
                        {expandedId === item.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedId === item.id && (
                      <TableRow className="hover:bg-transparent border-border">
                        <TableCell colSpan={7} className="bg-secondary p-0">
                          <div className="p-4 space-y-4">
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Your Answer</h4>
                              <p className="text-sm font-mono text-foreground bg-card p-3 border border-border">
                                {item.userAnswer}
                              </p>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Feedback</h4>
                              <p className="text-sm text-muted-foreground">
                                {item.feedback.detailedFeedback}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      </div>
    </Layout>
  );
};

export default History;
