import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/sync/points/:walletAddress
 * Get total points earned from store purchases
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { walletAddress: string } }
) {
    try {
        const { walletAddress } = params

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get total points from points_log
        const { data: pointsData } = await supabase
            .from('points_log')
            .select('points')
            .eq('address', walletAddress)

        const totalPoints = (pointsData || []).reduce((sum: number, log: any) => sum + (log.points || 0), 0)

        return NextResponse.json({
            walletAddress,
            points: totalPoints
        })
    } catch (error) {
        console.error('Points fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch points' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/sync/points
 * Receive points update from main app (not typically used, but available)
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { walletAddress, points, description } = body

        if (!walletAddress || points === undefined) {
            return NextResponse.json(
                { error: 'Wallet address and points are required' },
                { status: 400 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Log points (if needed for record keeping)
        await supabase
            .from('points_log')
            .insert({
                address: walletAddress,
                points: points,
                reason: description || 'Synced from main app',
                created_at: new Date().toISOString()
            } as any)

        return NextResponse.json({
            success: true,
            pointsAdded: points
        })
    } catch (error) {
        console.error('Points sync error:', error)
        return NextResponse.json(
            { error: 'Failed to sync points' },
            { status: 500 }
        )
    }
}
