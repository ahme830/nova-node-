import { LucideIcon } from 'lucide-react';
import { Card } from './ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, description, className }: StatCardProps) {
  return (
    <Card className={`p-8 border-border bg-card dark:bg-card/40 backdrop-blur-xl group hover:border-primary/30 transition-all duration-500 overflow-hidden relative shadow-soft ${className}`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 opacity-60">{title}</p>
          <p className="text-4xl font-black text-foreground mb-4 tabular-nums selection:bg-primary/30">{value}</p>

          <div className="flex flex-col gap-2">
            {trend && (
              <div className="flex items-center gap-2">
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${trend.isPositive
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                  {trend.isPositive ? '▲' : '▼'} {trend.value}%
                </div>
                <span className="text-[10px] text-muted-foreground font-mono uppercase opacity-40">vs cycle précédent</span>
              </div>
            )}
            {description && (
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest opacity-40">{description}</p>
            )}
          </div>
        </div>

        <div className="w-14 h-14 bg-muted/20 rounded-2xl flex items-center justify-center border border-border group-hover:border-primary/50 group-hover:bg-primary/10 transition-all transform group-hover:rotate-12 duration-500 shadow-sm">
          <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors" />
        </div>
      </div>
    </Card>
  );
}
