import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month") // YYYY-MM
    let whereClause: any = { userId: user.id }

    if (month) {
      const startDate = new Date(`${month}-01T00:00:00Z`)
      const endDate = new Date(startDate)
      endDate.setMonth(endDate.getMonth() + 1)
      whereClause.entryDate = {
        gte: startDate,
        lt: endDate,
      }
    }

    const trades = await prisma.trade.findMany({
      where: whereClause,
      include: {
        legs: { orderBy: { order: "asc" } },
        reflection: true,
        charts: true,
      },
      orderBy: { entryDate: "desc" },
    })

    return NextResponse.json({ trades })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch trades" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { legs, reflection, charts, entryTime, exitTime, intendedPlan, planFollowed, entryConfluences, tradeManagement, mistakes, entryEmotion, exitEmotion, notes, ...tradeData } = body

    const trade = await prisma.trade.create({
      data: {
        ...tradeData,
        userId: user.id,
        lotSize: parseFloat(tradeData.lotSize) || 0,
        entryPrice: parseFloat(tradeData.entryPrice) || 0,
        exitPrice: tradeData.exitPrice ? parseFloat(tradeData.exitPrice) : null,
        stopLoss: tradeData.stopLoss ? parseFloat(tradeData.stopLoss) : null,
        takeProfit: tradeData.takeProfit ? parseFloat(tradeData.takeProfit) : null,
        netPnl: tradeData.netPnl ? parseFloat(tradeData.netPnl) : null,
        fees: tradeData.fees ? parseFloat(tradeData.fees) : 0,
        swap: tradeData.swap ? parseFloat(tradeData.swap) : 0,
        riskR: tradeData.riskR ? parseFloat(tradeData.riskR) : null,
        returnR: tradeData.returnR ? parseFloat(tradeData.returnR) : null,
        legs: {
          create: legs?.map((leg: any, i: number) => ({
            ...leg,
            order: i + 1,
            lotSize: parseFloat(leg.lotSize) || 0,
            entryPrice: parseFloat(leg.entryPrice) || 0,
            exitPrice: leg.exitPrice ? parseFloat(leg.exitPrice) : null,
            stopLoss: leg.stopLoss ? parseFloat(leg.stopLoss) : null,
            takeProfit: leg.takeProfit ? parseFloat(leg.takeProfit) : null,
          })) || [],
        },
        reflection: reflection ? {
          create: {
            planFollowed: reflection.planFollowed || false,
            intendedPlan: reflection.intendedPlan || null,
            entryConfluences: reflection.entryConfluences || [],
            tradeManagement: reflection.tradeManagement || null,
            mistakes: reflection.mistakes || [],
            entryEmotion: reflection.entryEmotion || null,
            exitEmotion: reflection.exitEmotion || null,
            notes: reflection.notes || null,
          }
        } : undefined,
        charts: charts ? {
          create: {
            htfUrl: charts.htfUrl || null,
            mtfUrl: charts.mtfUrl || null,
            ltfUrl: charts.ltfUrl || null,
          }
        } : undefined,
      },
    })

    return NextResponse.json({ trade })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to save trade" }, { status: 500 })
  }
}