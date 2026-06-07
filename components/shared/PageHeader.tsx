import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  highlight?: string;
  sub?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, highlight, sub, actions }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header-text">
        {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
        <h1 className="page-header-title">
          {title}
          {highlight && <> <span className="highlight">/{highlight}</span></>}
        </h1>
        {sub && <p className="page-header-sub">{sub}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </div>
  );
}
