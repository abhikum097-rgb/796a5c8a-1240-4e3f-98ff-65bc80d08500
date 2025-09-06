
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Upload, FileText, Images, List, Download, AlertCircle, Info, Play, Database } from 'lucide-react';
import { AdminInventoryWidget } from '@/components/AdminInventoryWidget';
import { useNavigate } from 'react-router-dom';

const QUESTION_PROCESSING_PROMPT = `
You are an expert test prep question parser. Convert the provided question text into a structured JSON format.

REQUIRED JSON STRUCTURE:
{
  "test_type": "SHSAT|SSAT|ISEE|HSPT|TACHS",
  "subject": "Math|Verbal|Reading|Writing", 
  "topic": "string (e.g., Algebra, Vocabulary, Reading Comprehension)",
  "sub_topic": "string (optional, more specific topic)",
  "difficulty_level": "Easy|Medium|Hard",
  "question_text": "string (the main question)",
  "passage": "string (optional, for reading comprehension - include ONLY if there is a reading passage)",
  "option_a": "string",
  "option_b": "string", 
  "option_c": "string",
  "option_d": "string",
  "correct_answer": "A|B|C|D",
  "explanation": "string (detailed explanation of why the answer is correct)",
  "time_allocated": number (suggested seconds, usually 60-120)
}

INSTRUCTIONS:
1. Extract the question text and all multiple choice options
2. Identify the correct answer 
3. Determine appropriate test type, subject, and topic based on question content
4. Assign difficulty based on question complexity
5. Write a clear explanation for the correct answer
6. Suggest appropriate time allocation
7. If there's a reading passage, include it in the "passage" field

If any information is unclear or missing, make reasonable assumptions based on the question content.

RESPOND WITH ONLY THE JSON OBJECT, NO OTHER TEXT.

Question to process:
`;

interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
}

const QuestionsAdmin = () => {
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const inventoryWidgetRef = useRef<{ refreshStats: () => void }>(null);

  const [metadata, setMetadata] = useState({
    test_type: '',
    subject: '',
    topic: '',
    difficulty_level: ''
  });

  const [textInput, setTextInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkInputStats, setBulkInputStats] = useState({ words: 0, questions: 0, avgWordsPerQuestion: 0, withinLimits: true });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [bulkResults, setBulkResults] = useState<any>(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [verifyingQuestions, setVerifyingQuestions] = useState(false);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You don't have admin permissions to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result?.toString().split(',')[1];
        resolve(base64 || '');
      };
      reader.onerror = reject;
    });
  };

  const saveQuestionToDatabase = async (questionData: any): Promise<ProcessingResult> => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([{
          test_type: questionData.test_type,
          subject: questionData.subject,
          topic: questionData.topic,
          sub_topic: questionData.sub_topic,
          difficulty_level: questionData.difficulty_level,
          question_text: questionData.question_text,
          passage: questionData.passage || null,
          option_a: questionData.option_a,
          option_b: questionData.option_b,
          option_c: questionData.option_c,
          option_d: questionData.option_d,
          correct_answer: questionData.correct_answer,
          explanation: questionData.explanation,
          time_allocated: questionData.time_allocated || 90,
          is_active: true
        }])
        .select();

      if (error) throw error;
      return { success: true, data: data[0] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const safeJsonParse = (jsonStr: string): any => {
    try {
      // First try standard JSON parse
      return JSON.parse(jsonStr);
    } catch (error) {
      // Try to extract JSON from markdown code blocks
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        try {
          return JSON.parse(codeBlockMatch[1]);
        } catch (e) {
          // Continue to next fallback
        }
      }
      
      // Try to find JSON object in the response
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Continue to next fallback
        }
      }
      
      throw new Error(`Invalid JSON response: ${error instanceof Error ? error.message : 'Unknown JSON error'}`);
    }
  };

  const processTextQuestion = async (questionText: string): Promise<ProcessingResult> => {
    try {
      const response = await supabase.functions.invoke('process-question', {
        body: {
          prompt: QUESTION_PROCESSING_PROMPT + questionText,
          metadata
        }
      });

      if (response.error) throw new Error(response.error.message);

      const questionData = safeJsonParse(response.data.content);
      
      // Validate required fields
      const requiredFields = ['test_type', 'subject', 'topic', 'difficulty_level', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
      const missingFields = requiredFields.filter(field => !questionData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Merge with user metadata if provided
      const finalQuestion = {
        ...questionData,
        ...(metadata.test_type && { test_type: metadata.test_type }),
        ...(metadata.subject && { subject: metadata.subject }),
        ...(metadata.topic && { topic: metadata.topic }),
        ...(metadata.difficulty_level && { difficulty_level: metadata.difficulty_level })
      };

      return await saveQuestionToDatabase(finalQuestion);
    } catch (error: any) {
      console.error('Question processing failed:', error);
      return { success: false, error: error.message };
    }
  };

  const processImageQuestion = async (file: File): Promise<ProcessingResult> => {
    try {
      const base64Image = await fileToBase64(file);
      
      const response = await supabase.functions.invoke('process-image-question', {
        body: {
          image: base64Image,
          prompt: `Extract and process this test question image. ${QUESTION_PROCESSING_PROMPT}`,
          metadata
        }
      });

      if (response.error) throw new Error(response.error.message);

      const questionData = safeJsonParse(response.data.content);
      
      // Validate required fields
      const requiredFields = ['test_type', 'subject', 'topic', 'difficulty_level', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
      const missingFields = requiredFields.filter(field => !questionData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Merge with user metadata if provided
      const finalQuestion = {
        ...questionData,
        ...(metadata.test_type && { test_type: metadata.test_type }),
        ...(metadata.subject && { subject: metadata.subject }),
        ...(metadata.topic && { topic: metadata.topic }),
        ...(metadata.difficulty_level && { difficulty_level: metadata.difficulty_level })
      };

      return await saveQuestionToDatabase(finalQuestion);
    } catch (error: any) {
      console.error('Image processing failed:', error);
      return { success: false, error: error.message };
    }
  };

  const processBulkQuestions = async (bulkText: string): Promise<ProcessingResult[]> => {
    // Smart question separation - handles various formats
    const questions = bulkText
      .split(/\n\s*\n/)
      .filter(q => q.trim())
      .map(q => q.trim());
    
    const results: ProcessingResult[] = [];
    
    console.log(`Processing ${questions.length} questions from bulk text`);
    
    // Process in smaller batches if input is large
    const batchSize = questions.length > LIMITS.RECOMMENDED_QUESTIONS ? 3 : questions.length;
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      
      for (let j = 0; j < batch.length; j++) {
        const questionText = batch[j];
        const questionNumber = i + j + 1;
        
        console.log(`Processing question ${questionNumber}/${questions.length}`);
        
        try {
          // Pre-validate question format
          if (questionText.length < 20) {
            throw new Error('Question too short - needs question text and options');
          }
          
          if (!questionText.match(/[A-D]\)/)) {
            console.warn(`Question ${questionNumber} may be missing options A), B), C), D)`);
          }
          
          const result = await processTextQuestion(questionText);
          results.push({
            ...result,
            data: { 
              ...result.data, 
              questionNumber, 
              questionPreview: questionText.substring(0, 100) + (questionText.length > 100 ? '...' : ''),
              wordCount: questionText.split(/\s+/).length
            }
          });
          
          // Small delay between questions to avoid rate limiting
          if (j < batch.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (error: any) {
          console.error(`Error processing question ${questionNumber}:`, error);
          results.push({
            success: false,
            error: `Question ${questionNumber}: ${error.message}`,
            data: { 
              questionNumber, 
              questionPreview: questionText.substring(0, 100) + (questionText.length > 100 ? '...' : ''),
              wordCount: questionText.split(/\s+/).length
            }
          });
        }
      }
    }
    
    return results;
  };

  const parseCsvRow = (row: string): string[] => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      const nextChar = row[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  };

  const parseCsvFile = (content: string): { questions: any[], errors: string[] } => {
    try {
      const lines = content.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return { questions: [], errors: ['CSV file must have at least a header row and one data row'] };
      }

      const headers = parseCsvRow(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
      const questions: any[] = [];
      const errors: string[] = [];
      
      const requiredFields = ['test_type', 'subject', 'topic', 'difficulty_level', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
      const missingHeaders = requiredFields.filter(field => !headers.includes(field));
      
      if (missingHeaders.length > 0) {
        errors.push(`Missing required columns: ${missingHeaders.join(', ')}`);
        return { questions: [], errors };
      }

      lines.slice(1).forEach((line, index) => {
        try {
          const values = parseCsvRow(line);
          const question: any = {};
          
          headers.forEach((header, headerIndex) => {
            const value = values[headerIndex] || '';
            question[header] = value.replace(/^"|"$/g, '').trim();
          });
          
          // Validate required fields for this row
          const missingFields = requiredFields.filter(field => !question[field] || question[field].trim() === '');
          if (missingFields.length > 0) {
            errors.push(`Row ${index + 2}: Missing ${missingFields.join(', ')}`);
          } else {
            questions.push(question);
          }
        } catch (rowError) {
          errors.push(`Row ${index + 2}: Failed to parse - ${rowError}`);
        }
      });

      return { questions, errors: errors.slice(0, 10) }; // Limit to first 10 errors
    } catch (error) {
      console.error('CSV parsing error:', error);
      return { questions: [], errors: [`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`] };
    }
  };

  const processBulkFile = async (file: File): Promise<void> => {
    try {
      const content = await file.text();
      let questions: any[] = [];
      let validationErrors: string[] = [];

      if (file.name.toLowerCase().endsWith('.csv')) {
        const result = parseCsvFile(content);
        questions = result.questions;
        validationErrors = result.errors;
        
        if (validationErrors.length > 0) {
          const errorMessage = `CSV validation errors:\n${validationErrors.join('\n')}`;
          throw new Error(errorMessage);
        }
      } else if (file.name.toLowerCase().endsWith('.json')) {
        try {
          const parsed = JSON.parse(content);
          const rawQuestions = Array.isArray(parsed) ? parsed : [parsed];
          
          // Validate JSON structure
          const requiredFields = ['test_type', 'subject', 'topic', 'difficulty_level', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation'];
          
          rawQuestions.forEach((question, index) => {
            const missingFields = requiredFields.filter(field => !question[field]);
            if (missingFields.length > 0) {
              validationErrors.push(`Question ${index + 1}: Missing ${missingFields.join(', ')}`);
            } else {
              questions.push(question);
            }
          });
          
          if (validationErrors.length > 0 && validationErrors.length < 10) {
            // Show first 10 validation errors
            const errorMessage = `JSON validation errors:\n${validationErrors.slice(0, 10).join('\n')}`;
            throw new Error(errorMessage);
          }
        } catch (jsonError) {
          throw new Error('Invalid JSON format. Please check your file structure.');
        }
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.');
      }

      if (questions.length === 0) {
        throw new Error('No valid questions found in file after validation');
      }

      console.log(`Processing ${questions.length} valid questions from file`);

      const response = await supabase.functions.invoke('bulk-import-questions', {
        body: {
          questions,
          overwrite_duplicates: overwriteDuplicates
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setBulkResults(response.data.results);
      
      toast({
        title: "Bulk Import Completed",
        description: `${response.data.message}${validationErrors.length > 0 ? ` (${validationErrors.length} validation warnings)` : ''}`,
      });

      // Refresh inventory after successful bulk import
      setTimeout(refreshInventory, 1000);

    } catch (error: any) {
      console.error('Bulk file processing failed:', error);
      toast({
        title: "Bulk Import Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setResults([]);

    try {
      let processingResults: ProcessingResult[] = [];

      if (csvFile || jsonFile) {
        await processBulkFile(csvFile || jsonFile!);
        return; // Bulk file processing has its own result handling
      } else if (textInput.trim()) {
        const result = await processTextQuestion(textInput);
        processingResults = [result];
      } else if (imageFile) {
        const result = await processImageQuestion(imageFile);
        processingResults = [result];
      } else if (bulkInput.trim()) {
        processingResults = await processBulkQuestions(bulkInput);
      }

      setResults(processingResults);
      
      const successCount = processingResults.filter(r => r.success).length;
      const totalCount = processingResults.length;
      
      if (successCount === totalCount) {
        toast({
          title: "Success!",
          description: `${successCount} question(s) processed and saved successfully.`,
        });
        // Refresh inventory after successful processing
        setTimeout(refreshInventory, 1000);
      } else {
        toast({
          title: "Partial Success",
          description: `${successCount}/${totalCount} questions processed successfully.`,
          variant: "destructive",
        });
        // Still refresh inventory for partial success
        if (successCount > 0) {
          setTimeout(refreshInventory, 1000);
        }
      }
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearForm = () => {
    setTextInput('');
    setBulkInput('');
    setImageFile(null);
    setCsvFile(null);
    setJsonFile(null);
    setResults([]);
    setBulkResults(null);
  };

  const refreshInventory = () => {
    inventoryWidgetRef.current?.refreshStats();
  };

  const verifyQuestionsInDatabase = async (questions: any[]) => {
    setVerifyingQuestions(true);
    try {
      const questionIds = questions.map(q => q.id).filter(Boolean);
      if (questionIds.length === 0) return [];

      const { data, error } = await supabase
        .from('questions')
        .select('id, question_text, test_type, subject, topic')
        .in('id', questionIds)
        .eq('is_active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error verifying questions:', error);
      return [];
    } finally {
      setVerifyingQuestions(false);
    }
  };

  const createPracticeSession = async (questions: any[]) => {
    setIsCreatingSession(true);
    try {
      // Verify questions exist in database first
      const verifiedQuestions = await verifyQuestionsInDatabase(questions);
      
      if (verifiedQuestions.length === 0) {
        toast({
          title: "No Questions Found",
          description: "Cannot find these questions in the database. Try refreshing the page.",
          variant: "destructive",
        });
        return;
      }

      // Use the first question's metadata for session type
      const firstQuestion = questions[0];
      const sessionData = {
        sessionType: 'topic_practice' as const,
        testType: firstQuestion.test_type || 'SHSAT',
        subject: firstQuestion.subject,
        topic: firstQuestion.topic,
        difficulty: firstQuestion.difficulty_level,
        questionsData: verifiedQuestions // Pass the verified questions directly
      };

      const { data, error } = await supabase.functions.invoke('create-session', {
        body: sessionData
      });

      if (error) throw error;

      toast({
        title: "Practice Session Created!",
        description: `Starting practice with ${verifiedQuestions.length} questions.`,
      });

      // Navigate to the practice interface
      navigate(`/practice/session/${data.session.id}`);
    } catch (error: any) {
      console.error('Error creating practice session:', error);
      toast({
        title: "Session Creation Failed",
        description: error.message || "Failed to create practice session.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const getSuccessfulQuestions = () => {
    const successful = results.filter(r => r.success && r.data);
    return successful.map(r => r.data);
  };

  const canPracticeQuestions = () => {
    const successfulQuestions = getSuccessfulQuestions();
    const bulkSuccessful = bulkResults?.successful || 0;
    
    return successfulQuestions.length > 0 || bulkSuccessful > 0;
  };

  const handlePracticeNow = async () => {
    const successfulQuestions = getSuccessfulQuestions();
    
    if (successfulQuestions.length > 0) {
      // For individual/bulk text questions
      await createPracticeSession(successfulQuestions);
    } else if (bulkResults?.successful > 0) {
      // For bulk file imports - fetch recently added questions
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(Math.min(bulkResults.successful, 30));

        if (error) throw error;
        
        if (data && data.length > 0) {
          await createPracticeSession(data);
        }
      } catch (error) {
        console.error('Error fetching recent questions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch questions for practice session.",
          variant: "destructive",
        });
      }
    }
  };

  const downloadSampleCsv = () => {
    const sampleData = `test_type,subject,topic,sub_topic,difficulty_level,question_text,passage,option_a,option_b,option_c,option_d,correct_answer,explanation,time_allocated
SHSAT,Math,Algebra,Linear Equations,Medium,"Solve for x: 2x + 5 = 13",,"x = 4","x = 8","x = 9","x = 3",A,"To solve 2x + 5 = 13: Subtract 5 from both sides: 2x = 8. Divide by 2: x = 4.",90
SSAT,Reading,Reading Comprehension,Literary Analysis,Medium,"What is the main theme of the passage?","The sun was setting over the horizon, casting long shadows across the meadow. Sarah had always found peace in these quiet moments, when the world seemed to pause and reflect. As she watched the golden light fade, she realized that sometimes the most beautiful things in life are also the most fleeting.","The importance of time","The beauty of nature","Finding peace in solitude","The cycle of day and night",C,"The passage focuses on Sarah finding peace and reflection during a quiet moment, emphasizing solitude and inner tranquility.",120`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Optimal limits for reliable AI processing
  const LIMITS = {
    MAX_QUESTIONS: 8,
    MAX_WORDS_PER_QUESTION: 300,
    MAX_TOTAL_WORDS: 2000,
    RECOMMENDED_QUESTIONS: 5
  };

  const analyzeTextInput = (text: string) => {
    if (!text.trim()) {
      return { words: 0, questions: 0, avgWordsPerQuestion: 0, withinLimits: true };
    }
    
    const questions = text.split(/\n\s*\n/).filter(q => q.trim());
    const words = text.split(/\s+/).length;
    const avgWordsPerQuestion = questions.length > 0 ? Math.round(words / questions.length) : 0;
    
    const withinLimits = (
      questions.length <= LIMITS.MAX_QUESTIONS &&
      words <= LIMITS.MAX_TOTAL_WORDS &&
      avgWordsPerQuestion <= LIMITS.MAX_WORDS_PER_QUESTION
    );
    
    return { 
      words, 
      questions: questions.length, 
      avgWordsPerQuestion,
      withinLimits 
    };
  };

  const handleBulkInputChange = (text: string) => {
    setBulkInput(text);
    setBulkInputStats(analyzeTextInput(text));
  };

  const hasMetadata = metadata.test_type || metadata.subject || metadata.topic || metadata.difficulty_level;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Questions Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          AI-Powered Question Creation
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

        {/* Metadata Section */}
        <Card>
          <CardHeader>
            <CardTitle>Question Metadata</CardTitle>
            <CardDescription className="flex items-center gap-2">
              Set default values for all questions (can be overridden by AI)
              {!hasMetadata && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Info className="h-4 w-4" />
                  <span className="text-xs">AI will infer metadata if left blank</span>
                </div>
              )}
            </CardDescription>
          </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="test-type">Test Type</Label>
            <Select value={metadata.test_type} onValueChange={(value) => setMetadata(prev => ({...prev, test_type: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select test" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SHSAT">SHSAT</SelectItem>
                <SelectItem value="SSAT">SSAT</SelectItem>
                <SelectItem value="ISEE">ISEE</SelectItem>
                <SelectItem value="HSPT">HSPT</SelectItem>
                <SelectItem value="TACHS">TACHS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Select value={metadata.subject} onValueChange={(value) => setMetadata(prev => ({...prev, subject: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Math">Math</SelectItem>
                <SelectItem value="Verbal">Verbal</SelectItem>
                <SelectItem value="Reading">Reading</SelectItem>
                <SelectItem value="Writing">Writing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input 
              id="topic"
              placeholder="e.g., Algebra, Vocabulary"
              value={metadata.topic}
              onChange={(e) => setMetadata(prev => ({...prev, topic: e.target.value}))}
            />
          </div>

          <div>
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={metadata.difficulty_level} onValueChange={(value) => setMetadata(prev => ({...prev, difficulty_level: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
          </CardContent>
        </Card>

        {/* Input Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Question Input</CardTitle>
            <CardDescription>
              Choose how you want to input questions for AI processing
            </CardDescription>
          </CardHeader>
        <CardContent>
          <Tabs defaultValue="text" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Text Input
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2">
                <Images className="h-4 w-4" />
                Image Upload
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Bulk Text
              </TabsTrigger>
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                File Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <Label htmlFor="text-input">Question Text</Label>
              <Textarea
                id="text-input"
                rows={10}
                placeholder="Paste your question here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="resize-none"
              />
              
              <div className="border-t pt-4">
                <Label htmlFor="passage-input" className="text-sm font-medium text-muted-foreground">
                  Reading Passage (Optional)
                </Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Only include a passage for reading comprehension questions. Leave blank for other question types.
                </p>
                <Textarea
                  id="passage-input"
                  rows={5}
                  placeholder="Enter the reading passage here if this is a reading comprehension question..."
                  value={textInput.includes("READING PASSAGE:") ? textInput.split("READING PASSAGE:")[1]?.split("QUESTION:")[0]?.trim() || "" : ""}
                  onChange={(e) => {
                    const passageText = e.target.value;
                    const currentQuestion = textInput.includes("QUESTION:") ? textInput.split("QUESTION:")[1] || textInput : textInput;
                    if (passageText.trim()) {
                      setTextInput(`READING PASSAGE:\n${passageText}\n\nQUESTION:\n${currentQuestion}`);
                    } else {
                      setTextInput(currentQuestion);
                    }
                  }}
                  className="resize-none text-sm"
                />
              </div>
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <Label htmlFor="image-input">Upload Question Image</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <input
                  id="image-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label
                  htmlFor="image-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {imageFile ? imageFile.name : 'Click to upload image'}
                  </p>
                </label>
              </div>
            </TabsContent>

            <TabsContent value="bulk" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="bulk-input">Bulk Questions (Text)</Label>
                <div className="flex items-center gap-3 text-xs">
                  <div className={`flex items-center gap-1 ${bulkInputStats.withinLimits ? 'text-green-600' : 'text-red-600'}`}>
                    <span>{bulkInputStats.questions}/{LIMITS.MAX_QUESTIONS} questions</span>
                  </div>
                  <div className={`flex items-center gap-1 ${bulkInputStats.words <= LIMITS.MAX_TOTAL_WORDS ? 'text-green-600' : 'text-red-600'}`}>
                    <span>{bulkInputStats.words}/{LIMITS.MAX_TOTAL_WORDS} words</span>
                  </div>
                </div>
              </div>
              
              {!bulkInputStats.withinLimits && (
                <div className="bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                        Input exceeds recommended limits
                      </p>
                      <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                        {bulkInputStats.questions > LIMITS.MAX_QUESTIONS && (
                          <li>• Too many questions ({bulkInputStats.questions}/{LIMITS.MAX_QUESTIONS}). Consider splitting into smaller batches.</li>
                        )}
                        {bulkInputStats.words > LIMITS.MAX_TOTAL_WORDS && (
                          <li>• Too much text ({bulkInputStats.words}/{LIMITS.MAX_TOTAL_WORDS} words). Reduce explanations or split content.</li>
                        )}
                        {bulkInputStats.avgWordsPerQuestion > LIMITS.MAX_WORDS_PER_QUESTION && (
                          <li>• Questions too detailed (avg {bulkInputStats.avgWordsPerQuestion}/{LIMITS.MAX_WORDS_PER_QUESTION} words each). Keep questions concise.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Optimal Formatting Guide */}
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">📚 Optimal Format for Best AI Results:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-800 dark:text-blue-200">
                  <div>
                    <p className="font-medium mb-1">Structure (Required):</p>
                    <ul className="space-y-0.5">
                      <li>• <strong>One blank line</strong> between questions</li>
                      <li>• Clear A), B), C), D) options</li>
                      <li>• "Answer: B" or "Correct: B"</li>
                      <li>• Brief explanation (optional)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium mb-1">Limits (Recommended):</p>
                    <ul className="space-y-0.5">
                      <li>• <strong>{LIMITS.RECOMMENDED_QUESTIONS} questions</strong> per batch (optimal)</li>
                      <li>• <strong>&lt;{LIMITS.MAX_WORDS_PER_QUESTION} words</strong> per question</li>
                      <li>• Skip lengthy explanations initially</li>
                      <li>• Include context only when essential</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Textarea
                id="bulk-input"
                rows={15}
                placeholder={`Paste up to ${LIMITS.MAX_QUESTIONS} questions separated by blank lines...

CONCISE EXAMPLE (AI handles this perfectly):

What is 2 + 2?
A) 3
B) 4  
C) 5
D) 6
Answer: B

The capital of France is:
A) Berlin
B) Madrid
C) Paris
D) Rome
Answer: C
Explanation: Paris has been the capital since 987 AD.

AVOID: Very long reading passages, detailed explanations, or complex formatting initially. Start simple!`}
                value={bulkInput}
                onChange={(e) => handleBulkInputChange(e.target.value)}
                className="resize-none"
              />
              
              {/* Smart Processing Preview */}
              {bulkInput && bulkInputStats.questions > 0 && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">🤖 AI Processing Preview:</h4>
                  <div className="text-xs space-y-1">
                    <p><strong>Detected:</strong> {bulkInputStats.questions} questions ({bulkInputStats.words} words total)</p>
                    <p><strong>AI will infer:</strong> Test type, subject, topic, difficulty for each question</p>
                    <p><strong>Processing mode:</strong> {
                      bulkInputStats.withinLimits 
                        ? <span className="text-green-600">✓ Optimal (high accuracy expected)</span>
                        : <span className="text-amber-600">⚠ Large input (may have some parsing issues)</span>
                    }</p>
                  </div>
                </div>
              )}
              
              {!hasMetadata && (
                <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
                        AI will infer all metadata
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        For each question, AI will automatically determine: test type (SHSAT/SSAT/ISEE/etc.), subject (Math/Verbal/Reading), topic, and difficulty level. Set defaults above to override.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="file" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>File Import (CSV/JSON)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadSampleCsv}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Sample CSV
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    id="csv-input"
                    type="file"
                    accept=".csv"
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="csv-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {csvFile ? csvFile.name : 'Click to upload CSV file'}
                    </p>
                  </label>
                </div>

                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <input
                    id="json-input"
                    type="file"
                    accept=".json"
                    onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="json-input"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {jsonFile ? jsonFile.name : 'Click to upload JSON file'}
                    </p>
                  </label>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="overwrite-duplicates"
                  checked={overwriteDuplicates}
                  onChange={(e) => setOverwriteDuplicates(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="overwrite-duplicates" className="text-sm">
                  Overwrite duplicate questions
                </Label>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium mb-1">File Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>CSV files must include headers in the first row</li>
                      <li>JSON files should contain an array of question objects</li>
                      <li>Required fields: test_type, subject, topic, difficulty_level, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation</li>
                      <li>Optional fields: sub_topic, time_allocated</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
        <Button 
          onClick={handleProcess} 
          disabled={isProcessing || (!textInput.trim() && !imageFile && !bulkInput.trim() && !csvFile && !jsonFile)}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            'Process & Save Questions'
          )}
        </Button>
        <Button variant="secondary" onClick={clearForm}>
          Clear
        </Button>
        {canPracticeQuestions() && (
          <Button 
            onClick={handlePracticeNow}
            disabled={isCreatingSession}
            className="flex items-center gap-2 bg-primary"
          >
            {isCreatingSession ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating Session...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Practice These Now
              </>
            )}
          </Button>
        )}
        </div>

        {/* Bulk Import Results */}
        {bulkResults && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Import Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                  {bulkResults.successful}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-800 dark:text-red-200">
                  {bulkResults.failed}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">Failed</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                  {bulkResults.duplicates_skipped}
                </div>
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Duplicates Skipped</div>
              </div>
            </div>
            
            {bulkResults.errors && bulkResults.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Errors:</h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {bulkResults.errors.slice(0, 10).map((error: string, index: number) => (
                    <div key={index} className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-2 rounded">
                      {error}
                    </div>
                  ))}
                  {bulkResults.errors.length > 10 && (
                    <div className="text-sm text-muted-foreground">
                      ...and {bulkResults.errors.length - 10} more errors
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Practice Now Button for Bulk Results */}
            {bulkResults.successful > 0 && bulkResults.successful <= 30 && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary">Ready to Practice!</p>
                    <p className="text-sm text-muted-foreground">
                      {bulkResults.successful} questions are ready for a practice session
                    </p>
                  </div>
                  <Button 
                    onClick={handlePracticeNow}
                    disabled={isCreatingSession}
                    className="flex items-center gap-2"
                  >
                    {isCreatingSession ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Practice These Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
           </CardContent>
           </Card>
        )}

        {/* Individual Processing Results Display */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Processing Results
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{results.filter(r => r.success).length} Success</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span>{results.filter(r => !r.success).length} Failed</span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      result.success
                        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
                        : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {result.data?.questionNumber && `Question #${result.data.questionNumber}: `}
                          {result.success ? 'Successfully processed' : 'Processing failed'}
                        </div>
                        {result.error && (
                          <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                            {result.error}
                          </div>
                        )}
                        {result.data?.questionPreview && (
                          <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/50 rounded">
                            <strong>Question preview:</strong> {result.data.questionPreview}
                          </div>
                        )}
                        {result.data && result.success && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {result.data.test_type && `${result.data.test_type} • `}
                            {result.data.subject && `${result.data.subject} • `}
                            {result.data.topic && result.data.topic}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Practice Now Button for Individual Results */}
              {results.some(r => r.success) && results.filter(r => r.success).length <= 30 && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-primary">Ready to Practice!</p>
                      <p className="text-sm text-muted-foreground">
                        {results.filter(r => r.success).length} questions are ready for a practice session
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const questions = getSuccessfulQuestions();
                          await verifyQuestionsInDatabase(questions);
                          toast({
                            title: "Verification Complete",
                            description: "Questions verified in database.",
                          });
                        }}
                        disabled={verifyingQuestions}
                        className="flex items-center gap-2"
                      >
                        {verifyingQuestions ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                            Verifying...
                          </>
                        ) : (
                          <>
                            <Database className="h-3 w-3" />
                            Verify
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={handlePracticeNow}
                        disabled={isCreatingSession}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isCreatingSession ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            Creating...
                          </>
                        ) : (
                          <>
                            <Play className="h-3 w-3" />
                            Practice Now
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        </div>

        {/* Right Column - Admin Inventory */}
        <div className="space-y-6">
          <AdminInventoryWidget ref={inventoryWidgetRef} />
        </div>
      </div>
    </div>
  );
};

export default QuestionsAdmin;
