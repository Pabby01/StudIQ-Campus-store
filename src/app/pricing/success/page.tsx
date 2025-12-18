"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { CheckCircle, Crown, ArrowRight, Loader2 } from "lucide-react";
import { SUBSCRIPTION_PLANS, type PlanName, type BillingCycle } from "@/lib/pricing";

export default function SubscriptionSuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-soft-gray-bg flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
            <SuccessContent />
        </Suspense>
    );
}

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const plan = (searchParams?.get('plan') || 'premium') as PlanName;
    const cycle = (searchParams?.get('cycle') || 'monthly') as BillingCycle;

    const planDetails = SUBSCRIPTION_PLANS[plan];
    const price = planDetails[cycle];

    return (
        <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full p-8 md:p-12 text-center">
                <div className="mb-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-4">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
                        Payment Successful!
                    </h1>
                    <p className="text-lg text-muted-text">
                        Welcome to {planDetails.name}
                        {plan === 'premium' && <Crown className="w-5 h-5 inline ml-2 text-yellow-500" />}
                    </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 mb-8">
                    <h2 className="font-semibold text-black mb-4">Your Subscription Details</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-700">Plan:</span>
                            <span className="font-semibold text-black">{planDetails.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700">Billing:</span>
                            <span className="font-semibold text-black">
                                {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700">Store Limit:</span>
                            <span className="font-semibold text-black">{planDetails.maxStores} stores</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700">Platform Fee:</span>
                            <span className="font-semibold text-black">{planDetails.platformFee}%</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={() => router.push('/dashboard/settings')}
                    >
                        View Subscription Details
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push('/dashboard/store')}
                    >
                        Create Your Store
                    </Button>
                </div>

                <p className="text-xs text-muted-text mt-6">
                    A confirmation has been sent to your wallet. You can manage your subscription anytime in Settings.
                </p>
            </Card>
        </div>
    );
}
