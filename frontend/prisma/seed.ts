import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('[seed] Seeding database...')

  // Seed credit packages
  const packages = await prisma.creditPackage.createMany({
    data: [
      {
        name: 'Starter',
        creditsAmount: 300,
        priceUsd: 15.00,
        isActive: true,
      },
      {
        name: 'Professional',
        creditsAmount: 1200,
        priceUsd: 49.00,
        isActive: true,
      },
      {
        name: 'Enterprise',
        creditsAmount: 5000,
        priceUsd: 199.00,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  })

  console.log(`[seed] Created ${packages.count} credit packages`)

  // Seed pricing matrix
  const pricingMatrix = await prisma.pricingMatrix.createMany({
    data: [
      {
        action: 'KEYWORD_FETCH',
        creditsPerUnit: 5,
        minCharge: 1,
        description: 'Per 50 keywords fetched',
        isActive: true,
      },
      {
        action: 'CLUSTER',
        creditsPerUnit: 10,
        minCharge: 5,
        description: 'Per 100 keywords clustered',
        isActive: true,
      },
      {
        action: 'OUTLINE',
        creditsPerUnit: 5,
        minCharge: 5,
        description: 'Per outline generated',
        isActive: true,
      },
      {
        action: 'DRAFT',
        creditsPerUnit: 15,
        minCharge: 15,
        description: 'Per 1000 words generated',
        isActive: true,
      },
      {
        action: 'SEO_SCORE',
        creditsPerUnit: 2,
        minCharge: 2,
        description: 'Per SEO analysis',
        isActive: true,
      },
      {
        action: 'LINK_UPDATE',
        creditsPerUnit: 3,
        minCharge: 3,
        description: 'Per 10 links computed',
        isActive: true,
      },
      {
        action: 'EXPORT',
        creditsPerUnit: 1,
        minCharge: 1,
        description: 'Per file exported',
        isActive: true,
      },
    ],
    skipDuplicates: true,
  })

  console.log(`[seed] Created ${pricingMatrix.count} pricing rules`)

  console.log('[seed] Seeding complete!')
}

main()
  .catch((e) => {
    console.error('[seed] Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
