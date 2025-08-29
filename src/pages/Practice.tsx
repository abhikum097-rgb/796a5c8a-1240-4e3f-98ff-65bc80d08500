
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, PlayCircle, FileText, Users, Target, TrendingUp } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { useSupabaseQuestions } from "@/hooks/useSupabaseQuestions";
import { generateMockQuestions } from "@/mock/data";

const Practice = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const { fetchQuestions, loading } = useSupabaseQuestions();
  const [selectedTestType, setSelectedTestType] = useState(state.user.selectedTest || 'SHSAT');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  const testTypes = ['SHSAT', 'SSAT', 'ISEE', 'HSPT', 'TACHS'];
  const subjects = ['Math', 'Verbal', 'Reading', 'Writing'];
  const difficulties = ['Easy', 'Medium', 'Hard'];

  const startPracticeSession = async (sessionType: string, questionCount: number) => {
    try {
      const filters: any = {
        testType: selectedTestType,
        count: questionCount
      };

      if (selectedSubject) filters.subject = selectedSubject;
      if (selectedDifficulty) filters.difficulty = selectedDifficulty;

      const questions = await fetchQuestions(filters);
      
      let finalQuestions = questions;
      
      // Handle limited question data
      if (!questions || questions.length === 0) {
        console.warn('No questions found from backend, using mock data');
        finalQuestions = generateMockQuestions(questionCount, { 
          subject: selectedSubject,
          difficulty: selectedDifficulty 
        });
      } else if (questions.length < questionCount) {
        console.warn(`Only ${questions.length} questions found, supplementing with mock data`);
        const mockQuestions = generateMockQuestions(
          questionCount - questions.length,
          { subject: selectedSubject, difficulty: selectedDifficulty }
        );
        finalQuestions = [...questions, ...mockQuestions];
      }

      dispatch({
        type: 'START_SESSION',
        payload: {
          testType: selectedTestType,
          sessionType,
          subject: selectedSubject as 'Math' | 'Verbal' | 'Reading' | 'Writing' || 'Math',
          topic: 'General Practice',
          questions: finalQuestions
        }
      });
      
      navigate(`/dashboard/practice/session/${Date.now()}`);
    } catch (error) {
      console.error('Error starting practice session:', error);
      // Fallback to mock questions
      const mockQuestions = generateMockQuestions(questionCount, { 
        subject: selectedSubject, 
        difficulty: selectedDifficulty 
      });
      dispatch({
        type: 'START_SESSION',
        payload: {
          testType: selectedTestType,
          sessionType,
          subject: selectedSubject as 'Math' | 'Verbal' | 'Reading' | 'Writing' || 'Math',
          topic: 'General Practice',
          questions: mockQuestions
        }
      });
      navigate(`/dashboard/practice/session/${Date.now()}`);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Practice Center</h1>
        <p className="text-muted-foreground mt-2">
          Choose your practice mode and start improving your test performance
        </p>
      </div>

      {/* Practice Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Practice Settings</CardTitle>
          <CardDescription>
            Customize your practice session
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Test Type</label>
              <Select value={selectedTestType} onValueChange={setSelectedTestType}>
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
              <label className="text-sm font-medium mb-2 block">Subject (Optional)</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="All subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Difficulty (Optional)</label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="All levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All levels</SelectItem>
                  {difficulties.map(difficulty => (
                    <SelectItem key={difficulty} value={difficulty}>{difficulty}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Practice Modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <PlayCircle className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Quick Practice</CardTitle>
                <CardDescription>15 questions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Perfect for short study sessions. Get familiar with question types and formats.
            </p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              ~15 minutes
            </div>
            <Button 
              className="w-full" 
              onClick={() => startPracticeSession('quick_practice', 15)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Start Quick Practice'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Topic Practice</CardTitle>
                <CardDescription>20 questions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Focus on specific topics to strengthen weak areas and build confidence.
            </p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              ~20 minutes
            </div>
            <Button 
              className="w-full" 
              onClick={() => startPracticeSession('topic_practice', 20)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Start Topic Practice'}
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <CardTitle>Full Test</CardTitle>
                <CardDescription>89 questions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Complete practice test under timed conditions. Simulate the real exam experience.
            </p>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-2" />
              ~3 hours
            </div>
            <Button 
              className="w-full" 
              onClick={() => startPracticeSession('full_test', 89)}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Start Full Test'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Recent Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.analytics.overallStats.accuracy}%</div>
              <div className="text-sm text-muted-foreground">Overall Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.analytics.overallStats.questionsAnswered}</div>
              <div className="text-sm text-muted-foreground">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.analytics.overallStats.studyStreak}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Practice;
