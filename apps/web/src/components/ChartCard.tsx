import { ReactNode } from 'react';

type Props = {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
};

export function ChartCard({ title, subtitle, children, right }: Props) {
  return (
    <section className="surface-card chart-card">
      <div className="chart-card__header">
        <div>
          <h3 className="chart-card__title">{title}</h3>
          {subtitle ? <p className="text-subtle">{subtitle}</p> : null}
        </div>
        {right}
      </div>
      <div className="chart-card__body">{children}</div>
    </section>
  );
}
