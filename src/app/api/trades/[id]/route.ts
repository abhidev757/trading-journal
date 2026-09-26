import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const trade = await prisma.trade.findUnique({
      where: { id, userId: user.id },
      include: {
        legs: { orderBy: { order: "asc" } },
        reflection: true,
        charts: true,
      },
    })
    
    if (!trade) return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    return NextResponse.json({ trade })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch trade" }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    const existing = await prisma.trade.findUnique({
      where: { id, userId: user.id },
      include: { charts: true },
    })
    
    if (!existing) return NextResponse.json({ error: "Trade not found" }, { status: 404 })

    const body = await req.json()
    const { legs, reflection, charts, entryTime, exitTime, intendedPlan, planFollowed, entryConfluences, tradeManagement, mistakes, entryEmotion, exitEmotion, notes, ...tradeData } = body

    const updated = await prisma.trade.update({
      where: { id },
      data: {
        ...tradeData,
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
          deleteMany: {},
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
          upsert: {
            create: {
              planFollowed: reflection.planFollowed || false,
              intendedPlan: reflection.intendedPlan || null,
              entryConfluences: reflection.entryConfluences || [],
              tradeManagement: reflection.tradeManagement || null,
              mistakes: reflection.mistakes || [],
              entryEmotion: reflection.entryEmotion || null,
              exitEmotion: reflection.exitEmotion || null,
              notes: reflection.notes || null,
            },
            update: {
              planFollowed: reflection.planFollowed || false,
              intendedPlan: reflection.intendedPlan || null,
              entryConfluences: reflection.entryConfluences || [],
              tradeManagement: reflection.tradeManagement || null,
              mistakes: reflection.mistakes || [],
              entryEmotion: reflection.entryEmotion || null,
              exitEmotion: reflection.exitEmotion || null,
              notes: reflection.notes || null,
            }
          }
        } : undefined,
        charts: charts ? {
          upsert: {
            create: {
              htfUrl: charts.htfUrl || null,
              mtfUrl: charts.mtfUrl || null,
              ltfUrl: charts.ltfUrl || null,
            },
            update: {
              htfUrl: charts.htfUrl || null,
              mtfUrl: charts.mtfUrl || null,
              ltfUrl: charts.ltfUrl || null,
            }
          }
        } : undefined,
      },
    })

    return NextResponse.json({ trade: updated })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update trade" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    
    // Ensure user owns trade
    const existing = await prisma.trade.findUnique({
      where: { id, userId: user.id },
      include: { charts: true },
    })
    
    if (!existing) return NextResponse.json({ error: "Trade not found" }, { status: 404 })

    // Delete associated images from Supabase Storage
    const filePaths: string[] = []
    if (existing.charts) {
      if (existing.charts.htfUrl) filePaths.push(existing.charts.htfUrl.split('/trade-charts/')[1])
      if (existing.charts.mtfUrl) filePaths.push(existing.charts.mtfUrl.split('/trade-charts/')[1])
      if (existing.charts.ltfUrl) filePaths.push(existing.charts.ltfUrl.split('/trade-charts/')[1])
    }
    
    if (filePaths.length > 0) {
      const { error } = await supabase.storage.from("trade-charts").remove(filePaths)
      if (error) console.error("Storage delete error:", error)
    }

    // Delete trade from DB
    await prisma.trade.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to delete trade" }, { status: 500 })
  }
}