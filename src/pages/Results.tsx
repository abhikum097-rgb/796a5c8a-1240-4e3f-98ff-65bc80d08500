import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target, 
  BarChart3,
  RefreshCw,
  Eye,
  ArrowLeft,
  TrendingUp,
  Award,
  Play
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { generateMockQuestions } from "@/mock/data";

const Results = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  
  const session = state.practiceSession;

  if (!session || !session.isCompleted) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session not found</h2>
          <Button onClick={() => navigate('/practice')}>
            Back to Practice
          </Button>
        </div>
      </div>
    );
  }

  const answeredQuestions = Object.keys(session.userAnswers).filter(id => 
    session.userAnswers[id]?.selectedAnswer
  ).length;
  
  const correctAnswers = Object.entries(session.userAnswers)
    .filter(([questionId, answer]) => {
      const question = session.questions.find(q => q.id === questionId);
      return question && answer.selectedAnswer === question.correctAnswer;
    }).length;

  const incorrectAnswers = answeredQuestions - correctAnswers;
  const unanswered = session.questions.length - answeredQuestions;
  const score = session.score || 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent work!';
    if (score >= 80) return 'Great job!';
    if (score >= 70) return 'Good effort!';
    if (score >= 60) return 'Keep practicing!';
    return 'More practice needed';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const averageTimePerQuestion = Math.round(session.sessionTime / answeredQuestions) || 0;

  const handleRetakePractice = () => {
    const questions = generateMockQuestions(
      session.questions.length,
      {
        subject: session.subject,
        topic: session.topic,
        difficulty: session.difficulty
      }
    );
    
    dispatch({
      type: 'START_SESSION',
      payload: {
        testType: session.testType,
        sessionType: session.sessionType,
        subject: session.subject,
        topic: session.topic,
        difficulty: session.difficulty,
        questions
      }
    });
    
    navigate(`/dashboard/practice/session/${Date.now()}`);
  };

  // Calculate performance by topic
  const topicPerformance = session.questions.reduce((acc, question) => {
    const answer = session.userAnswers[question.id];
    if (!answer?.selectedAnswer) return acc;
    
    if (!acc[question.topic]) {
      acc[question.topic] = { correct: 0, total: 0 };
    }
    
    acc[question.topic].total++;
    if (answer.selectedAnswer === question.correctAnswer) {
      acc[question.topic].correct++;
    }
    
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Award className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Practice Complete!</h1>
        </div>
        <p className="text-muted-foreground">
          {session.sessionType.replace('_', ' ')} • {session.subject} {session.topic && `• ${session.topic}`}
        </p>
      </div>

      {/* Score Overview */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Your Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
              {score}%
            </div>
            <p className="text-lg text-muted-foreground">
              {getScoreMessage(score)}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-1">
              <div className="flex items-center justify-center text-success">
                <CheckCircle className="h-5 w-5 mr-1" />
                <span className="text-2xl font-bold">{correctAnswers}</span>
              </div>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center text-destructive">
                <XCircle className="h-5 w-5 mr-1" />
                <span className="text-2xl font-bold">{incorrectAnswers}</span>
              </div>
              <p className="text-sm text-muted-foreground">Incorrect</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center text-muted-foreground">
                <Target className="h-5 w-5 mr-1" />
                <span className="text-2xl font-bold">{unanswered}</span>
              </div>
              <p className="text-sm text-muted-foreground">Unanswered</p>
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-center text-primary">
                <Clock className="h-5 w-5 mr-1" />
                <span className="text-2xl font-bold">{formatTime(session.sessionTime)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Time</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Performance Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Questions Answered:</span>
                <span className="font-medium">{answeredQuestions}/{session.questions.length}</span>
              </div>
              <Progress value={(answeredQuestions / session.questions.length) * 100} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Accuracy:</span>
                <span className="font-medium">{score}%</span>
              </div>
              <Progress value={score} className="h-2" />
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Average Time per Question:</span>
              <span className="font-medium">{averageTimePerQuestion}s</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span>Difficulty Level:</span>
              <Badge>{session.difficulty || 'Mixed'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Topic Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(topicPerformance).map(([topic, stats]) => {
                const accuracy = Math.round((stats.correct / stats.total) * 100);
                return (
                  <div key={topic} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{topic}</span>
                      <span>{stats.correct}/{stats.total} ({accuracy}%)</span>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={() => navigate(`/results/${sessionId}/review`)}
          className="flex items-center space-x-2"
        >
          <Eye className="h-4 w-4" />
          <span>Review All Questions</span>
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate(`/results/${sessionId}/review?filter=wrong`)}
          className="flex items-center space-x-2"
        >
          <XCircle className="h-4 w-4" />
          <span>Review Wrong Answers</span>
        </Button>
        
        <Button 
          variant="outline"
          onClick={handleRetakePractice}
          className="flex items-center space-x-2"
        >
          <Play className="h-4 w-4" />
          <span>Retake Practice</span>
        </Button>

        <Button 
          variant="outline"
          onClick={() => navigate('/practice')}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Practice Again</span>
        </Button>
        
        <Button 
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Dashboard</span>
        </Button>
      </div>
    </div>
  );
};

export default Results;