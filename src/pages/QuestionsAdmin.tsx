
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
import { CheckCircle, XCircle, Upload, FileText, Images, List, Download, AlertCircle } from 'lucide-react';

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
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [overwriteDuplicates, setOverwriteDuplicates] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [bulkResults, setBulkResults] = useState<any>(null);

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

  const parseCsvFile = (content: string): any[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const questions = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const question: any = {};
      headers.forEach((header, index) => {
        question[header] = values[index] || '';
      });
      return question;
    });

    return questions;
  };

  const processBulkFile = async (file: File): Promise<void> => {
    try {
      const content = await file.text();
      let questions: any[] = [];

      if (file.name.toLowerCase().endsWith('.csv')) {
        questions = parseCsvFile(content);
      } else if (file.name.toLowerCase().endsWith('.json')) {
        const parsed = JSON.parse(content);
        questions = Array.isArray(parsed) ? parsed : [parsed];
      } else {
        throw new Error('Unsupported file format. Please use CSV or JSON.');
      }

      if (questions.length === 0) {
        throw new Error('No valid questions found in file');
      }

      console.log(`Processing ${questions.length} questions from file`);

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
        description: response.data.message,
      });

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
    setCsvFile(null);
    setJsonFile(null);
    setResults([]);
    setBulkResults(null);
  };

  const downloadSampleCsv = () => {
    const sampleData = `test_type,subject,topic,sub_topic,difficulty_level,question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,time_allocated
SHSAT,Math,Algebra,Linear Equations,Medium,"Solve for x: 2x + 5 = 13",x = 4,x = 8,x = 9,x = 3,A,"To solve 2x + 5 = 13: Subtract 5 from both sides: 2x = 8. Divide by 2: x = 4.",90
SSAT,Verbal,Vocabulary,Synonyms,Easy,"Choose the word that means the same as HAPPY:",sad,joyful,angry,tired,B,"Happy means joyful or pleased. The other options are antonyms or unrelated.",60`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_questions.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
              <Label htmlFor="bulk-input">Bulk Questions (Text)</Label>
              <Textarea
                id="bulk-input"
                rows={15}
                placeholder="Paste multiple questions separated by blank lines..."
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="resize-none"
              />
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
          </CardContent>
        </Card>
      )}

      {/* Individual Processing Results Display */}
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
