import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle2, Clock, CreditCard } from 'lucide-react'
import { OrderStatus } from '@/lib/calculations'
import { cn } from '@/lib/utils'

const config: Record<OrderStatus, {
  label: string
  dotClass: string
  badgeClass: string
  Icon: typeof Clock
}> = {
  pending: {
    label: 'Pending',
    dotClass: 'bg-status-pending-dot',
    badgeClass: 'bg-status-pending-bg text-status-pending-text border-status-pending-border',
    Icon: Clock,
  },
  partially_paid: {
    label: 'Partially Paid',
    dotClass: 'bg-status-partial-dot',
    badgeClass: 'bg-status-partial-bg text-status-partial-text border-status-partial-border',
    Icon: CreditCard,
  },
  paid: {
    label: 'Paid',
    dotClass: 'bg-status-paid-dot',
    badgeClass: 'bg-status-paid-bg text-status-paid-text border-status-paid-border',
    Icon: CheckCircle2,
  },
  overdue: {
    label: 'Overdue',
    dotClass: 'bg-status-overdue-dot',
    badgeClass: 'bg-status-overdue-bg text-status-overdue-text border-status-overdue-border',
    Icon: AlertTriangle,
  },
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { label, dotClass, badgeClass, Icon } = config[status]
  return (
    <Badge
      className={cn('inline-flex items-center gap-1.5 font-medium', badgeClass)}
      variant="outline"
    >
      <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dotClass)} aria-hidden="true" />
      {status === 'overdue' && <Icon className="h-3 w-3" aria-hidden="true" />}
      {label}
    </Badge>
  )
}
