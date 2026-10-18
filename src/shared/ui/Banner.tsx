import type { ReactNode } from 'react';

export function Stale({ children }: { children: ReactNode }) {
  return <div className="stale">{children}</div>;
}
export function Notice({ children }: { children: ReactNode }) {
  return <div className="notice">{children}</div>;
}
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="tablecard">
      <div className="empty">{children}</div>
    </div>
  );
}
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}
export function PageError({ children }: { children: ReactNode }) {
  return <div className="page-error">{children}</div>;
}
