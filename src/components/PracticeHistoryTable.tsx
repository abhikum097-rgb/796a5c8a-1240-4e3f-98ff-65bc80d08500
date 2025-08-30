import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, Target } from "lucide-react";

interface PracticeSession {
  id: string;
  created_at: string;
  test_type: string;
  session_type: string;
  subject?: string;
  topic?: string;
  score?: number;
  total_time_spent?: number;
  status: string;
}

interface PracticeHistoryTableProps {
  sessions: PracticeSession[];
}

const PracticeHistoryTable = ({ sessions }: PracticeHistoryTableProps) => {
  const navigate = useNavigate();

  const getPracticeTypeLabel = (sessionType: string) => {
    switch (sessionType) {
      case 'full_test':
        return 'Full Practice Test';
      case 'subject_practice':
        return 'Subject Practice';
      case 'topic_practice':
        return 'Topic Practice';
      case 'mixed_review':
        return 'Mixed Review';
      default:
        return 'Practice Session';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-destructive';
  };

  if (sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Practice History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No practice sessions yet</p>
            <p className="text-sm">Start practicing to see your progress here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Practice History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Test</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Practice Mode</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Subject/Topic</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Score</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Time</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-border hover:bg-accent transition-colors">
                  <td className="py-3 px-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(session.created_at)}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="outline" className="text-xs">
                      {session.test_type}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <Badge variant="secondary" className="text-xs">
                      {getPracticeTypeLabel(session.session_type)}
                    </Badge>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-foreground">
                      {session.subject || session.topic || 'Mixed'}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    {session.score !== null && session.score !== undefined ? (
                      <span className={`font-medium ${getScoreColor(session.score)}`}>
                        {session.score}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    {session.total_time_spent ? (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatTime(session.total_time_spent)}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                  <td className="py-3 px-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/results/${session.id}`)}
                      className="text-primary hover:text-primary-foreground hover:bg-primary"
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default PracticeHistoryTable;