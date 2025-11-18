'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Loader2, CreditCard } from 'lucide-react';

interface CreditPackage {
  id: string;
  name: string;
  creditsAmount: number;
  priceUsd: number;
  isActive: boolean;
}

export default function BuyCreditsPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPackages();
  }, []);

  async function fetchPackages() {
    try {
      const res = await fetch('/api/credits/packages');
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase(packageId: string) {
    setPurchasing(packageId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Redirect to Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create checkout session');
        setPurchasing(null);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to initiate purchase');
      setPurchasing(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading credit packages...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Buy Credits</h1>
        <p className="text-gray-600">
          Choose a credit package to power your SEO content workflows
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => {
          const perCreditCost = (pkg.priceUsd / pkg.creditsAmount).toFixed(3);
          const isPopular = pkg.name === 'Professional';

          return (
            <Card
              key={pkg.id}
              className={`p-6 relative ${
                isPopular ? 'border-blue-500 border-2' : ''
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="mb-1">
                  <span className="text-4xl font-bold">${pkg.priceUsd}</span>
                </div>
                <p className="text-gray-600 text-sm">
                  {pkg.creditsAmount.toLocaleString()} credits
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  ${perCreditCost}/credit
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>{pkg.creditsAmount} credits</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>AI content generation</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>SEO scoring</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Unlimited exports</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>No expiration</span>
                </li>
              </ul>

              <Button
                className="w-full"
                variant={isPopular ? 'default' : 'outline'}
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing === pkg.id}
              >
                {purchasing === pkg.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Purchase
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">How Credits Work</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• Credits are pay-as-you-go with no monthly fees</li>
          <li>• Each action (keyword fetch, draft generation, etc.) costs credits</li>
          <li>• Credits never expire</li>
          <li>• Transparent pricing - see costs before each action</li>
          <li>• Secure payment powered by Stripe</li>
        </ul>
      </div>
    </div>
  );
}
