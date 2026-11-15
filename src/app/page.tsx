import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  let initialTrades = []

  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const now = new Date()
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
      const startDate = new Date(`${monthStr}-01T00:00:00Z`)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)

      const trades = await prisma.trade.findMany({
        where: {
          userId: user.id,
          entryDate: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: {
          legs: { orderBy: { order: "asc" } },
          reflection: true,
          charts: true,
        },
        orderBy: { entryDate: "desc" },
      })

      initialTrades = JSON.parse(JSON.stringify(trades))
    }
  } catch (error) {
    console.error("DashboardPage prefetch error:", error)
  }

  return <DashboardClient initialTrades={initialTrades} />
}
