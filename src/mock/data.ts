import { User, AnalyticsData, Question } from '@/types/app';

export const mockUser: User = {
  id: '1',
  firstName: 'Alex',
  lastName: 'Johnson',
  email: 'alex.johnson@email.com',
  subscriptionTier: 'single_test',
  selectedTest: 'SHSAT',
  studyStreak: 12,
  totalStudyTime: 420,
  createdAt: new Date('2024-01-01')
};

export const mockAnalytics: AnalyticsData = {
  overallStats: {
    totalQuestions: 1247,
    averageScore: 78,
    studyStreak: 12,
    timeSpentThisWeek: 420
  },
  performanceBySubject: [
    {
      subject: 'Math',
      accuracy: 82,
      questionsAttempted: 456,
      averageTime: 90,
      color: '#1E40AF',
      topics: [
        { topic: 'Algebra', accuracy: 85, questionsAttempted: 120, mastery: 'Proficient', averageTime: 85 },
        { topic: 'Geometry', accuracy: 78, questionsAttempted: 89, mastery: 'Intermediate', averageTime: 95 },
        { topic: 'Arithmetic', accuracy: 88, questionsAttempted: 156, mastery: 'Advanced', averageTime: 80 },
        { topic: 'Word Problems', accuracy: 75, questionsAttempted: 91, mastery: 'Beginner', averageTime: 105 }
      ]
    },
    {
      subject: 'Verbal',
      accuracy: 76,
      questionsAttempted: 423,
      averageTime: 65,
      color: '#059669',
      topics: [
        { topic: 'Vocabulary', accuracy: 82, questionsAttempted: 156, mastery: 'Proficient', averageTime: 60 },
        { topic: 'Synonyms', accuracy: 74, questionsAttempted: 134, mastery: 'Intermediate', averageTime: 58 },
        { topic: 'Analogies', accuracy: 71, questionsAttempted: 89, mastery: 'Intermediate', averageTime: 75 },
        { topic: 'Logic', accuracy: 78, questionsAttempted: 44, mastery: 'Proficient', averageTime: 72 }
      ]
    },
    {
      subject: 'Reading',
      accuracy: 81,
      questionsAttempted: 368,
      averageTime: 120,
      color: '#D97706',
      topics: [
        { topic: 'Comprehension', accuracy: 85, questionsAttempted: 145, mastery: 'Proficient', averageTime: 115 },
        { topic: 'Inference', accuracy: 79, questionsAttempted: 112, mastery: 'Intermediate', averageTime: 125 },
        { topic: 'Main Ideas', accuracy: 83, questionsAttempted: 78, mastery: 'Proficient', averageTime: 108 },
        { topic: 'Analysis', accuracy: 76, questionsAttempted: 33, mastery: 'Intermediate', averageTime: 135 }
      ]
    }
  ],
  scoreHistory: [
    { date: 'Jan 15', score: 72, testType: 'SHSAT', sessionType: 'full_test' },
    { date: 'Jan 18', score: 76, testType: 'SHSAT', sessionType: 'subject_practice' },
    { date: 'Jan 22', score: 79, testType: 'SHSAT', sessionType: 'full_test' },
    { date: 'Jan 25', score: 81, testType: 'SHSAT', sessionType: 'topic_practice' },
    { date: 'Jan 28', score: 84, testType: 'SHSAT', sessionType: 'full_test' },
    { date: 'Feb 1', score: 82, testType: 'SHSAT', sessionType: 'mixed_review' },
    { date: 'Feb 4', score: 86, testType: 'SHSAT', sessionType: 'full_test' }
  ]
};

export const mockQuestions: Record<string, Question[]> = {
  algebra: [
    {
      id: 'alg_1',
      testType: 'SHSAT',
      subject: 'Math',
      topic: 'Algebra',
      difficulty: 'Easy',
      questionText: 'Solve for x: 3x + 7 = 22',
      options: {
        A: 'x = 3',
        B: 'x = 5',
        C: 'x = 7',
        D: 'x = 9'
      },
      correctAnswer: 'B',
      explanation: 'Subtract 7 from both sides: 3x = 15. Then divide by 3: x = 5.',
      timeAllocated: 90
    },
    {
      id: 'alg_2',
      testType: 'SHSAT',
      subject: 'Math',
      topic: 'Algebra',
      difficulty: 'Medium',
      questionText: 'If 2x - 3y = 12 and x + y = 7, what is the value of x?',
      options: {
        A: '3',
        B: '4',
        C: '5',
        D: '6'
      },
      correctAnswer: 'D',
      explanation: 'From x + y = 7, we get y = 7 - x. Substituting into 2x - 3y = 12: 2x - 3(7 - x) = 12, which gives 2x - 21 + 3x = 12, so 5x = 33, and x = 6.6. The closest answer is 6.',
      timeAllocated: 120
    }
  ],
  geometry: [
    {
      id: 'geo_1',
      testType: 'SHSAT',
      subject: 'Math',
      topic: 'Geometry',
      difficulty: 'Easy',
      questionText: 'What is the area of a rectangle with length 8 units and width 5 units?',
      options: {
        A: '13 square units',
        B: '26 square units',
        C: '40 square units',
        D: '80 square units'
      },
      correctAnswer: 'C',
      explanation: 'The area of a rectangle is length × width = 8 × 5 = 40 square units.',
      timeAllocated: 75
    }
  ],
  vocabulary: [
    {
      id: 'vocab_1',
      testType: 'SHSAT',
      subject: 'Verbal',
      topic: 'Vocabulary',
      difficulty: 'Easy',
      questionText: 'Choose the word that best completes the sentence: The scientist\'s theory was so _______ that even experts had difficulty understanding it.',
      options: {
        A: 'simple',
        B: 'complex',
        C: 'popular',
        D: 'obvious'
      },
      correctAnswer: 'B',
      explanation: 'The sentence indicates that even experts had trouble understanding the theory, which suggests it was "complex".',
      timeAllocated: 60
    },
    {
      id: 'vocab_2',
      testType: 'SHSAT',
      subject: 'Verbal',
      topic: 'Vocabulary',
      difficulty: 'Medium',
      questionText: 'TENACIOUS most nearly means:',
      options: {
        A: 'Flexible',
        B: 'Persistent',
        C: 'Careless',
        D: 'Temporary'
      },
      correctAnswer: 'B',
      explanation: 'Tenacious means holding firmly to something or persistent in maintaining a position.',
      timeAllocated: 65
    }
  ],
  comprehension: [
    {
      id: 'comp_1',
      testType: 'SHSAT',
      subject: 'Reading',
      topic: 'Comprehension',
      difficulty: 'Medium',
      questionText: 'Based on the passage, what can be inferred about the author\'s attitude toward renewable energy?',
      options: {
        A: 'Strongly opposed',
        B: 'Cautiously optimistic',
        C: 'Completely neutral',
        D: 'Enthusiastically supportive'
      },
      correctAnswer: 'B',
      explanation: 'The author presents both benefits and challenges of renewable energy, suggesting a balanced but hopeful perspective.',
      timeAllocated: 150
    }
  ]
};

// Generate more questions for practice sessions
export const generateMockQuestions = (count: number, filters: {
  subject?: string;
  topic?: string;
  difficulty?: string;
}): Question[] => {
  const allQuestions = Object.values(mockQuestions).flat();
  
  let filteredQuestions = allQuestions;
  
  if (filters.subject) {
    filteredQuestions = filteredQuestions.filter(q => q.subject === filters.subject);
  }
  
  if (filters.topic) {
    filteredQuestions = filteredQuestions.filter(q => q.topic === filters.topic);
  }
  
  if (filters.difficulty) {
    filteredQuestions = filteredQuestions.filter(q => q.difficulty === filters.difficulty);
  }
  
  // Repeat questions if we need more than available
  const result: Question[] = [];
  for (let i = 0; i < count; i++) {
    result.push(filteredQuestions[i % filteredQuestions.length]);
  }
  
  return result;
};

export const fullTestQuestions = generateMockQuestions(89, {}); // Full SHSAT test