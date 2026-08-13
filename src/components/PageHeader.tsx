import { type ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 pt-2 sm:pt-0">{actions}</div>}
    </div>
  )
}
