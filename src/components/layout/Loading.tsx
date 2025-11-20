import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  /**
   * Custom text to display below the loader
   * @default "Loading..."
   */
  text?: string;
  /**
   * Optional subtitle text below the main text
   */
  subtitle?: string;
  /**
   * Size of the loader
   * @default "default"
   */
  size?: 'sm' | 'default' | 'lg';
  /**
   * Whether to show the full screen overlay
   * @default true
   */
  fullScreen?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
}

export function Loading({
  text = 'Loading...',
  subtitle,
  size = 'default',
  fullScreen = true,
  className,
}: LoadingProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    default: 'text-sm',
    lg: 'text-base',
  };

  const content = (
    <div className={`flex flex-col items-center gap-4 ${className || ''}`}>
      <div className="relative">
        {/* Animated gradient background circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#E40046] via-[#CC003F] to-[#B00037] opacity-20 animate-pulse" />
        {/* Spinner */}
        <Loader2
          className={`${sizeClasses[size]} text-[#E40046] animate-spin relative z-10`}
          strokeWidth={2.5}
        />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className={`${textSizeClasses[size]} font-medium text-[#111827]`}>{text}</p>
        {subtitle && (
          <p className={`${textSizeClasses[size === 'lg' ? 'default' : 'sm']} text-[#6B7280]`}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-dvh bg-white flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

