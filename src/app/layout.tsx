"use client"

import { Work_Sans } from "next/font/google";
import './globals.css'

import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { NextUIProvider } from "@nextui-org/react";

const fontSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <NextUIProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            >
              {children}
          </ThemeProvider>
        </NextUIProvider>
      </body>
    </html>
  )
}
