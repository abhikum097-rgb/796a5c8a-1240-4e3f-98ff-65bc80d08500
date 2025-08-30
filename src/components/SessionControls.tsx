import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, Flag, Square } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

  const handleComplete = async () => {
    // Complete the session in state
    dispatch({ type: 'COMPLETE_SESSION' });
    
    // Save session to database if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        // Save practice session
        const { data: savedSession, error: sessionError } = await supabase
          .from('practice_sessions')
          .insert({
            user_id: user.id,
            test_type: session.testType,
            session_type: session.sessionType,
            subject: session.subject || null,
            topic: session.topic || null,
            difficulty: session.difficulty || null,
            total_questions: session.questions.length,
            status: 'completed',
            end_time: new Date().toISOString(),
            total_time_spent: session.sessionTime
          })
          .select()
          .single();

        if (sessionError) {
          console.error('Error saving session:', sessionError);
          throw sessionError;
        }

        // Save user answers
        const answersToSave = Object.entries(session.userAnswers)
          .filter(([_, answer]) => answer.selectedAnswer)
          .map(([questionId, answer]) => {
            const question = session.questions.find(q => q.id === questionId);
            const isCorrect = question ? answer.selectedAnswer === question.correctAnswer : false;
            
            return {
              session_id: savedSession.id,
              question_id: questionId,
              user_answer: answer.selectedAnswer,
              is_correct: isCorrect,
              is_flagged: answer.isFlagged || false,
              time_spent: answer.timeSpent || 0
            };
          });

        if (answersToSave.length > 0) {
          const { error: answersError } = await supabase
            .from('user_answers')
            .insert(answersToSave);

          if (answersError) {
            console.error('Error saving answers:', answersError);
          }
        }

        // Call complete-session function
        try {
          await supabase.functions.invoke('complete-session', {
            body: {
              sessionId: savedSession.id,
              totalTimeSpent: session.sessionTime
            }
          });
        } catch (functionError) {
          console.error('Error calling complete-session function:', functionError);
        }

        toast({
          title: "Practice Completed!",
          description: "Your results have been saved.",
        });

        navigate(`/results/${savedSession.id}`);
      } catch (error) {
        console.error('Error completing session:', error);
        toast({
          title: "Save Error",
          description: "Your practice was completed but results couldn't be saved.",
          variant: "destructive"
        });
        
        // Still navigate to results even if save failed
        navigate(`/results/${session.id}`);
      }
    } else {
      // Not authenticated, just go to results
      navigate(`/results/${session.id}`);
    }
  };

  const currentQuestionId = session.questions[session.currentQuestion]?.id;
  const isCurrentFlagged = currentQuestionId ? session.userAnswers[currentQuestionId]?.isFlagged : false;
  
  const answeredCount = Object.keys(session.userAnswers).filter(id => 
    session.userAnswers[id]?.selectedAnswer
  ).length;
  
  const correctCount = Object.entries(session.userAnswers)
    .filter(([questionId, answer]) => {
      const question = session.questions.find(q => q.id === questionId);
      return question && answer.selectedAnswer === question.correctAnswer;
    }).length;
  
  const progressPercentage = (answeredCount / session.questions.length) * 100;
  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

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

          {answeredCount > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Accuracy so far:</span>
                <span>{accuracy}%</span>
              </div>
              <Progress value={accuracy} className="h-2" />
            </div>
          )}

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