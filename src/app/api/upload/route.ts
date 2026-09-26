import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get("file") as File
    const tradeId = formData.get("tradeId") as string
    const timeframe = formData.get("timeframe") as string // htf, mtf, ltf

    if (!file || !tradeId || !timeframe) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/${tradeId}/${timeframe}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("trade-charts")
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) {
      console.error(uploadError)
      return NextResponse.json({ error: "Upload failed" }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from("trade-charts")
      .getPublicUrl(filePath)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}