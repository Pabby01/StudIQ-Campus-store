/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Check, Sparkles, ShoppingBag, Store, Gift, Lock, Shield } from "lucide-react";
import Button from "@/components/ui/Button";
import { useUser } from "@civic/auth-web3/react";

type Step = {
  title: string;
  description: string;
  icon?: React.ReactNode;
  image?: string;
};

const steps: Step[] = [
  {
    title: "Welcome to StudIQ",
    description: "The decentralized campus marketplace built for students. Buy, sell, and earn with crypto securely.",
    icon: <Sparkles className="w-12 h-12 text-yellow-400" />,
  },
  {
    title: "Connect Your Wallet",
    description: "Use your Civic Wallet to sign in instantly. No passwords needed, just secure blockchain authentication.",
    icon: <Lock className="w-12 h-12 text-orange-600" />,
  },
  {
    title: "Browse Campus Stores",
    description: "Find textbooks, gadgets, and services from students on your campus. Filter by location and category.",
    icon: <ShoppingBag className="w-12 h-12 text-blue-600" />,
  },
  {
    title: "Start Selling Today",
    description: "Create your own store in seconds. Upload products, set prices in SOL/USDC, and reach thousands of students.",
    icon: <Store className="w-12 h-12 text-green-600" />,
  },
  {
    title: "Secure Payments",
    description: "Funds are held in escrow until you confirm delivery. Safe, transparent, and trustless transactions.",
    icon: <Shield className="w-12 h-12 text-purple-600" />,
  },
  {
    title: "Earn Rewards",
    description: "Get points for every purchase and referral. Climb the leaderboard and unlock exclusive perks.",
    icon: <Gift className="w-12 h-12 text-pink-600" />,
  },
];

export default function WelcomeTour() {
  const { user, isLoading } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Only show to authenticated users who haven't seen the tour
    if (isLoading || !user) return;
    const hasSeenTour = localStorage.getItem("studiq_welcome_tour_seen");
    if (!hasSeenTour) {
      // Small delay to allow initial load animations to finish
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("studiq_welcome_tour_seen", "true");
  };

  const handleSkip = () => {
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden relative"
          >
            {/* Header / Image Area */}
            <div className="bg-gradient-to-br from-primary-blue to-purple-600 h-48 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-50 pattern-grid-lg"></div>
              <motion.div
                key={currentStep}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative z-10 p-6 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg border border-white/20"
              >
                {steps[currentStep].icon}
              </motion.div>
              
              <button 
                onClick={handleSkip}
                className="absolute top-4 right-4 text-white/80 hover:text-white text-sm font-medium px-3 py-1 rounded-full hover:bg-white/10 transition-colors"
              >
                Skip
              </button>
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-slate-900 mb-3">
                  {steps[currentStep].title}
                </h2>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </motion.div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2 mb-8">
                {steps.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentStep ? "w-8 bg-primary-blue" : "w-2 bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  className={`rounded-xl px-4 ${currentStep === 0 ? 'opacity-0 pointer-events-none' : ''}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>

                <Button
                  variant="primary"
                  onClick={handleNext}
                  className="flex-1 rounded-xl py-3 text-base shadow-lg shadow-primary-blue/20"
                >
                  {currentStep === steps.length - 1 ? (
                    <span className="flex items-center gap-2">
                      Get Started <Check className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Next <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
