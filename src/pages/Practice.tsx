import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, TrendingUp, Play, BookOpen, Users, Award, CheckCircle, Calendar } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { useAuth } from "@/hooks/useAuth";
import { TopicSelector } from "@/components/TopicSelector";
import { useQuestionCount } from "@/hooks/useQuestionCount";
import { useRecentPractice } from "@/hooks/useRecentPractice";
import { formatDistance } from 'date-fns';
import { toast } from "@/hooks/use-toast";
import { useServerSession } from "@/hooks/useServerSession";

const Practice = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { fetchQuestions, loading } = useSupabaseQuestions();
  const { isAuthenticated, requireAuth } = useAuth();
  const { createSession } = useServerSession();
  const [selectedTestType, setSelectedTestType] = useState<'SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS'>(state.user?.selectedTest || 'SHSAT');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedMode, setSelectedMode] = useState<'quick' | 'subject' | 'full' | 'mixed'>('quick');
  
  // Define practice modes with their configurations
  const practiceModesToOptions = {
    quick: { 
      name: 'Quick Practice', 
      questions: 15, 
      time: '15 min', 
      sessionType: 'mixed_review' as const,
      description: 'Short session with mixed questions',
      allowAllFilters: true,
      requireSubject: false
    },
    subject: { 
      name: 'Subject/Topic Focus', 
      questions: 25, 
      time: '30 min', 
      sessionType: 'subject_practice' as const,
      description: 'Focus on specific subject or topic',
      allowAllFilters: true,
      requireSubject: true
    },
    full: { 
      name: 'Full Practice Test', 
      questions: 50, 
      time: '2+ hours', 
      sessionType: 'full_test' as const,
      description: 'Complete practice test with all subjects',
      allowAllFilters: false, // Only test type and difficulty
      requireSubject: false
    },
    mixed: { 
      name: 'Mixed Review', 
      questions: 30, 
      time: '45 min', 
      sessionType: 'mixed_review' as const,
      description: 'Mixed questions across all topics',
      allowAllFilters: true,
      requireSubject: false
    }
  };

  const testTypes: ('SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS')[] = ['SHSAT', 'SSAT', 'ISEE', 'HSPT', 'TACHS'];
  const subjects = ['Math', 'Verbal', 'Reading'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  // Determine which filters to use based on practice mode
  const getEffectiveFilters = () => {
    const mode = practiceModesToOptions[selectedMode];
    if (!mode.allowAllFilters) {
      // Full Practice Test: use all subjects and topics, only allow difficulty selection
      return {
        testType: selectedTestType,
        subject: 'all',
        topic: 'all',
        difficulty: selectedDifficulty
      };
    }
    // Other modes: use selected filters
    return {
      testType: selectedTestType,
      subject: selectedSubject,
      topic: selectedTopic,
      difficulty: selectedDifficulty
    };
  };

  const effectiveFilters = getEffectiveFilters();
  
  // Get available question count based on effective filters
  const { count: availableQuestions, loading: countLoading } = useQuestionCount(effectiveFilters);
  
  // Get recent practice sessions
  const { sessions: recentSessions, loading: sessionsLoading } = useRecentPractice(3);

  const startCustomPractice = () => {
    const modeConfig = practiceModesToOptions[selectedMode];
    const filters = getEffectiveFilters();
    startPracticeSessionWithFilters(modeConfig.sessionType, modeConfig.questions, filters);
  };

  const startPracticeSessionWithFilters = async (
    sessionType: 'full_test' | 'subject_practice' | 'topic_practice' | 'mixed_review', 
    questionCount: number,
    filterOverrides?: any
  ) => {
    // Check authentication for database access
    if (!requireAuth()) {
      return;
    }

    const filtersToUse = filterOverrides || getEffectiveFilters();

    try {
      console.log('Starting practice session with:', { sessionType, questionCount, filters: filtersToUse });
      
      // Create server-backed session
      const { session, questions } = await createSession({
        sessionType,
        testType: filtersToUse.testType,
        subject: filtersToUse.subject !== 'all' ? filtersToUse.subject : undefined,
        topic: filtersToUse.topic !== 'all' ? filtersToUse.topic : undefined,
        difficulty: filtersToUse.difficulty !== 'all' ? filtersToUse.difficulty : undefined
      });

      if (questions.length === 0) {
        toast({
          title: "No Questions Available",
          description: "No questions found for the selected criteria. Try adjusting your filters or add more questions to the database.",
          variant: "destructive"
        });
        return;
      }

      console.log('Starting session with questions:', questions.length);
      dispatch({
        type: 'START_SESSION',
        payload: {
          serverSessionId: session.id,
          testType: filtersToUse.testType as 'SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS',
          sessionType,
          subject: (filtersToUse.subject !== 'all' ? filtersToUse.subject : 'Math') as 'Math' | 'Verbal' | 'Reading',
          topic: filtersToUse.topic !== 'all' ? filtersToUse.topic : 'General Practice',
          questions: questions
        }
      });
      navigate(`/practice/session/${session.id}`);
    } catch (error) {
      console.error('Error starting practice session:', error);
      toast({
        title: "Error",
        description: "Failed to start practice session. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Legacy function for quick start options
  const startPracticeSession = (sessionType: 'full_test' | 'subject_practice' | 'topic_practice' | 'mixed_review', questionCount: number) => {
    startPracticeSessionWithFilters(sessionType, questionCount);
  };

  const getSubjectLabel = () => {
    const mode = practiceModesToOptions[selectedMode];
    if (!mode.allowAllFilters) return '(Fixed: All Subjects)';
    if (mode.requireSubject) return '(Required)';
    return '';
  };

  const getTopicLabel = () => {
    const mode = practiceModesToOptions[selectedMode];
    if (!mode.allowAllFilters) return '(Fixed: All Topics)';
    return '';
  };

  const handleModeChange = (mode: 'quick' | 'subject' | 'full' | 'mixed') => {
    setSelectedMode(mode);
    // Reset subject selection when switching away from subject mode
    if (mode !== 'subject' && selectedSubject !== 'all') {
      setSelectedSubject('all');
    }
  };

  const isStartDisabled = () => {
    const mode = practiceModesToOptions[selectedMode];
    return loading || countLoading || (mode.requireSubject && selectedSubject === 'all');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Practice Tests</h1>
        <p className="text-muted-foreground mt-2">
          Choose your practice mode and customize your session
        </p>
        {!isAuthenticated && (
          <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-warning-foreground">
              ⚠️ Please sign in to access practice sessions. Database questions are only available to authenticated users.
            </p>
          </div>
        )}
      </div>

      {/* Quick Start Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Play className="h-5 w-5 text-primary" />
            <CardTitle>Quick Start</CardTitle>
          </div>
          <CardDescription>
            Jump right in with these popular practice options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => startPracticeSession('mixed_review', 15)}
              className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-primary/50 hover:bg-accent text-left"
            >
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-semibold">Quick Mix</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">15 mixed questions</p>
              <p className="text-xs font-medium">~15 minutes</p>
            </button>
            
            <button
              onClick={() => startPracticeSession('subject_practice', 20)}
              className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-primary/50 hover:bg-accent text-left"
            >
              <div className="flex items-center space-x-2 mb-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-semibold">Subject Focus</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">20 focused questions</p>
              <p className="text-xs font-medium">~25 minutes</p>
            </button>
            
            <button
              onClick={() => startPracticeSession('full_test', 50)}
              className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-primary/50 hover:bg-accent text-left"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-primary" />
                <span className="font-semibold">Full Test</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">50 comprehensive questions</p>
              <p className="text-xs font-medium">~2 hours</p>
            </button>
            
            <button
              onClick={() => startPracticeSession('mixed_review', 30)}
              className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-primary/50 hover:bg-accent text-left"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">Extended Mix</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">30 varied questions</p>
              <p className="text-xs font-medium">~45 minutes</p>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Practice Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Your Practice Mode</CardTitle>
          <CardDescription>
            Select how you want to practice - this will determine available options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Practice Mode Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(practiceModesToOptions).map(([key, config]) => (
              <button
                key={key}
                onClick={() => handleModeChange(key as any)}
                className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${
                  selectedMode === key
                    ? 'border-primary bg-primary/10 text-primary shadow-md'
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }`}
              >
                <div className="font-semibold text-base mb-1">{config.name}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  {config.description}
                </div>
                <div className="text-xs font-medium">
                  {config.questions} questions • {config.time}
                </div>
              </button>
            ))}
          </div>

          {/* Filter Options */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Customize Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Test Type</label>
              <Select value={selectedTestType} onValueChange={(value) => setSelectedTestType(value as 'SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {testTypes.map(test => (
                    <SelectItem key={test} value={test}>{test}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Subject {getSubjectLabel()}
              </label>
              <Select 
                value={practiceModesToOptions[selectedMode].allowAllFilters ? selectedSubject : 'all'} 
                onValueChange={setSelectedSubject}
                disabled={!practiceModesToOptions[selectedMode].allowAllFilters}
              >
                <SelectTrigger className={!practiceModesToOptions[selectedMode].allowAllFilters ? 'opacity-60' : ''}>
                  <SelectValue placeholder={practiceModesToOptions[selectedMode].requireSubject ? "Select subject" : "All subjects"} />
                </SelectTrigger>
                <SelectContent>
                  {!practiceModesToOptions[selectedMode].requireSubject && (
                    <SelectItem value="all">All subjects</SelectItem>
                  )}
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">
                Topic {getTopicLabel()}
              </label>
              {practiceModesToOptions[selectedMode].allowAllFilters ? (
                <TopicSelector
                  testType={selectedTestType}
                  subject={selectedSubject !== 'all' ? selectedSubject : undefined}
                  selectedTopic={selectedTopic}
                  onTopicChange={setSelectedTopic}
                  className={practiceModesToOptions[selectedMode].requireSubject && selectedSubject === 'all' ? 'opacity-60' : ''}
                />
              ) : (
                <Select value="all" disabled>
                  <SelectTrigger className="opacity-60">
                    <SelectValue placeholder="All topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All topics</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All difficulties</SelectItem>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            </div>
          </div>

          {/* Mode-specific information */}
          {selectedMode === 'full' && (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Full Practice Test:</strong> This mode uses questions from all subjects and topics to simulate a real test experience. Only difficulty can be customized.
              </div>
            </div>
          )}
          
          {selectedMode === 'subject' && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Subject/Topic Focus:</strong> Select a subject to focus your practice. You can optionally narrow down to specific topics within that subject.
              </div>
            </div>
          )}
          
          <div className="space-y-4">
            {/* Available Questions & Start Button */}
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Available questions: </span>
                      <span className="font-semibold text-foreground">
                        {countLoading ? 'Loading...' : `${availableQuestions} questions`}
                      </span>
                    </div>
                    {availableQuestions < practiceModesToOptions[selectedMode].questions && isAuthenticated && (
                      <Badge variant="outline" className="text-xs bg-info/10 text-info border-info/20">
                        {availableQuestions} available
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Mode: {practiceModesToOptions[selectedMode].name} • 
                    {effectiveFilters.subject !== 'all' && ` Subject: ${effectiveFilters.subject} •`}
                    {effectiveFilters.topic !== 'all' && ` Topic: ${effectiveFilters.topic} •`}
                    {effectiveFilters.difficulty !== 'all' && ` Difficulty: ${effectiveFilters.difficulty} •`}
                    {` ${practiceModesToOptions[selectedMode].questions} questions`}
                  </div>
                </div>
                <Button 
                  onClick={startCustomPractice}
                  disabled={isStartDisabled()}
                  size="lg"
                  className="min-w-[180px] bg-primary hover:bg-primary/90"
                >
                  {loading ? 'Loading...' : (
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4" />
                      <span>
                        {practiceModesToOptions[selectedMode].requireSubject && selectedSubject === 'all' 
                          ? 'Select Subject' 
                          : 'Start Practice'
                        }
                      </span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Practice Sessions */}
      {isAuthenticated && recentSessions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle>Recent Practice Sessions</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/analytics')}>
                View All
              </Button>
            </div>
            <CardDescription>
              Your most recent practice sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-1.5 bg-primary/10 rounded-md">
                      {session.status === 'completed' ? (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        {session.test_type} • {session.session_type.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistance(new Date(session.created_at), new Date(), { addSuffix: true })}
                        {session.subject && ` • ${session.subject}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {session.score !== null && (
                      <div className="text-sm font-medium">{session.score}%</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {session.total_questions} questions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Your Performance Overview</CardTitle>
          </div>
          <CardDescription>
            Track your progress across all practice sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.analytics.overallStats.averageScore}%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.analytics.overallStats.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.analytics.overallStats.studyStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Performance by Subject */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Subject</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {state.analytics.performanceBySubject.map((subject) => (
              <div key={subject.subject} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{subject.subject}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {subject.accuracy}% accuracy
                  </span>
                </div>
                <Progress value={subject.accuracy} className="w-32 h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Practice;
