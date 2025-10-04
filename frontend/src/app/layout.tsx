import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AgentProvider } from "@/contexts/AgentContext";
import AgentController from "@/components/agent/AgentController";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Turismo Puerto Gaitán",
  description: "Plataforma de Turismo del Municipio de Puerto Gaitán",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-full`}
      >
        <AuthProvider>
          <LanguageProvider>
            <AgentProvider>
              <div className="flex-grow flex flex-col">
                {children}
              </div>
              <Footer />
              <AgentController />
            </AgentProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
