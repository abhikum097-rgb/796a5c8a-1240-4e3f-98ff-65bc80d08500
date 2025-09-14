import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Flag, Play, Pause, LogOut, Check, X, Clock, Target, AlertCircle, Settings, CheckCircle, Save, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/hooks/useAuth';
import { useServerSession } from '@/hooks/useServerSession';
import { Question, UserAnswer } from '@/types/app';
import { DifficultyBadge } from '@/components/DifficultyBadge';
import { QuestionNavigator } from '@/components/QuestionNavigator';
import { SessionControls } from '@/components/SessionControls';
import { EnhancedReadingView } from '@/components/EnhancedReadingView';
import { PracticeLoadingSkeleton } from '@/components/PracticeSkeletons';
import { SubmitConfirmationDialog } from '@/components/SubmitConfirmationDialog';
import { DebugPanel } from '@/components/DebugPanel';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EnhancedPracticeInterface = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch, isDebugMode } = useApp();
  const { user, requireAuth, loading: authLoading } = useAuth();
  const { loadSession, submitAnswer, updateSessionProgress, error } = useServerSession();
  
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showPauseOverlay, setShowPauseOverlay] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [sessionNotFound, setSessionNotFound] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  const practiceSession = state.practiceSession;

  // Enhanced session recovery - load from server if needed
  useEffect(() => {
    const initializeSession = async () => {
      console.group('🔄 Initializing practice session');
      console.log('URL sessionId:', sessionId);
      console.log('Current session in state:', practiceSession?.id);
      console.log('Server session ID in state:', practiceSession?.serverSessionId);
      console.log('User authenticated:', !!user);
      console.log('Auth loading:', authLoading);
      
      if (!sessionId) {
        console.log('❌ No sessionId in URL');
        setSessionNotFound(true);
        setSessionLoading(false);
        console.groupEnd();
        return;
      }

      // Wait for authentication to complete
      if (authLoading) {
        console.log('⏳ Waiting for authentication...');
        console.groupEnd();
        return;
      }

      // Require authentication before proceeding
      if (!user) {
        console.log('❌ User not authenticated, redirecting...');
        setSessionNotFound(true);
        setSessionLoading(false);
        requireAuth(`/practice/session/${sessionId}`);
        console.groupEnd();
        return;
      }

      // Check if we have a valid authentication session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
          console.log('❌ No valid auth session, redirecting to login...');
          setSessionNotFound(true);
          setSessionLoading(false);
          requireAuth(`/practice/session/${sessionId}`);
          console.groupEnd();
          return;
        }
        console.log('✅ Valid auth session found, proceeding with session load...');
      });

      // If we have a session with matching server ID, we're good
      if (practiceSession && practiceSession.serverSessionId === sessionId) {
        console.log('✅ Session already loaded and matches URL');
        setSessionLoading(false);
        console.groupEnd();
        return;
      }

      // Try to load session from server
      console.log('📡 Loading session from server...');
      setQuestionsLoading(true);
      
      try {
        // Load server session data
        const serverSession = await loadSession(sessionId);
        
        // SECURITY: Fetch safe questions only (no answers/explanations)
        console.log('📋 Securely fetching questions...');
        const { data, error: questionsError } = await supabase.functions.invoke('get-session-questions', {
          body: { sessionId }
        });

        if (questionsError) {
          throw new Error('Failed to load session questions');
        }

        const sortedQuestions = data.questions;

        // Fetch existing user answers
        console.log('📝 Fetching existing user answers...');
        const { data: answersData, error: answersError } = await supabase
          .from('user_answers')
          .select('*')
          .eq('session_id', sessionId);

        if (answersError) {
          console.error('Error fetching answers:', answersError);
        }

        // Convert to app format
        const userAnswers: Record<string, UserAnswer> = {};
        (answersData || []).forEach(answer => {
          if (answer.question_id) {
            userAnswers[answer.question_id] = {
              questionId: answer.question_id,
              selectedAnswer: answer.user_answer as 'A' | 'B' | 'C' | 'D',
              timeSpent: answer.time_spent || 0,
              isFlagged: answer.is_flagged || false,
              confidence: answer.confidence_level as 'Low' | 'Medium' | 'High' | undefined
            };
          }
        });

        // Create complete session object for hydration
        const recoveredSession = {
          id: practiceSession?.id || `session_${Date.now()}`,
          serverSessionId: serverSession.id,
          testType: serverSession.test_type as any,
          sessionType: serverSession.session_type as any,
          subject: serverSession.subject as any,
          topic: serverSession.topic,
          difficulty: serverSession.difficulty as any,
          questions: sortedQuestions.map(q => ({
            id: q.id,
            testType: q.test_type,
            subject: q.subject,
            topic: q.topic,
            difficulty: q.difficulty_level as 'Easy' | 'Medium' | 'Hard',
            questionText: q.question_text,
            questionImages: q.question_images,
            passage: q.passage,
            options: {
              A: q.option_a,
              B: q.option_b,
              C: q.option_c,
              D: q.option_d
            },
            // SECURITY: Hide answers during practice - will be revealed in results
            correctAnswer: 'HIDDEN',
            explanation: 'Available after session completion',
            timeAllocated: q.time_allocated || 60
          })),
          userAnswers,
          currentQuestion: serverSession.current_question_index || 0,
          startTime: new Date(serverSession.start_time),
          endTime: serverSession.end_time ? new Date(serverSession.end_time) : undefined,
          sessionTime: serverSession.total_time_spent || 0,
          isPaused: serverSession.status === 'paused',
          isCompleted: serverSession.status === 'completed',
          score: serverSession.score
        };

        console.log('✅ Session recovered successfully');
        console.log('Questions loaded:', recoveredSession.questions.length);
        console.log('Answers loaded:', Object.keys(recoveredSession.userAnswers).length);
        console.log('Current question index:', recoveredSession.currentQuestion);

        // Hydrate the session (don't use START_SESSION as it resets progress)
        dispatch({ type: 'HYDRATE_SESSION', payload: recoveredSession });
        
        toast({
          title: "Session restored",
          description: `Loaded ${recoveredSession.questions.length} questions with ${Object.keys(recoveredSession.userAnswers).length} saved answers`
        });
        
      } catch (error) {
        console.error('❌ Failed to recover session:', error);
        setSessionNotFound(true);
        toast({
          title: "Session recovery failed",
          description: "Could not load your practice session. Please start a new one.",
          variant: "destructive"
        });
      } finally {
        setSessionLoading(false);
        setQuestionsLoading(false);
        console.groupEnd();
      }
    };

    initializeSession();
  }, [sessionId, practiceSession, loadSession, dispatch, user, authLoading, requireAuth]);

  // Show pause overlay when session is paused
  useEffect(() => {
    setShowPauseOverlay(practiceSession?.isPaused || false);
  }, [practiceSession?.isPaused]);

  // SECURITY: Debounced auto-save function (server determines correctness)
  const debouncedAutoSave = useCallback(
    async (questionId: string, answer: UserAnswer) => {
      if (!practiceSession?.serverSessionId || !user) return;

      setSaveStatus('saving');
      
      try {
        console.log('💾 Auto-saving answer for question:', questionId);
        await submitAnswer({
          sessionId: practiceSession.serverSessionId,
          questionId,
          userAnswer: answer.selectedAnswer,
          timeSpent: answer.timeSpent,
          isFlagged: answer.isFlagged
        });

        await updateSessionProgress(
          practiceSession.serverSessionId, 
          practiceSession.currentQuestion
        );

        setLastSaveTime(Date.now());
        setSaveStatus('saved');
        
        // Clear save status after 2 seconds
        setTimeout(() => setSaveStatus(null), 2000);
        
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 3000);
        
        toast({
          title: "Save failed",
          description: "Could not save your answer. Please check your connection.",
          variant: "destructive"
        });
      }
    }, 
    [practiceSession?.serverSessionId, practiceSession?.currentQuestion, user, submitAnswer, updateSessionProgress]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!practiceSession || practiceSession.isPaused) return;
      
      // Debug panel shortcut
      if (e.key === 'F12' && isDebugMode) {
        e.preventDefault();
        setShowDebugPanel(!showDebugPanel);
        return;
      }
      
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
          if (e.target instanceof HTMLElement && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            e.preventDefault();
            handleAnswerSelect(e.key.toUpperCase() as 'A' | 'B' | 'C' | 'D');
          }
          break;
        case 'f':
          if (e.target instanceof HTMLElement && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            e.preventDefault();
            handleFlag();
          }
          break;
        case ' ':
          if (e.target instanceof HTMLElement && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            e.preventDefault();
            handlePauseResume();
          }
          break;
        case 'enter':
          if (e.target instanceof HTMLElement && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            e.preventDefault();
            if (practiceSession.currentQuestion === practiceSession.questions.length - 1) {
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
  }, [practiceSession, showDebugPanel, isDebugMode]);

  if (authLoading || sessionLoading || questionsLoading) {
    return <PracticeLoadingSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-warning" />
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Please log in to access your practice session.
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionNotFound || error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle>Session Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {error || "We couldn't find your practice session. It may have expired or been removed."}
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/practice')} className="w-full">
                Start New Practice
              </Button>
              {error && error.includes('Authentication') && (
                <Button 
                  onClick={() => requireAuth(`/practice/session/${sessionId}`)} 
                  variant="outline" 
                  className="w-full"
                >
                  Log In Again
                </Button>
              )}
              <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!practiceSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-warning" />
            <CardTitle>No Active Session</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              No practice session is currently active.
            </p>
            <Button onClick={() => navigate('/practice')} className="w-full">
              Start Practice
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = practiceSession.questions[practiceSession.currentQuestion];
  const currentAnswer = practiceSession.userAnswers[currentQuestion?.id];

  const handleAnswerSelect = (answer: 'A' | 'B' | 'C' | 'D') => {
    if (!currentQuestion) return;

    const updatedAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: answer,
      timeSpent: currentAnswer?.timeSpent || 0,
      isFlagged: currentAnswer?.isFlagged || false,
      confidence: currentAnswer?.confidence
    };

    dispatch({ type: 'ANSWER_QUESTION', payload: { questionId: currentQuestion.id, answer: updatedAnswer } });
    
    // SECURITY: Let server determine correctness - don't pass isCorrect from client
    if (practiceSession.serverSessionId) {
      debouncedAutoSave(currentQuestion.id, updatedAnswer);
    }
  };

  const handleFlag = () => {
    if (!currentQuestion) return;
    dispatch({ type: 'TOGGLE_FLAG', payload: currentQuestion.id });
    
    // Auto-save flag status
    if (practiceSession.serverSessionId && currentAnswer) {
      const updatedAnswer = { ...currentAnswer, isFlagged: !currentAnswer.isFlagged };
      debouncedAutoSave(currentQuestion.id, updatedAnswer);
    }
  };

  const handleNext = () => {
    if (practiceSession.currentQuestion < practiceSession.questions.length - 1) {
      dispatch({ type: 'GO_TO_QUESTION', payload: practiceSession.currentQuestion + 1 });
    }
  };

  const handlePrevious = () => {
    if (practiceSession.currentQuestion > 0) {
      dispatch({ type: 'GO_TO_QUESTION', payload: practiceSession.currentQuestion - 1 });
    }
  };

  const handlePauseResume = () => {
    if (practiceSession.isPaused) {
      dispatch({ type: 'RESUME_SESSION' });
    } else {
      dispatch({ type: 'PAUSE_SESSION' });
    }
  };

  const handleFinishPractice = () => {
    setShowSubmitDialog(true);
  };

  const confirmSubmitPractice = async () => {
    if (!practiceSession?.serverSessionId) {
      navigate('/results', { 
        state: { 
          session: practiceSession,
          isLocalSession: true 
        } 
      });
      return;
    }

    try {
      // Complete session on server
      const { data, error } = await supabase.functions.invoke('complete-session', {
        body: { sessionId: practiceSession.serverSessionId }
      });

      if (error) {
        throw error;
      }

      dispatch({ type: 'COMPLETE_SESSION' });
      
      navigate('/results', { 
        state: { 
          session: practiceSession,
          serverSessionId: practiceSession.serverSessionId,
          results: data 
        } 
      });
    } catch (error) {
      console.error('Error completing session:', error);
      toast({
        title: "Submission failed",
        description: "Could not complete your session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    navigate('/dashboard');
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate statistics
  const answeredCount = Object.keys(practiceSession.userAnswers).length;
  const flaggedCount = Object.values(practiceSession.userAnswers).filter(a => a.isFlagged).length;
  const progress = (practiceSession.currentQuestion + 1) / practiceSession.questions.length * 100;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">
            {practiceSession.testType} Practice - {practiceSession.sessionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h1>
          {practiceSession.subject && (
            <Badge variant="secondary">{practiceSession.subject}</Badge>
          )}
          {practiceSession.topic && (
            <Badge variant="outline">{practiceSession.topic}</Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Debug Panel Toggle */}
          {isDebugMode && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDebugPanel(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Debug
            </Button>
          )}
          
          {/* Save Status Indicator */}
          {saveStatus && (
            <div className="flex items-center gap-2 text-sm">
              {saveStatus === 'saving' && (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">Saving...</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-green-600">Saved</span>
                </>
              )}
              {saveStatus === 'error' && (
                <>
                  <AlertCircle className="h-3 w-3 text-red-600" />
                  <span className="text-red-600">Save failed</span>
                </>
              )}
            </div>
          )}
          
          {/* Timer */}
          <div className="flex items-center space-x-1 text-sm font-mono">
            <Clock className="h-4 w-4" />
            <span>{formatTime(practiceSession.sessionTime)}</span>
          </div>
          
          {/* Progress */}
          <div className="flex items-center space-x-2">
            <Progress value={progress} className="w-20" />
            <span className="text-sm font-medium whitespace-nowrap">
              {practiceSession.currentQuestion + 1} / {practiceSession.questions.length}
            </span>
          </div>
          
          <Button variant="outline" size="sm" onClick={handleExit}>
            <LogOut className="h-4 w-4 mr-1" />
            Exit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Question Panel (70%) */}
        <div className="lg:flex-[7] flex flex-col p-6 overflow-y-auto lg:border-r">
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
                /* Regular Question View */
                <div className="space-y-6">
                  {/* Missing passage warning */}
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
                        
                        {/* Question images */}
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

              {/* Navigation Bar */}
              <div className="sticky bottom-0 bg-card border-t border-border p-6 mt-6 rounded-t-lg shadow-lg">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="flex justify-start">
                    <Button 
                      variant="outline" 
                      onClick={handlePrevious}
                      disabled={practiceSession.currentQuestion === 0}
                      className="flex items-center space-x-2 px-6 py-3"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </Button>
                  </div>
                  
                  <div className="flex flex-col justify-center items-center">
                    <span className="text-sm text-muted-foreground font-medium">
                      {practiceSession.currentQuestion + 1} / {practiceSession.questions.length}
                    </span>
                    <div className="text-xs text-muted-foreground mt-1">
                      Press Enter to {practiceSession.currentQuestion === practiceSession.questions.length - 1 ? 'submit' : 'continue'}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    {practiceSession.currentQuestion === practiceSession.questions.length - 1 ? (
                      <Button 
                        onClick={handleFinishPractice} 
                        className="flex items-center space-x-2 px-6 py-3"
                      >
                        <span>Submit</span>
                        <Check className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleNext}
                        className="flex items-center space-x-2 px-6 py-3"
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
        <div className="lg:flex-[3] border-l bg-muted/30 p-4 space-y-4 overflow-y-auto">
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
              {isDebugMode && <div>F12 - Debug panel</div>}
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
        totalQuestions={practiceSession.questions.length}
        answeredCount={answeredCount}
        flaggedCount={flaggedCount}
        timeSpent={formatTime(practiceSession.sessionTime)}
      />

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Practice Session?</AlertDialogTitle>
            <AlertDialogDescription>
              {user && practiceSession.serverSessionId
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

      {/* Debug Panel */}
      {isDebugMode && (
        <DebugPanel 
          isOpen={showDebugPanel} 
          onClose={() => setShowDebugPanel(false)} 
        />
      )}
    </div>
  );
};

export default EnhancedPracticeInterface;