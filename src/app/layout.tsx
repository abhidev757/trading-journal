import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/layout/theme-provider"
import { Navbar } from "@/components/layout/navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "TradeJournal - Track, Reflect and Grow",
    template: "%s | TradeJournal",
  },
  description: "A professional trading journal to track trades, review emotions, and build consistency.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="overflow-x-hidden max-w-[100vw]">
      <body className={`${inter.className} overflow-x-hidden max-w-[100vw]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="tj-theme"
        >
          <div className="min-h-screen bg-background overflow-x-hidden max-w-[100vw] w-full flex flex-col">
            <Navbar />
            <main className="flex-1 w-full max-w-[100vw] overflow-x-hidden">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}