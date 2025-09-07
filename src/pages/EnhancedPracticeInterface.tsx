import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  Flag, 
  Play, 
  Pause,
  Square,
  AlertTriangle,
  BookOpen,
  CheckCircle
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { QuestionNavigator } from "@/components/QuestionNavigator";
import { SessionControls } from "@/components/SessionControls";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useServerSession } from "@/hooks/useServerSession";
import { useAuth } from "@/hooks/useAuth";
import { PracticeLoadingSkeleton } from "@/components/PracticeSkeletons";
import { SubmitConfirmationDialog } from "@/components/SubmitConfirmationDialog";
import { EnhancedReadingView } from "@/components/EnhancedReadingView";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EnhancedPracticeInterface = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { fetchQuestions, loading: questionsLoading } = useSupabaseQuestions();
  const { user, isAuthenticated } = useAuth();
  const { session: serverSession, loading: serverLoading, submitAnswer, updateSessionProgress } = useServerSession();
  
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [lastSavedAnswer, setLastSavedAnswer] = useState<string | null>(null);

  const session = state.practiceSession;

  // Initialize session if not exists - but don't auto-fetch, just set initializing to false
  useEffect(() => {
    if (!session && sessionId) {
      // Session not found, we'll show the "Session Not Found" message
      setIsInitializing(false);
    } else {
      setIsInitializing(false);
    }
  }, [session, sessionId]);

  // Show pause overlay when session is paused
  useEffect(() => {
    setShowPauseOverlay(session?.isPaused || false);
  }, [session?.isPaused]);

  // Auto-save answers when they change
  const currentQuestion = session?.questions[session.currentQuestion];
  const currentAnswer = session?.userAnswers[currentQuestion?.id];

  // Auto-save to server when answers change
  useEffect(() => {
    if (!currentQuestion || !currentAnswer?.selectedAnswer || !serverSession || !isAuthenticated) return;
    
    const answerKey = `${currentQuestion.id}-${currentAnswer.selectedAnswer}`;
    if (answerKey === lastSavedAnswer) return; // Avoid duplicate saves
    
    const timeoutId = setTimeout(() => {
      const isCorrect = currentAnswer.selectedAnswer === currentQuestion.correctAnswer;
      
      submitAnswer({
        sessionId: serverSession.id,
        questionId: currentQuestion.id,
        userAnswer: currentAnswer.selectedAnswer,
        timeSpent: currentAnswer.timeSpent || 0,
        isCorrect,
        isFlagged: currentAnswer.isFlagged
      });
      
      setLastSavedAnswer(answerKey);
      
      // Show subtle save indicator
      toast({
        title: "Answer saved",
        description: "Your progress is automatically saved.",
        duration: 2000,
      });
    }, 1000); // Debounce saves by 1 second
    
    return () => clearTimeout(timeoutId);
  }, [currentAnswer?.selectedAnswer, currentAnswer?.isFlagged, currentQuestion, serverSession, submitAnswer, lastSavedAnswer, isAuthenticated]);

  // Update server session progress when question changes
  useEffect(() => {
    if (session && serverSession && isAuthenticated) {
      updateSessionProgress(serverSession.id, session.currentQuestion);
    }
  }, [session?.currentQuestion, serverSession, updateSessionProgress, isAuthenticated]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!session || session.isPaused) return;
      
      switch (e.key.toLowerCase()) {
        case 'arrowleft':
          e.preventDefault();
          handlePrevious();
          break;
        case 'arrowright':
          e.preventDefault();
          handleNext();
          break;
        case 'a':
        case 'b':
        case 'c':
        case 'd':
          if (e.target instanceof HTMLElement && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            handleAnswerSelect(e.key.toUpperCase() as 'A' | 'B' | 'C' | 'D');
          }
          break;
        case 'f':
          e.preventDefault();
          handleFlag();
          break;
        case ' ':
          if (e.target instanceof HTMLElement && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            handlePauseResume();
          }
          break;
        case 'enter':
          if (e.target instanceof HTMLElement && e.target.tagName !== 'INPUT') {
            e.preventDefault();
            if (session.currentQuestion === session.questions.length - 1) {
              handleFinishPractice();
            } else {
              handleNext();
            }
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [session]);

  if (isInitializing || questionsLoading || serverLoading) {
    return <PracticeLoadingSkeleton />;
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Session Not Found</h2>
          <Button onClick={() => navigate('/practice')}>
            Return to Practice
          </Button>
        </div>
      </div>
    );
  }

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;
    
    dispatch({
      type: 'ANSWER_QUESTION',
      payload: {
        questionId: currentQuestion.id,
        answer: {
          questionId: currentQuestion.id,
          selectedAnswer: answer,
          timeSpent: 0,
          isFlagged: currentAnswer?.isFlagged || false
        }
      }
    });
  };

  const handlePrevious = () => {
    if (session.currentQuestion > 0) {
      dispatch({ type: 'GO_TO_QUESTION', payload: session.currentQuestion - 1 });
    }
  };

  const handleNext = () => {
    if (session.currentQuestion < session.questions.length - 1) {
      dispatch({ type: 'GO_TO_QUESTION', payload: session.currentQuestion + 1 });
    }
  };

  const handleFlag = () => {
    if (currentQuestion) {
      dispatch({ type: 'TOGGLE_FLAG', payload: currentQuestion.id });
    }
  };

  const handlePauseResume = () => {
    if (session.isPaused) {
      dispatch({ type: 'RESUME_SESSION' });
    } else {
      dispatch({ type: 'PAUSE_SESSION' });
    }
  };

  const handleFinishPractice = () => {
    // Show confirmation dialog first
    setShowSubmitDialog(true);
  };

  const confirmSubmitPractice = async () => {
    if (!session) return;
    
    setShowSubmitDialog(false);
    
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

        // Call complete-session function to update analytics
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
          description: "Your results have been saved and analyzed.",
        });

        // Navigate to results page
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

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    navigate('/practice');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(session.userAnswers).filter(id => 
    session.userAnswers[id]?.selectedAnswer
  ).length;
  
  const flaggedCount = Object.keys(session.userAnswers).filter(id => 
    session.userAnswers[id]?.isFlagged
  ).length;

  return (
    <div className="h-screen flex flex-col">
      {/* Enhanced Header */}
      <div className="border-b bg-card p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">
            Question {session.currentQuestion + 1} of {session.questions.length}
          </h1>
          {currentQuestion && (
            <DifficultyBadge difficulty={currentQuestion.difficulty} />
          )}
          {currentQuestion?.subject === 'Reading' && (
            <Badge variant="outline" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              Reading Comprehension
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm font-mono bg-muted px-3 py-1 rounded">
            {formatTime(session.sessionTime)}
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3 text-success" />
              <span>Auto-save on</span>
            </div>
          ) : (
            <div className="text-xs text-warning">Not saving</div>
          )}
          <Button variant="outline" size="sm" onClick={handleExit}>
            Exit Practice
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Question Panel (70%) */}
        <div className="lg:flex-[7] flex flex-col p-6 overflow-y-scroll scrollbar-stable lg:border-r">
          {currentQuestion && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Enhanced Reading View for Reading Questions */}
              {currentQuestion.subject === 'Reading' && currentQuestion.passage ? (
                <EnhancedReadingView
                  question={currentQuestion}
                  currentAnswer={currentAnswer}
                  onAnswerSelect={handleAnswerSelect}
                  onFlag={handleFlag}
                />
              ) : (
                /* Regular Question View for Math/Verbal */
                <div className="space-y-6">
                  {/* Info banner for reading questions without passage */}
                  {currentQuestion.subject === 'Reading' && !currentQuestion.passage && (
                    <Card className="border-l-4 border-l-warning bg-warning/10">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-sm text-warning-foreground">
                          <AlertTriangle className="h-4 w-4" />
                          <span>This reading comprehension question may be missing its passage.</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Question Card */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {currentQuestion.subject} • {currentQuestion.topic}
                            </Badge>
                            <DifficultyBadge difficulty={currentQuestion.difficulty} />
                          </div>
                          <Button
                            variant={currentAnswer?.isFlagged ? "default" : "outline"}
                            size="sm"
                            onClick={handleFlag}
                            className="gap-2"
                          >
                            <Flag className={`h-4 w-4 ${currentAnswer?.isFlagged ? 'fill-current' : ''}`} />
                            {currentAnswer?.isFlagged ? 'Flagged' : 'Flag'}
                          </Button>
                        </div>
                        
                        <div className="text-lg leading-relaxed whitespace-pre-wrap">
                          {currentQuestion.questionText}
                        </div>
                        
                        {/* Render question images if available */}
                        {currentQuestion.questionImages && currentQuestion.questionImages.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {currentQuestion.questionImages.map((imageUrl, index) => (
                              <div key={index} className="border rounded-lg overflow-hidden">
                                <img 
                                  src={imageUrl} 
                                  alt={`Question image ${index + 1}`}
                                  className="w-full max-w-2xl mx-auto cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(imageUrl, '_blank')}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Answer Options */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Select your answer:</h3>
                    {Object.entries(currentQuestion.options).map(([option, text]) => (
                      <Button
                        key={option}
                        variant={currentAnswer?.selectedAnswer === option ? "default" : "outline"}
                        className="w-full justify-start text-left p-4 h-auto min-h-[3rem] hover:bg-muted/50 transition-colors"
                        onClick={() => handleAnswerSelect(option as 'A' | 'B' | 'C' | 'D')}
                      >
                        <span className="font-bold mr-3 min-w-[1.5rem] text-primary">{option}.</span>
                        <span className="flex-1 leading-relaxed">{text}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fixed Navigation Bar */}
              <div className="sticky bottom-0 bg-card border-t border-border p-6 mt-6 rounded-t-lg shadow-lg">
                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Previous Button - Left */}
                  <div className="flex justify-start">
                    <Button 
                      variant="outline" 
                      onClick={handlePrevious}
                      disabled={session.currentQuestion === 0}
                      className="flex items-center space-x-2 px-6 py-3 min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </Button>
                  </div>
                  
                  {/* Center - Progress & Auto-save indicator */}
                  <div className="flex flex-col justify-center items-center">
                    <span className="text-sm text-muted-foreground font-medium">
                      {session.currentQuestion + 1} / {session.questions.length}
                    </span>
                    {isAuthenticated && lastSavedAnswer && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <CheckCircle className="h-3 w-3 text-success" />
                        <span>Auto-saved</span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Press Enter to {session.currentQuestion === session.questions.length - 1 ? 'submit' : 'continue'}
                    </div>
                  </div>
                  
                  {/* Next/Submit Button - Right */}
                  <div className="flex justify-end">
                    {session.currentQuestion === session.questions.length - 1 ? (
                      <Button 
                        onClick={handleFinishPractice} 
                        className="flex items-center space-x-2 px-6 py-3 min-w-[120px] bg-success text-success-foreground hover:bg-success/90"
                      >
                        <span>Submit</span>
                        <Square className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNext}
                        className="flex items-center space-x-2 px-6 py-3 min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Panel (30%) */}
        <div className="lg:flex-[3] border-l bg-muted/30 p-4 space-y-4 overflow-y-scroll scrollbar-stable">
          <QuestionNavigator />
          <SessionControls />
          
          {/* Keyboard Shortcuts Help */}
          <Card className="bg-muted/50 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-1">
              <div>A/B/C/D - Select answer</div>
              <div>← → - Navigate questions</div>
              <div>F - Flag question</div>
              <div>Space - Pause/Resume</div>
              <div>Enter - Next/Submit</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pause Overlay */}
      {showPauseOverlay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader className="text-center">
              <Pause className="h-12 w-12 mx-auto mb-4 text-primary" />
              <CardTitle>Practice Paused</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Take a break! Your progress is automatically saved.
              </p>
              <Button onClick={handlePauseResume} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Resume Practice
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      <SubmitConfirmationDialog
        isOpen={showSubmitDialog}
        onConfirm={confirmSubmitPractice}
        onCancel={() => setShowSubmitDialog(false)}
        totalQuestions={session.questions.length}
        answeredCount={answeredCount}
        flaggedCount={flaggedCount}
        timeSpent={formatTime(session.sessionTime)}
      />

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Practice Session?</AlertDialogTitle>
            <AlertDialogDescription>
              {isAuthenticated 
                ? "Your progress has been automatically saved and you can resume later."
                : "Your progress will be lost if you exit now."
              } Are you sure you want to leave?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>Exit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedPracticeInterface;