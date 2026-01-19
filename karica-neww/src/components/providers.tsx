"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth";
import { useState } from "react";

import { OnboardingProvider } from "@/context/OnboardingContext";

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000,
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <AuthProvider>
                    <OnboardingProvider>
                        {children}
                        <Toaster />
                        <Sonner />
                    </OnboardingProvider>
                </AuthProvider>
            </TooltipProvider>
        </QueryClientProvider>
    );
}
