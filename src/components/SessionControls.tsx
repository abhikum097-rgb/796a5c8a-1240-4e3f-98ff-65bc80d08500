import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Flag, Square } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

export function SessionControls() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const session = state.practiceSession;

  if (!session) return null;

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePauseResume = () => {
    if (session.isPaused) {
      dispatch({ type: 'RESUME_SESSION' });
    } else {
      dispatch({ type: 'PAUSE_SESSION' });
    }
  };

  const handleFlag = () => {
    const currentQuestionId = session.questions[session.currentQuestion]?.id;
    if (currentQuestionId) {
      dispatch({ type: 'TOGGLE_FLAG', payload: currentQuestionId });
    }
  };

  const handleComplete = () => {
    dispatch({ type: 'COMPLETE_SESSION' });
    navigate(`/results/${session.id}`);
  };

  const currentQuestionId = session.questions[session.currentQuestion]?.id;
  const isCurrentFlagged = currentQuestionId ? session.userAnswers[currentQuestionId]?.isFlagged : false;
  
  const answeredCount = Object.keys(session.userAnswers).filter(id => 
    session.userAnswers[id]?.selectedAnswer
  ).length;
  
  const progressPercentage = (answeredCount / session.questions.length) * 100;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Session Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Time Elapsed:</span>
            <span className="font-mono font-medium">{formatTime(session.sessionTime)}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Progress:</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <div>Type: {session.sessionType.replace('_', ' ')}</div>
            {session.subject && <div>Subject: {session.subject}</div>}
            {session.topic && <div>Topic: {session.topic}</div>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant={session.isPaused ? "default" : "outline"}
            onClick={handlePauseResume}
            className="w-full"
          >
            {session.isPaused ? (
              <>
                <Play className="h-4 w-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pause
              </>
            )}
          </Button>

          <Button
            variant={isCurrentFlagged ? "default" : "outline"}
            onClick={handleFlag}
            className="w-full"
          >
            <Flag className={`h-4 w-4 mr-2 ${isCurrentFlagged ? 'fill-current' : ''}`} />
            {isCurrentFlagged ? 'Unflag' : 'Flag'} Question
          </Button>

          <Button
            variant="destructive"
            onClick={handleComplete}
            className="w-full"
          >
            <Square className="h-4 w-4 mr-2" />
            Complete Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}