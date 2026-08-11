import prisma from '../lib/prisma'

export const db = {
  ...prisma,
  
  order: {
    ...prisma.order,
    
    // Scoped order query requiring ownership
    findUniqueOwned: async (id: string, userId: string) => {
      return prisma.order.findUnique({
        where: {
          id,
          userId,
        },
        include: {
          items: true,
          payments: true,
        },
      })
    },

    // Scoped list query requiring ownership
    findManyOwned: async (userId: string) => {
      return prisma.order.findMany({
        where: { userId },
        include: {
          payments: true, // often needed to calculate status/totals
        },
        orderBy: { createdAt: 'desc' },
      })
    },
  },
}
