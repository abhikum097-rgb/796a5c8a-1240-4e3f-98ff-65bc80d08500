
import React, { useState } from 'react';
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
import { CheckCircle, XCircle, Upload, FileText, Images, List } from 'lucide-react';

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

  const [metadata, setMetadata] = useState({
    test_type: '',
    subject: '',
    topic: '',
    difficulty_level: ''
  });

  const [textInput, setTextInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);

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

  const processTextQuestion = async (questionText: string): Promise<ProcessingResult> => {
    try {
      const response = await supabase.functions.invoke('process-question', {
        body: {
          prompt: QUESTION_PROCESSING_PROMPT + questionText,
          metadata
        }
      });

      if (response.error) throw new Error(response.error.message);

      const questionData = JSON.parse(response.data.content);
      
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

      const questionData = JSON.parse(response.data.content);
      return await saveQuestionToDatabase(questionData);
    } catch (error: any) {
      console.error('Image processing failed:', error);
      return { success: false, error: error.message };
    }
  };

  const processBulkQuestions = async (bulkText: string): Promise<ProcessingResult[]> => {
    const questions = bulkText.split('\n\n').filter(q => q.trim());
    const results: ProcessingResult[] = [];
    
    for (const questionText of questions) {
      const result = await processTextQuestion(questionText);
      results.push(result);
    }
    
    return results;
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setResults([]);

    try {
      let processingResults: ProcessingResult[] = [];

      if (textInput.trim()) {
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
      } else {
        toast({
          title: "Partial Success",
          description: `${successCount}/${totalCount} questions processed successfully.`,
          variant: "destructive",
        });
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
    setResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Questions Admin Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          AI-Powered Question Creation
        </div>
      </div>

      {/* Metadata Section */}
      <Card>
        <CardHeader>
          <CardTitle>Question Metadata</CardTitle>
          <CardDescription>
            Set default values for all questions (can be overridden by AI)
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
            <TabsList className="grid w-full grid-cols-3">
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
                Bulk Import
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
              <Label htmlFor="bulk-input">Bulk Questions</Label>
              <Textarea
                id="bulk-input"
                rows={15}
                placeholder="Paste multiple questions separated by blank lines..."
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="resize-none"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button 
          onClick={handleProcess} 
          disabled={isProcessing || (!textInput.trim() && !imageFile && !bulkInput.trim())}
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
      </div>

      {/* Results Display */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success 
                    ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                    : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                }`}
              >
                {result.success ? (
                  <div>
                    <div className="flex items-center text-green-800 dark:text-green-200">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Question processed successfully
                    </div>
                    {result.data && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        <strong>Topic:</strong> {result.data.topic} | 
                        <strong>Difficulty:</strong> {result.data.difficulty_level}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-red-800 dark:text-red-200">
                    <XCircle className="w-5 h-5 mr-2 inline" />
                    Processing failed: {result.error}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuestionsAdmin;
