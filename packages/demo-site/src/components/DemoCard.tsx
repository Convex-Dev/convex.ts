import React from "react";

interface DemoCardProps {
  href: string;
  title: string;
  description: string;
  emoji?: string;
  rightAdornment?: React.ReactNode;
}

export default function DemoCard({ href, title, description, emoji = "🚀", rightAdornment }: DemoCardProps) {
  return (
    <a href={href} className="card p-2 hover:bg-surface-light transition-colors duration-50 group demo-card" style={{ display: 'block' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-6xl mr-3 group-hover:scale-110 transition-transform">{emoji}</span>
          <div>
            <h4 className="font-semibold text-primary">{title}</h4>
            <p className="text-sm text-secondary">{description}</p>
          </div>
        </div>
        <div className="flex items-center" style={{ gap: 8 }}>
          {rightAdornment}
        </div>
      </div>
    </a>
  );
}


