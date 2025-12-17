"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { ChatProvider } from "@/contexts/chat-context";
import { Toaster } from "@/components/ui/sonner";
import { GlobalAIAssistant } from "@/components/global-ai-assistant";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <ChatProvider>
          {children}
          <GlobalAIAssistant />
          <Toaster position="top-right" richColors />
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
