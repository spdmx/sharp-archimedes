import React from 'react';

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function PixelButton({ children, ...props }: PixelButtonProps) {
  return (
    <button className="pixel-button" {...props}>
      {children}
    </button>
  );
}
