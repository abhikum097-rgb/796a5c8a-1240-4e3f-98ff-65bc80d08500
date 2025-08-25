import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Practice from "./pages/Practice";
import DashboardLayout from "./components/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
            <Route path="analytics" element={<div>Analytics Coming Soon</div>} />
            <Route path="settings" element={<div>Settings Coming Soon</div>} />
            <Route path="billing" element={<div>Billing Coming Soon</div>} />
          </Route>
          <Route path="/practice" element={<DashboardLayout />}>
            <Route index element={<Practice />} />
            <Route path="shsat" element={<div>SHSAT Practice</div>} />
            <Route path="ssat" element={<div>SSAT Practice</div>} />
            <Route path="isee" element={<div>ISEE Practice</div>} />
            <Route path="hspt" element={<div>HSPT Practice</div>} />
            <Route path="tachs" element={<div>TACHS Practice</div>} />
          </Route>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
