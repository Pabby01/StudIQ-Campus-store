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

        // Check if profile exists
        const { data: existingProfile } = await supabase
            .from('profiles')
            .select('address')
            .eq('address', walletAddress)
            .single()

        if (existingProfile) {
            // Update existing profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: displayName || undefined,
                    updated_at: new Date().toISOString()
                } as any)
                .eq('address', walletAddress)

            if (error) throw error

            return NextResponse.json({
                success: true,
                message: 'Profile updated from main app'
            })
        } else {
            // Create new profile from main app data
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    address: walletAddress,
                    name: displayName || 'Student',
                    school: null,
                    campus: null
                } as any)

            if (profileError) throw profileError

            return NextResponse.json({
                success: true,
                message: 'Profile created from main app'
            })
        }
    } catch (error) {
        console.error('Profile sync error:', error)
        return NextResponse.json(
            { error: 'Failed to sync profile' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/sync/profile/:walletAddress
 * Send profile data to main app
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
