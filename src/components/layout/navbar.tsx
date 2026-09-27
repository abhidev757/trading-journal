"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, Plus, TrendingUp, LogOut } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { createBrowserClient } from "@supabase/ssr"

const navItems = [
  { href: "/", label: "Journal", icon: LayoutDashboard },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
    })
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    
    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="flex h-14 items-center px-4 gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 mr-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-sm tracking-tight hidden sm:block">TradeJournal</span>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-2 text-muted-foreground",
                  pathname === href && "text-foreground bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline-block">{label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/trades/new">
                <Button id="add-trade-btn" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline-block">Add Manual Trade</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} title="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}