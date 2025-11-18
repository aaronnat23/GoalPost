import { getCurrentUser } from '@/lib/auth/session'
import prisma from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function CreditsPage() {
  const user = await getCurrentUser()
  const orgId = user.ownedOrgs[0]?.id || user.orgMemberships[0]?.org.id

  const [wallet, transactions, packages] = await Promise.all([
    prisma.creditWallet.findUnique({
      where: { orgId },
    }),
    prisma.creditTxn.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { priceUsd: 'asc' },
    }),
  ])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      PURCHASE: 'Purchase',
      REFUND: 'Refund',
      USAGE: 'Usage',
      ADMIN_GRANT: 'Admin Grant',
      TRIAL_BONUS: 'Trial Bonus',
    }
    return labels[reason] || reason
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Credits</h1>
        <p className="text-gray-500 mt-1">
          Manage your credit balance and purchase history
        </p>
      </div>

      {/* Current Balance */}
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle>Current Balance</CardTitle>
          <CardDescription>Available credits for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-bold text-blue-900">
            {wallet?.balance || 0}
            <span className="text-2xl text-blue-700 ml-2">credits</span>
          </div>
          <div className="mt-4 text-sm text-blue-800">
            Lifetime spent: {wallet?.lifetimeSpent || 0} credits
          </div>
        </CardContent>
      </Card>

      {/* Credit Packages */}
      <div>
        <h2 className="text-xl font-bold mb-4">Purchase Credits</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {packages.length > 0 ? (
            packages.map((pkg) => (
              <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>{pkg.name}</CardTitle>
                  <CardDescription>{pkg.creditsAmount} credits</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ${pkg.priceUsd.toString()}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    ${(Number(pkg.priceUsd) / pkg.creditsAmount).toFixed(3)} per credit
                  </p>
                  <Button className="w-full mt-4" disabled>
                    Purchase (Coming Soon)
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">No credit packages available yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your recent credit transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{getReasonLabel(txn.reason)}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(txn.createdAt)}
                    </div>
                  </div>
                  <div
                    className={`text-lg font-semibold ${
                      txn.delta > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {txn.delta > 0 ? '+' : ''}
                    {txn.delta}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pricing Info */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Costs</CardTitle>
          <CardDescription>How credits are used</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Keyword fetch (per 50 terms)</span>
              <span className="font-medium">5 credits</span>
            </div>
            <div className="flex justify-between">
              <span>Topic clustering (per 100 keywords)</span>
              <span className="font-medium">10 credits</span>
            </div>
            <div className="flex justify-between">
              <span>Content brief generation</span>
              <span className="font-medium">3 credits</span>
            </div>
            <div className="flex justify-between">
              <span>Outline generation</span>
              <span className="font-medium">5 credits</span>
            </div>
            <div className="flex justify-between">
              <span>Draft generation (per 1K words)</span>
              <span className="font-medium">15 credits</span>
            </div>
            <div className="flex justify-between">
              <span>SEO score analysis</span>
              <span className="font-medium">2 credits</span>
            </div>
            <div className="flex justify-between">
              <span>Export (per file)</span>
              <span className="font-medium">1 credit</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
