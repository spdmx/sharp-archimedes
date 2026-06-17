import React from 'react';

export function PixelCard({ children, title }: { children: React.ReactNode, title?: string }) {
  return (
    <div className="pixel-border" style={{ marginBottom: '2rem' }}>
      {title && <h2 style={{ textAlign: 'center' }}>{title}</h2>}
      {children}
    </div>
  );
}
