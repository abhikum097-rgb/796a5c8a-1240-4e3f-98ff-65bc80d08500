export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  subscriptionTier: 'free' | 'single_test' | 'all_access';
  selectedTest?: 'SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS';
  studyStreak: number;
  totalStudyTime: number; // minutes
  createdAt: Date;
}

export interface Question {
  id: string;
  testType: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionText: string;
  questionImages?: string[];
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  timeAllocated: number; // seconds
}

export interface UserAnswer {
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  timeSpent: number;
  isFlagged: boolean;
  confidence?: 'Low' | 'Medium' | 'High';
}

export interface PracticeSession {
  id: string;
  testType: 'SHSAT' | 'SSAT' | 'ISEE' | 'HSPT' | 'TACHS';
  sessionType: 'full_test' | 'subject_practice' | 'topic_practice' | 'mixed_review';
  subject?: 'Math' | 'Verbal' | 'Reading';
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  questions: Question[];
  userAnswers: Record<string, UserAnswer>;
  currentQuestion: number;
  startTime: Date;
  endTime?: Date;
  sessionTime: number; // seconds
  isPaused: boolean;
  isCompleted: boolean;
  score?: number;
}

export interface TopicPerformance {
  topic: string;
  accuracy: number;
  questionsAttempted: number;
  mastery: 'Beginner' | 'Intermediate' | 'Proficient' | 'Advanced';
  averageTime: number;
}

export interface SubjectPerformance {
  subject: string;
  accuracy: number;
  questionsAttempted: number;
  averageTime: number;
  color: string;
  topics: TopicPerformance[];
}

export interface ScoreHistory {
  date: string;
  score: number;
  testType: string;
  sessionType: string;
}

export interface AnalyticsData {
  overallStats: {
    totalQuestions: number;
    averageScore: number;
    studyStreak: number;
    timeSpentThisWeek: number;
  };
  performanceBySubject: SubjectPerformance[];
  scoreHistory: ScoreHistory[];
}

export interface AppState {
  currentPage: string;
  user: User | null;
  practiceSession: PracticeSession | null;
  analytics: AnalyticsData;
  selectedFilters: {
    practiceTab: string;
    subject: string;
    topic: string;
    difficulty: string;
    timePeriod: string;
  };
}

export type AppAction = 
  | { type: 'SET_PRACTICE_TAB'; payload: string }
  | { type: 'SET_SUBJECT_FILTER'; payload: string }
  | { type: 'SET_TOPIC_FILTER'; payload: string }
  | { type: 'SET_DIFFICULTY_FILTER'; payload: string }
  | { type: 'SET_TIME_PERIOD'; payload: string }
  | { type: 'START_SESSION'; payload: Omit<PracticeSession, 'id' | 'userAnswers' | 'currentQuestion' | 'startTime' | 'sessionTime' | 'isPaused' | 'isCompleted'> }
  | { type: 'ANSWER_QUESTION'; payload: { questionId: string; answer: UserAnswer } }
  | { type: 'GO_TO_QUESTION'; payload: number }
  | { type: 'TOGGLE_FLAG'; payload: string }
  | { type: 'PAUSE_SESSION' }
  | { type: 'RESUME_SESSION' }
  | { type: 'TICK_TIMER' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'SET_CURRENT_PAGE'; payload: string }
  | { type: 'UPDATE_ANALYTICS'; payload: AnalyticsData }
  | { type: 'UPDATE_USER'; payload: User | null };