import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressChart } from "@/components/ProgressChart";
import { StatCard } from "@/components/StatCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, Clock, Target, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";

const Analytics = () => {
  const { state, dispatch } = useApp();
  const analytics = state.analytics;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Detailed performance insights and trends
          </p>
        </div>
        
        <Select 
          value={state.selectedFilters.timePeriod} 
          onValueChange={(value) => dispatch({ type: 'SET_TIME_PERIOD', payload: value })}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 3 months</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Questions Attempted"
          value={analytics.overallStats.totalQuestions}
          icon={Target}
        />
        <StatCard
          title="Average Score"
          value={`${analytics.overallStats.averageScore}%`}
          icon={BarChart3}
          trend="up"
        />
        <StatCard
          title="Study Streak"
          value={`${analytics.overallStats.studyStreak} days`}
          icon={TrendingUp}
        />
        <StatCard
          title="Study Time This Week"
          value={`${Math.floor(analytics.overallStats.timeSpentThisWeek / 60)}h ${analytics.overallStats.timeSpentThisWeek % 60}m`}
          icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart 
          data={analytics.scoreHistory}
          title="Score Progression"
          description="Your performance over time"
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Accuracy breakdown by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.performanceBySubject.map((subject) => (
                <div key={subject.subject} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{subject.subject}</span>
                    <span>{subject.accuracy}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${subject.accuracy}%`,
                        backgroundColor: subject.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;