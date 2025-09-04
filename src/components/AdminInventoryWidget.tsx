import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, Database, TrendingUp, BookOpen } from 'lucide-react';

interface QuestionStats {
  test_type: string;
  subject: string;
  topic: string;
  difficulty_level: string;
  question_count: number;
}

export const AdminInventoryWidget = React.forwardRef<
  { refreshStats: () => void },
  {}
>((props, ref) => {
  const [stats, setStats] = useState<QuestionStats[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuestionStats();
  }, []);

  // Expose refresh function to parent via ref
  React.useImperativeHandle(ref, () => ({
    refreshStats: fetchQuestionStats
  }));

  const fetchQuestionStats = async () => {
    try {
      // Get overall count
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      setTotalQuestions(count || 0);

      // Get detailed stats
      const { data, error } = await supabase
        .rpc('get_question_stats', { 
          p_test_type: 'SHSAT' 
        });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching question stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTestTypeStats = () => {
    const testTypes = ['SHSAT', 'SSAT', 'ISEE', 'HSPT', 'TACHS'];
    return testTypes.map(testType => {
      const typeStats = stats.filter(s => s.test_type === testType);
      const count = typeStats.reduce((sum, s) => sum + s.question_count, 0);
      return { testType, count };
    });
  };

  const getSubjectStats = () => {
    const subjects = ['Math', 'Verbal', 'Reading', 'Writing'];
    return subjects.map(subject => {
      const subjectStats = stats.filter(s => s.subject === subject);
      const count = subjectStats.reduce((sum, s) => sum + s.question_count, 0);
      return { subject, count };
    });
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Question Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Question Inventory
        </CardTitle>
        <CardDescription>
          Current database statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Questions */}
        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-primary" />
            <div>
              <p className="font-semibold">Total Questions</p>
              <p className="text-sm text-muted-foreground">Active in database</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {totalQuestions.toLocaleString()}
          </Badge>
        </div>

        {/* Test Type Breakdown */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            By Test Type
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {getTestTypeStats().map(({ testType, count }) => (
              <div key={testType} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm font-medium">{testType}</span>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Breakdown */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            By Subject
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {getSubjectStats().map(({ subject, count }) => (
              <div key={subject} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                <span className="text-sm font-medium">{subject}</span>
                <Badge variant="outline" className="text-xs">
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Top Topics */}
        <div>
          <h4 className="font-medium mb-3">Popular Topics</h4>
          <div className="space-y-2">
            {stats
              .sort((a, b) => b.question_count - a.question_count)
              .slice(0, 5)
              .map((stat, index) => (
                <div key={`${stat.test_type}-${stat.subject}-${stat.topic}`} className="flex items-center justify-between text-sm">
                  <span className="truncate flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    <span>{stat.topic}</span>
                    <Badge variant="secondary" className="text-xs">
                      {stat.subject}
                    </Badge>
                  </span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {stat.question_count}
                  </Badge>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});