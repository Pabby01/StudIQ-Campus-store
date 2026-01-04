import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * POST /api/sync/profile
 * Receive profile updates from main app
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { walletAddress, displayName, email, phone } = body

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Use upsert to handle concurrent requests gracefully
        // This prevents duplicate key errors when multiple sync requests arrive
        const { error } = await supabase
            .from('profiles')
            .upsert({
                address: walletAddress,
                name: displayName || 'Student',
                school: null,
                campus: null,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'address',  // Specify which column is unique
                ignoreDuplicates: false  // Update existing row instead of ignoring
            })

        if (error) {
            console.error('Profile sync error:', error)
            throw error
        }

        return NextResponse.json({
            success: true,
            message: 'Profile synced from main app'
        })
    } catch (error) {
        console.error('Profile sync error:', error)
        return NextResponse.json(
            { error: 'Failed to sync profile' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/sync/profile?walletAddress=xxx
 * Send profile data to main app
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const walletAddress = searchParams.get('walletAddress')

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400 }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Get profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('address', walletAddress)
            .single()

        return NextResponse.json({
            walletAddress,
            displayName: (profile as any)?.name || null,
            school: (profile as any)?.school || null,
            campus: (profile as any)?.campus || null,
            profileData: profile || null
        })
    } catch (error) {
        console.error('Profile fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500 }
        )
    }
}
