import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ProgressChart } from "@/components/ProgressChart";
import { 
  BarChart3, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  Target, 
  Calendar,
  Play,
  ChevronRight,
  Flame
} from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";

const Dashboard = () => {
  const { state } = useApp();
  
  // Use analytics data from state
  const studyStreak = state.analytics.overallStats.studyStreak;
  const totalQuestions = state.analytics.overallStats.totalQuestions;
  const averageScore = state.analytics.overallStats.averageScore;
  const timeThisWeek = state.analytics.overallStats.timeSpentThisWeek;

  const subjectPerformance = state.analytics.performanceBySubject;
  const recentSessions = state.analytics.scoreHistory.slice(-3).reverse();

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {state.user.firstName}!</h1>
        <p className="text-muted-foreground mt-2">
          Keep up the great work. You're on a {studyStreak}-day study streak! 🔥
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
            <Flame className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{studyStreak}</div>
            <p className="text-xs text-muted-foreground">
              days in a row
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Keep it up!
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions Attempted</CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalQuestions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              62% of database
            </p>
            <div className="mt-2">
              <Progress value={62} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{averageScore}%</div>
            <p className="text-xs text-success">
              +5% from last week
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs bg-success/10 text-success">
                Improving
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time This Week</CardTitle>
            <Clock className="h-4 w-4 text-primary-light" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{formatTime(timeThisWeek)}</div>
            <p className="text-xs text-muted-foreground">
              +1h 20m from last week
            </p>
            <div className="mt-2">
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Subject Performance</span>
            </CardTitle>
            <CardDescription>
              Your accuracy and progress by subject area
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subjectPerformance.map((subject) => (
              <div key={subject.subject} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{subject.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {subject.questionsAttempted} questions • Avg {formatTime(subject.averageTime)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{subject.accuracy}%</p>
                    <p className="text-xs text-muted-foreground">accuracy</p>
                  </div>
                </div>
                <Progress value={subject.accuracy} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Recent Sessions</span>
            </CardTitle>
            <CardDescription>
              Your latest practice test results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{session.testType} Practice</p>
                      <p className="text-sm text-muted-foreground">
                        {session.sessionType.replace('_', ' ')} • {session.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{session.score}%</p>
                    <Badge variant="secondary" className="text-xs">
                      {session.score >= 80 ? 'Great' : session.score >= 70 ? 'Good' : 'Fair'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Sessions
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Score Progress Chart */}
      <ProgressChart 
        data={state.analytics.scoreHistory}
        title="Score Progress"
        description="Your performance trend over time"
      />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Continue Your Prep</CardTitle>
          <CardDescription>
            Pick up where you left off or start something new
            {state.practiceSession && !state.practiceSession.isCompleted && (
              <Badge variant="secondary" className="ml-2">Session in progress</Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {state.practiceSession && !state.practiceSession.isCompleted ? (
              <Link to={`/dashboard/practice/session/${state.practiceSession.id}`}>
                <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <Play className="h-6 w-6" />
                  <span>Continue Last Session</span>
                </Button>
              </Link>
            ) : (
              <Link to="/dashboard/practice">
                <Button className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                  <Play className="h-6 w-6" />
                  <span>Start Practice</span>
                </Button>
              </Link>
            )}
            <Link to="/dashboard/analytics">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <BarChart3 className="h-6 w-6" />
                <span>View Analytics</span>
              </Button>
            </Link>
            <Link to="/dashboard/topics">
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2">
                <Target className="h-6 w-6" />
                <span>Review Weak Areas</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;