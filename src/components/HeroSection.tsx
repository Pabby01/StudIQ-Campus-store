import Link from "next/link";
import { ArrowRight, TrendingUp, Shield, Zap } from "lucide-react";
import Button from "@/components/ui/Button";

export default function HeroSection() {
    return (
        <div className="relative bg-gradient-to-br from-white via-blue-50 to-white overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-primary-blue rounded-full text-sm font-medium">
                                <Zap className="w-4 h-4" />
                                Campus Marketplace
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black leading-tight">
                                Shop Campus,
                                <br />
                                <span className="text-primary-blue">Pay with Solana</span>
                            </h1>
                            <p className="text-lg text-muted-text max-w-lg">
                                Discover nearby stores, earn rewards, and complete purchases using cryptocurrency on the Solana blockchain.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            <Link href="/search">
                                <Button variant="primary" size="lg">
                                    Browse Products
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                            <Link href="/stores">
                                <Button variant="secondary" size="lg">
                                    Explore Stores
                                </Button>
                            </Link>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-3 gap-4 pt-8">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-primary-blue">
                                    <Shield className="w-5 h-5" />
                                    <span className="font-semibold">Secure</span>
                                </div>
                                <p className="text-xs text-muted-text">Blockchain payments</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-primary-blue">
                                    <TrendingUp className="w-5 h-5" />
                                    <span className="font-semibold">Rewards</span>
                                </div>
                                <p className="text-xs text-muted-text">Earn points</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-primary-blue">
                                    <Zap className="w-5 h-5" />
                                    <span className="font-semibold">Fast</span>
                                </div>
                                <p className="text-xs text-muted-text">Instant checkout</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Visual */}
                    <div className="hidden lg:block">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-blue to-accent-blue rounded-3xl transform rotate-3 opacity-10"></div>
                            <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-border-gray">
                                <div className="space-y-4">
                                    <div className="h-32 bg-gradient-to-br from-primary-blue to-accent-blue rounded-xl"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-soft-gray-bg rounded w-3/4"></div>
                                        <div className="h-4 bg-soft-gray-bg rounded w-1/2"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-10 bg-primary-blue rounded-lg flex-1"></div>
                                        <div className="h-10 bg-soft-gray-bg rounded-lg w-20"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
