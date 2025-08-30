
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import PracticeSelection from "./pages/PracticeSelection";
import PracticeInterface from "./pages/PracticeInterface";
import Results from "./pages/Results";
import ResultsReview from "./pages/ResultsReview";
import Topics from "./pages/Topics";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Billing from "./pages/Billing";
import QuestionsAdmin from "./pages/QuestionsAdmin";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="practice" element={<Practice />} />
              <Route path="practice/session/:sessionId" element={<PracticeInterface />} />
              <Route path="results/:sessionId" element={<Results />} />
              <Route path="results/:sessionId/review" element={<ResultsReview />} />
              <Route path="topics" element={<Topics />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="billing" element={<Billing />} />
            </Route>
            
            <Route path="/practice" element={<DashboardLayout />}>
              <Route index element={<Practice />} />
              <Route path="shsat" element={<PracticeSelection testType="SHSAT" />} />
              <Route path="ssat" element={<PracticeSelection testType="SSAT" />} />
              <Route path="isee" element={<PracticeSelection testType="ISEE" />} />
              <Route path="hspt" element={<PracticeSelection testType="HSPT" />} />
              <Route path="tachs" element={<PracticeSelection testType="TACHS" />} />
              <Route path="session/:sessionId" element={<PracticeInterface />} />
            </Route>
            
            <Route path="/results" element={<DashboardLayout />}>
              <Route path=":sessionId" element={<Results />} />
              <Route path=":sessionId/review" element={<ResultsReview />} />
            </Route>
            
            <Route path="/topics" element={<DashboardLayout />}>
              <Route index element={<Topics />} />
            </Route>
            
            <Route path="/analytics" element={<DashboardLayout />}>
              <Route index element={<Analytics />} />
            </Route>

            <Route path="/questions-making" element={<DashboardLayout />}>
              <Route index element={<QuestionsAdmin />} />
            </Route>
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
