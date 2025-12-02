import React from 'react';

interface GradientHeadingProps {
  firstLine: string;
  secondLine: string;
  className?: string;
}

export function GradientHeading({ firstLine, secondLine, className = '' }: GradientHeadingProps) {
  return (
    <h1 className={`font-bold text-center ${className}`}>
      <div className="inline-block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-10">
        {firstLine}
      </div>
      <div className="inline-block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent pt-2 pb-4">
        {secondLine}
      </div>
    </h1>
  );
} 