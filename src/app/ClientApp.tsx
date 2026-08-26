"use client";
import React, { useState, lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ColorProvider } from "@/components/ColorContext";
import AppWrapper from "@/components/AppWrapper";
import StartPage from "@/pages-legacy/start/StartPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Lazy load the large dashboard components
const Student = lazy(() => import("@/pages-legacy/student/Student"));
const Admin = lazy(() => import("@/pages-legacy/admin/Admin"));
const Teacher = lazy(() => import("@/pages-legacy/teacher/Teacher"));

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
            <Suspense fallback={
              <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: 600,
                fontFamily: 'inherit'
              }}>
                იტვირთება...
              </div>
            }>
              <Routes>
                <Route path="/" element={<StartPage />} />
                <Route path="/student" element={<Student />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/teacher/*" element={<Teacher />} />
              </Routes>
            </Suspense>
          </AppWrapper>
        </ColorProvider>
      </Router>
    </QueryClientProvider>
  );
}
