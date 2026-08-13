import 'dotenv/config'
import prisma from '../src/lib/prisma'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'demo@example.com'
  const plainPassword = 'Demo@123456'

  // Hash password exactly as the application does
  const salt = await bcrypt.genSalt(10)
  const password = await bcrypt.hash(plainPassword, salt)

  // 1. Upsert demo user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password,
    },
    create: {
      email,
      password,
    },
  })

  // 2. Clean existing demo data to ensure idempotency
  await prisma.order.deleteMany({
    where: {
      userId: user.id,
    },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const addDays = (days: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + days)
    return d
  }

  // 3. Create Orders
  
  // ORDER 1 — PENDING
  // Customer: Acme Corporation
  // Due date: 10 days from today
  // Line items: Website Development (1 x 2500), UI/UX Design (1 x 1000)
  // Total: 3500, No payments.
  await prisma.order.create({
    data: {
      userId: user.id,
      customer: 'Acme Corporation',
      dueDate: addDays(10),
      items: {
        create: [
          { description: 'Website Development', quantity: 1, unitPrice: 250000 },
          { description: 'UI/UX Design', quantity: 1, unitPrice: 100000 },
        ],
      },
    },
  })

  // ORDER 2 — PARTIALLY PAID
  // Customer: Globex Technologies
  // Due date: 15 days from today
  // Line items: Backend Development (2 x 1200), API Integration (1 x 800)
  // Total = 3200, Payments: 1000, 500
  await prisma.order.create({
    data: {
      userId: user.id,
      customer: 'Globex Technologies',
      dueDate: addDays(15),
      items: {
        create: [
          { description: 'Backend Development', quantity: 2, unitPrice: 120000 },
          { description: 'API Integration', quantity: 1, unitPrice: 80000 },
        ],
      },
      payments: {
        create: [
          { amount: 100000, paymentDate: addDays(-5), note: 'Initial payment' },
          { amount: 50000, paymentDate: addDays(-1), note: 'Milestone payment' },
        ],
      },
    },
  })

  // ORDER 3 — PAID
  // Customer: Stark Industries
  // Due date: 20 days from today
  // Line items: Cloud Migration (1 x 5000)
  // Total = 5000, Payment: 5000
  await prisma.order.create({
    data: {
      userId: user.id,
      customer: 'Stark Industries',
      dueDate: addDays(20),
      items: {
        create: [
          { description: 'Cloud Migration', quantity: 1, unitPrice: 500000 },
        ],
      },
      payments: {
        create: [
          { amount: 500000, paymentDate: addDays(-2), note: 'Final payment - paid in full' },
        ],
      },
    },
  })

  // ORDER 4 — OVERDUE
  // Customer: Wayne Enterprises
  // Due date: 10 days in the past
  // Line items: Consulting (10 x 300)
  // Total = 3000, No payments.
  await prisma.order.create({
    data: {
      userId: user.id,
      customer: 'Wayne Enterprises',
      dueDate: addDays(-10),
      items: {
        create: [
          { description: 'Consulting', quantity: 10, unitPrice: 30000 },
        ],
      },
    },
  })

  // ORDER 5 — OVERDUE + PARTIAL PAYMENT
  // Customer: Umbrella Corp
  // Due date: 5 days in the past
  // Line items: Security Assessment (1 x 4000), Security Report (1 x 1000)
  // Total = 5000, Payment: 2000
  await prisma.order.create({
    data: {
      userId: user.id,
      customer: 'Umbrella Corp',
      dueDate: addDays(-5),
      items: {
        create: [
          { description: 'Security Assessment', quantity: 1, unitPrice: 400000 },
          { description: 'Security Report', quantity: 1, unitPrice: 100000 },
        ],
      },
      payments: {
        create: [
          { amount: 200000, paymentDate: addDays(-10), note: 'Initial payment' },
        ],
      },
    },
  })

  // ORDER 6 — MULTIPLE PAYMENTS → PAID
  // Customer: Wayne Tech
  // Due date: 30 days from today
  // Total = 3000, Payments: 500, 750, 750, 1000
  // (Adding one with 3+ line items as requested)
  await prisma.order.create({
    data: {
      userId: user.id,
      customer: 'Wayne Tech',
      dueDate: addDays(30),
      items: {
        create: [
          { description: 'SaaS Development - Core', quantity: 1, unitPrice: 150000 },
          { description: 'SaaS Extensions', quantity: 2, unitPrice: 50000 },
          { description: 'SaaS Support', quantity: 1, unitPrice: 50000 },
        ],
      },
      payments: {
        create: [
          { amount: 50000, paymentDate: addDays(-20), note: 'Initial deposit' },
          { amount: 75000, paymentDate: addDays(-15), note: 'Milestone 1' },
          { amount: 75000, paymentDate: addDays(-10), note: 'Milestone 2' },
          { amount: 100000, paymentDate: addDays(0), note: 'Final payment' },
        ],
      },
    },
  })

  console.log('✅ Seed completed successfully!')
  console.log(`Demo user: ${email} / ${plainPassword}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
