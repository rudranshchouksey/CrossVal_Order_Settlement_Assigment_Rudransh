import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface KpiCardProps {
  label: string
  value: string
  description?: string
  icon?: ReactNode
  accent?: 'default' | 'success' | 'warning' | 'destructive' | 'info'
}

const accentStyles = {
  default: 'text-muted-foreground',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  info: 'text-info',
} as const

export function KpiCard({ label, value, description, icon, accent = 'default' }: KpiCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 transition-colors">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && (
          <div className={cn('h-4 w-4', accentStyles[accent])}>
            {icon}
          </div>
        )}
      </div>
      <p className={cn('mt-2 text-2xl font-semibold tabular-nums tracking-tight', accent !== 'default' ? accentStyles[accent] : 'text-foreground')}>
        {value}
      </p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
