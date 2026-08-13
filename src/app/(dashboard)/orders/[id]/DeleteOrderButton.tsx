'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete order')
      }
      router.push('/orders')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        {error && <span className="text-xs text-destructive mr-1">{error}</span>}
        <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={deleting}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
          {deleting ? (
            <>
              <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Deleting…
            </>
          ) : (
            'Confirm Delete'
          )}
        </Button>
      </div>
    )
  }

  return (
    <Button variant="ghost" size="default" onClick={() => setConfirming(true)} className="text-muted-foreground hover:text-destructive">
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
