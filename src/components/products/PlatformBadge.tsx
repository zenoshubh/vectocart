import React from 'react';
import { SiAmazon, SiFlipkart } from 'react-icons/si';
import { Store } from 'lucide-react';
import type { ProductPlatform } from '@/types/products';

interface PlatformBadgeProps {
  platform: ProductPlatform;
  className?: string;
  showIcon?: boolean;
}

const platformConfig: Record<ProductPlatform, { name: string; icon: React.ComponentType<{ className?: string }> }> = {
  amazon: {
    name: 'Amazon',
    icon: SiAmazon,
  },
  flipkart: {
    name: 'Flipkart',
    icon: SiFlipkart,
  },
  meesho: {
    name: 'Meesho',
    icon: Store, // Meesho doesn't have a specific icon in react-icons, using Store as fallback
  },
};

export function PlatformBadge({ platform, className = '', showIcon = true }: PlatformBadgeProps) {
  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs text-[#6B7280] bg-[#F8F9FA] px-2 py-0.5 rounded ${className}`}>
      {showIcon && <Icon className="h-3.5 w-3.5" />}
      <span>{config.name}</span>
    </span>
  );
}

export function getPlatformName(platform: ProductPlatform): string {
  return platformConfig[platform].name;
}

export function getPlatformIcon(platform: ProductPlatform): React.ComponentType<{ className?: string }> {
  return platformConfig[platform].icon;
}

