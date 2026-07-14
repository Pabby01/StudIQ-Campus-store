import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders })
}

/**
 * POST /api/sync/profile
 * Receive profile updates from main app
 */
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (authHeader !== `Bearer ${process.env.SYNC_API_KEY}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
        }
        const body = await request.json()
        const { walletAddress, displayName, email, phone } = body

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400, headers: corsHeaders }
            )
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Check if profile exists
        const { data: existing } = await supabase
            .from('profiles')
            .select('*')
            .eq('address', walletAddress)
            .maybeSingle()

        if (existing) {
            // Update existing profile - only update provided fields
            const updates: any = {
                updated_at: new Date().toISOString()
            }
            // Only update name if provided and not "Student" (unless that's really their name, but usually it's a default)
            // Actually, if main app sends "Student" as default, we might not want to overwrite a custom name here.
            // But let's assume if displayName is provided and truthy, we use it.
            if (displayName) updates.name = displayName
            if (email) updates.email = email
            if (phone) updates.phone = phone

            // Do NOT touch school or campus here as this sync endpoint doesn't have that data

            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('address', walletAddress)

            if (error) {
                console.error('Profile update error:', error)
                throw error
            }
        } else {
            // Create new profile with defaults
            const { error } = await supabase
                .from('profiles')
                .insert({
                    address: walletAddress,
                    name: displayName || 'Student',
                    email: email || null,
                    phone: phone || null,
                    school: null,
                    campus: null,
                    updated_at: new Date().toISOString()
                })

            if (error) {
                console.error('Profile insert error:', error)
                throw error
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Profile synced from main app'
        }, { headers: corsHeaders })
    } catch (error) {
        console.error('Profile sync error:', error)
        return NextResponse.json(
            { error: 'Failed to sync profile' },
            { status: 500, headers: corsHeaders }
        )
    }
}

/**
 * GET /api/sync/profile?walletAddress=xxx
 * Send profile data to main app
 */
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (authHeader !== `Bearer ${process.env.SYNC_API_KEY}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
        }
        const { searchParams } = new URL(request.url)
        const walletAddress = searchParams.get('walletAddress')

        if (!walletAddress) {
            return NextResponse.json(
                { error: 'Wallet address is required' },
                { status: 400, headers: corsHeaders }
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
        }, { headers: corsHeaders })
    } catch (error) {
        console.error('Profile fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch profile' },
            { status: 500, headers: corsHeaders }
        )
    }
}
