"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useWallet } from "@solana/react-hooks";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { ArrowLeft, Check, Crown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { SUBSCRIPTION_PLANS, convertUSDtoSOL, formatSOL, formatUSD, type PlanName, type BillingCycle } from "@/lib/pricing";

export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const wallet = useWallet();
    const toast = useToast();

    const plan = (searchParams?.get('plan') || 'premium') as PlanName;
    const [cycle, setCycle] = useState<BillingCycle>('monthly');
    const [processing, setProcessing] = useState(false);

    const planDetails = SUBSCRIPTION_PLANS[plan];
    const usdPrice = planDetails[cycle];
    const solPrice = convertUSDtoSOL(usdPrice);

    const handlePayment = async () => {
        if (wallet.status !== 'connected') {
            toast.error('Please connect your wallet');
            return;
        }

        setProcessing(true);

        try {
            const userAddress = wallet.session.account.address;

            // Create subscription
            const response = await fetch('/api/subscription/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userAddress,
                    plan,
                    cycle,
                    txSignature: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    amount: solPrice
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Subscription activated!');
                router.push(`/pricing/success?plan=${plan}&cycle=${cycle}`);
            } else {
                toast.error(data.error || 'Subscription activation failed');
            }
        } catch (err: any) {
            console.error('Subscription error:', err);
            toast.error(err.message || 'Failed to activate subscription');
        } finally {
            setProcessing(false);
        }
    };

    if (wallet.status !== 'connected') {
        return (
            <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
                <Card className="p-8 text-center max-w-md">
                    <h2 className="text-2xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-muted-text mb-6">
                        Please connect your Solana wallet to complete your subscription purchase.
                    </p>
                    <Button variant="primary" onClick={() => router.push('/')}>
                        Go to Home
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-soft-gray-bg p-4 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push('/pricing')}
                        disabled={processing}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-black">Complete Your Purchase</h1>
                        <p className="text-muted-text">Upgrade to {planDetails.name}</p>
                    </div>
                </div>

                {/* Plan Summary */}
                <Card className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h2 className="text-2xl font-bold text-black">{planDetails.name}</h2>
                                {plan === 'premium' && <Crown className="w-6 h-6 text-yellow-500" />}
                            </div>
                            <p className="text-sm text-muted-text">
                                Billed {cycle === 'monthly' ? 'monthly' : 'annually'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-black">{formatUSD(usdPrice)}</div>
                            <div className="text-sm text-muted-text">≈ {formatSOL(solPrice)}</div>
                        </div>
                    </div>

                    {/* Billing Cycle Toggle */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Billing Cycle
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setCycle('monthly')}
                                disabled={processing}
                                className={`p-4 rounded-lg border-2 transition-all ${cycle === 'monthly'
                                    ? 'border-primary-blue bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <div className="font-semibold text-black">Monthly</div>
                                <div className="text-sm text-muted-text">{formatUSD(planDetails.monthly)}/mo</div>
                            </button>
                            <button
                                onClick={() => setCycle('yearly')}
                                disabled={processing}
                                className={`p-4 rounded-lg border-2 transition-all relative ${cycle === 'yearly'
                                    ? 'border-primary-blue bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {planDetails.yearly < planDetails.monthly * 12 && (
                                    <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                        Save ${(planDetails.monthly * 12 - planDetails.yearly).toFixed(0)}
                                    </span>
                                )}
                                <div className="font-semibold text-black">Yearly</div>
                                <div className="text-sm text-muted-text">{formatUSD(planDetails.yearly)}/yr</div>
                            </button>
                        </div>
                    </div>

                    {/* What's Included */}
                    <div className="border-t pt-6">
                        <h3 className="font-semibold text-black mb-4">What's Included:</h3>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <span className="text-sm">Create up to {planDetails.maxStores} stores</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <span className="text-sm">{planDetails.platformFee}% platform fee</span>
                            </li>
                            {plan === 'premium' && (
                                <>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                        <span className="text-sm">Premium badge & priority placement</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                        <span className="text-sm">Advanced analytics</span>
                                    </li>
                                </>
                            )}
                            {plan === 'enterprise' && (
                                <>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                        <span className="text-sm">Dedicated account manager</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                        <span className="text-sm">API access & white-label options</span>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>
                </Card>

                {/* Payment */}
                <Card className="p-6">
                    <h3 className="font-semibold text-black mb-4">Payment Details</h3>

                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-700">Total (USD)</span>
                            <span className="font-bold text-black">{formatUSD(usdPrice)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Total (SOL)</span>
                            <span className="font-bold text-primary-blue">{formatSOL(solPrice)}</span>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={handlePayment}
                        disabled={processing}
                    >
                        {processing ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>Upgrade to {planDetails.name}</>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-text mt-4">
                        By clicking above, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </Card>
            </div>
        </div>
    );
}
