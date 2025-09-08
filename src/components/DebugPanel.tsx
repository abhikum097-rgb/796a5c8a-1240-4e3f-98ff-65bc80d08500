import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, RefreshCw, Database, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useServerSession } from '@/hooks/useServerSession';
import { toast } from '@/hooks/use-toast';

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ isOpen, onClose }) => {
  const { state, dispatch } = useApp();
  const { session: serverSession, loading, error } = useServerSession();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleForceSync = async () => {
    if (!state.practiceSession?.serverSessionId) {
      toast({
        title: "No server session",
        description: "Cannot sync - no server session ID found",
        variant: "destructive"
      });
      return;
    }

    try {
      // Force save current state to localStorage
      localStorage.setItem('practiceSession', JSON.stringify(state.practiceSession));
      
      toast({
        title: "State synced",
        description: "Local state has been saved to localStorage"
      });
    } catch (err) {
      toast({
        title: "Sync failed",
        description: "Could not sync session state",
        variant: "destructive"
      });
    }
  };

  const handleClearSession = () => {
    localStorage.removeItem('practiceSession');
    dispatch({ type: 'COMPLETE_SESSION' });
    
    toast({
      title: "Session cleared",
      description: "Local session data has been removed"
    });
  };

  if (!isOpen) return null;

  const currentSession = state.practiceSession;
  const sessionStats = currentSession ? {
    totalQuestions: currentSession.questions.length,
    answeredQuestions: Object.keys(currentSession.userAnswers).length,
    correctAnswers: Object.values(currentSession.userAnswers).filter(a => {
      const question = currentSession.questions.find(q => q.id === Object.keys(currentSession.userAnswers).find(k => currentSession.userAnswers[k] === a));
      return question && question.correctAnswer === a.selectedAnswer;
    }).length,
    flaggedQuestions: Object.values(currentSession.userAnswers).filter(a => a.isFlagged).length,
    currentQuestion: currentSession.currentQuestion + 1,
    sessionTime: Math.floor(currentSession.sessionTime / 60)
  } : null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Debug Panel
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleForceSync} disabled={!currentSession?.serverSessionId}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Force Sync
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearSession} disabled={!currentSession}>
              <AlertCircle className="h-4 w-4 mr-1" />
              Clear Session
            </Button>
          </div>

          <Separator />

          {/* Session Overview */}
          <Collapsible open={expandedSections.overview} onOpenChange={() => toggleSection('overview')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
              {expandedSections.overview ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-semibold">Session Overview</span>
              {currentSession && <Badge variant="secondary">{currentSession.sessionType}</Badge>}
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {currentSession ? (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Local ID:</strong> {currentSession.id}
                  </div>
                  <div>
                    <strong>Server ID:</strong> {currentSession.serverSessionId || 'None'}
                  </div>
                  <div>
                    <strong>Test Type:</strong> {currentSession.testType}
                  </div>
                  <div>
                    <strong>Subject:</strong> {currentSession.subject || 'N/A'}
                  </div>
                  <div>
                    <strong>Topic:</strong> {currentSession.topic || 'N/A'}
                  </div>
                  <div>
                    <strong>Status:</strong> 
                    <Badge className="ml-2" variant={currentSession.isPaused ? "secondary" : currentSession.isCompleted ? "outline" : "default"}>
                      {currentSession.isPaused ? 'Paused' : currentSession.isCompleted ? 'Completed' : 'Active'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground">No active session</div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Session Stats */}
          {sessionStats && (
            <>
              <Collapsible open={expandedSections.stats} onOpenChange={() => toggleSection('stats')}>
                <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
                  {expandedSections.stats ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-semibold">Session Statistics</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{sessionStats.answeredQuestions}/{sessionStats.totalQuestions}</div>
                      <div className="text-muted-foreground">Answered</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{sessionStats.correctAnswers}</div>
                      <div className="text-muted-foreground">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{sessionStats.flaggedQuestions}</div>
                      <div className="text-muted-foreground">Flagged</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{sessionStats.currentQuestion}</div>
                      <div className="text-muted-foreground">Current Q</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold flex items-center justify-center gap-1">
                        <Clock className="h-5 w-5" />
                        {sessionStats.sessionTime}m
                      </div>
                      <div className="text-muted-foreground">Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {sessionStats.answeredQuestions > 0 ? Math.round((sessionStats.correctAnswers / sessionStats.answeredQuestions) * 100) : 0}%
                      </div>
                      <div className="text-muted-foreground">Accuracy</div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
              <Separator />
            </>
          )}

          {/* Server State */}
          <Collapsible open={expandedSections.server} onOpenChange={() => toggleSection('server')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
              {expandedSections.server ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-semibold">Server State</span>
              <Badge variant={loading ? "secondary" : error ? "destructive" : "default"}>
                {loading ? "Loading" : error ? "Error" : "Ready"}
              </Badge>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 space-y-2">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  Error: {error}
                </div>
              )}
              {serverSession && (
                <div className="text-sm space-y-1">
                  <div><strong>Server Session ID:</strong> {serverSession.id}</div>
                  <div><strong>Status:</strong> {serverSession.status}</div>
                  <div><strong>Questions:</strong> {serverSession.total_questions}</div>
                  <div><strong>Current Index:</strong> {serverSession.current_question_index}</div>
                  <div><strong>Time Spent:</strong> {Math.floor(serverSession.total_time_spent / 60)}m</div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Local Storage */}
          <Collapsible open={expandedSections.storage} onOpenChange={() => toggleSection('storage')}>
            <CollapsibleTrigger className="flex items-center gap-2 w-full text-left">
              {expandedSections.storage ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              <span className="font-semibold">Local Storage</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <div className="text-sm space-y-2">
                <div>
                  <strong>Practice Session:</strong>{' '}
                  {localStorage.getItem('practiceSession') ? (
                    <Badge variant="default">Stored</Badge>
                  ) : (
                    <Badge variant="secondary">Empty</Badge>
                  )}
                </div>
                {localStorage.getItem('practiceSession') && (
                  <details className="text-xs">
                    <summary className="cursor-pointer">View Raw Data</summary>
                    <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                      {JSON.stringify(JSON.parse(localStorage.getItem('practiceSession') || '{}'), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
};