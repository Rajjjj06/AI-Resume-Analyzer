import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import PublicLayout from "@/components/PublicLayout";
import DashboardLayout from "@/components/DashboardLayout";

import Landing from "@/pages/Landing";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";

import Dashboard from "@/pages/dashboard/Dashboard";
import UploadResume from "@/pages/dashboard/UploadResume";
import MyResumes from "@/pages/dashboard/MyResumes";
import AnalyzeJD from "@/pages/dashboard/AnalyzeJD";
import MatchResults from "@/pages/dashboard/MatchResults";
import ATSScore from "@/pages/dashboard/ATSScore";
import InterviewQuestions from "@/pages/dashboard/InterviewQuestions";
import HistoryPage from "@/pages/dashboard/History";
import SettingsPage from "@/pages/dashboard/Settings";
import Subscription from "@/pages/dashboard/Subscription";

import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <AuthProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public pages */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
              {/* <Route path="/signin" element={<SignIn />} /> */}
            </Route>

            {/* Protected dashboard pages */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/dashboard/upload" element={<UploadResume />} />
                <Route path="/dashboard/my-resumes" element={<MyResumes />} />
                <Route path="/dashboard/analyze-jd" element={<AnalyzeJD />} />
                <Route
                  path="/dashboard/match-results"
                  element={<MatchResults />}
                />
                <Route path="/dashboard/ats-score" element={<ATSScore />} />
                <Route
                  path="/dashboard/interview-questions"
                  element={<InterviewQuestions />}
                />
                <Route path="/dashboard/history" element={<HistoryPage />} />
                <Route path="/dashboard/settings" element={<SettingsPage />} />
                <Route
                  path="/dashboard/subscription"
                  element={<Subscription />}
                />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </AuthProvider>
);

export default App;
