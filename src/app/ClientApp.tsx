"use client";
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ColorProvider } from "@/components/ColorContext";
import AppWrapper from "@/components/AppWrapper";
import StartPage from "@/pages-legacy/start/StartPage";
import Student from "@/pages-legacy/student/Student";
import Admin from "@/pages-legacy/admin/Admin";
import Teacher from "@/pages-legacy/teacher/Teacher";
import Parent from "@/pages-legacy/parent/Parent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function ClientApp() {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes stale time
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ColorProvider>
          <AppWrapper>
            <Routes>
              <Route path="/" element={<StartPage />} />
              <Route path="/student" element={<Student />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/teacher/*" element={<Teacher />} />
              <Route path="/parent" element={<Parent />} />
            </Routes>
          </AppWrapper>
        </ColorProvider>
      </Router>
    </QueryClientProvider>
  );
}
