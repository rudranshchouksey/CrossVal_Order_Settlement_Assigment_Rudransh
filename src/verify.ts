import 'dotenv/config'
import prisma from './lib/prisma'
import { listOrders } from './services/orders'

async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'demo@example.com' } })
  if (!user) {
    throw new Error('Demo user not found')
  }

  const orders = await listOrders(user.id)
  
  console.log(`Total Orders: ${orders.length}`)

  for (const o of orders) {
    const totalPayments = o.payments.reduce((sum, p) => sum + p.amount, 0)
    
    let actualStatus = 'pending'
    if (totalPayments >= o.orderTotal && o.orderTotal > 0) {
      actualStatus = 'paid'
    } else if (o.dueDate < new Date()) {
      actualStatus = 'overdue'
    } else if (totalPayments > 0) {
      actualStatus = 'partially_paid'
    }

    console.log(`---
Order: ${o.customer}
Due: ${o.dueDate.toISOString().substring(0, 10)}
Subtotal (cents): ${o.subtotal}
Total (cents): ${o.orderTotal}
Paid (cents): ${totalPayments}
Status: ${actualStatus}
`)
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
  })
