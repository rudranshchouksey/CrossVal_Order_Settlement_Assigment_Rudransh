import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'
import { OrderStatus } from '@/lib/calculations'

export function StatusBadge({ status }: { status: OrderStatus }) {
  const styles = {
    pending: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200',
    partially_paid: 'bg-amber-50 text-amber-900 hover:bg-amber-100 border-amber-200',
    paid: 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border-emerald-200',
    overdue: 'bg-rose-50 text-rose-900 hover:bg-rose-100 border-rose-200 flex items-center gap-1',
  }
  
  const labels = {
    pending: 'Pending',
    partially_paid: 'Partially Paid',
    paid: 'Paid',
    overdue: (
      <>
        <AlertTriangle className="w-3 h-3" />
        Overdue
      </>
    ),
  }
  
  return (
    <Badge className={`font-medium ${styles[status]}`} variant="outline">
      {labels[status]}
    </Badge>
  )
}
