import React from 'react';
import { CheckCircle, Shield, Award, Zap } from 'lucide-react';

export type VerificationBadgeType = 
  | 'premium'
  | 'verified'
  | 'trusted'
  | 'top_seller'
  | 'fast_responder';

interface SellerVerificationBadgeProps {
  badges: VerificationBadgeType[];
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const badgeConfig: Record<VerificationBadgeType, {
  icon: React.ReactNode;
  label: string;
  color: string;
  tooltip: string;
}> = {
  premium: {
    icon: <Award size={12} />,
    label: 'Premium',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    tooltip: 'Premium seller - reliable and trustworthy',
  },
  verified: {
    icon: <CheckCircle size={12} />,
    label: 'Verified',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    tooltip: 'Identity verified - campus account confirmed',
  },
  trusted: {
    icon: <Shield size={12} />,
    label: 'Trusted',
    color: 'bg-green-100 text-green-700 border-green-300',
    tooltip: 'High reputation - excellent buyer feedback',
  },
  top_seller: {
    icon: <Zap size={12} />,
    label: 'Top Seller',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    tooltip: 'Top performer - most sales & positive reviews',
  },
  fast_responder: {
    icon: <CheckCircle size={12} />,
    label: 'Fast Responder',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    tooltip: 'Responds quickly to buyer inquiries',
  },
};

export const SellerVerificationBadge: React.FC<SellerVerificationBadgeProps> = ({
  badges,
  size = 'sm',
  showTooltip = false,
}) => {
  if (!badges || badges.length === 0) return null;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-1',
    md: 'px-2 py-1 text-xs gap-1.5',
    lg: 'px-3 py-1.5 text-sm gap-2',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {badges.map((badge) => {
        const config = badgeConfig[badge];
        return (
          <div
            key={badge}
            className={`relative group inline-flex items-center rounded-full border ${config.color} ${sizeClasses[size]} font-medium transition-all hover:shadow-md`}
            title={showTooltip ? config.tooltip : undefined}
          >
            {config.icon}
            <span className="hidden sm:inline">{config.label}</span>
            
            {/* Tooltip on hover */}
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {config.tooltip}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
