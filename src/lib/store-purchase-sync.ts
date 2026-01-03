/**
 * Store Purchase Sync Helper
 * 
 * Call this after a successful purchase to sync with main app
 */

interface PurchaseSyncData {
    walletAddress: string
    orderId: string
    amount: number
    pointsEarned: number
    items: Array<{ name: string; quantity: number; price: number }>
}

export async function syncPurchaseToMainApp(data: PurchaseSyncData) {
    const mainAppUrl = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://studiq.app'

    try {
        // Report purchase to main app
        const response = await fetch(`${mainAppUrl}/api/sync/transaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.SYNC_API_KEY && { 'X-API-Key': process.env.SYNC_API_KEY })
            },
            body: JSON.stringify({
                walletAddress: data.walletAddress,
                type: 'purchase',
                amount: data.amount,
                points: data.pointsEarned,
                description: `Campus Store purchase - ${data.items.length} item(s)`,
                source: 'campus_store',
                orderId: data.orderId,
                metadata: {
                    items: data.items,
                    purchaseDate: new Date().toISOString()
                }
            })
        })

        if (!response.ok) {
            throw new Error(`Main app sync failed: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('✅ Purchase synced to main app:', result)
        return result
    } catch (error) {
        console.error('❌ Failed to sync purchase to main app:', error)
        // Don't throw - purchase is still valid even if sync fails
        return { success: false, error }
    }
}

/**
 * Sync points earned to main app
 */
export async function syncPointsToMainApp(walletAddress: string, points: number, reason: string) {
    const mainAppUrl = process.env.NEXT_PUBLIC_MAIN_APP_URL || 'https://studiq.app'

    try {
        const response = await fetch(`${mainAppUrl}/api/sync/points`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(process.env.SYNC_API_KEY && { 'X-API-Key': process.env.SYNC_API_KEY })
            },
            body: JSON.stringify({
                walletAddress,
                points,
                source: 'campus_store',
                description: reason
            })
        })

        if (!response.ok) {
            throw new Error(`Points sync failed: ${response.statusText}`)
        }

        const result = await response.json()
        console.log('✅ Points synced to main app:', result)
        return result
    } catch (error) {
        console.error('❌ Failed to sync points to main app:', error)
        return { success: false, error }
    }
}
