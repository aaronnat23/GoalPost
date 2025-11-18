'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard, Plus, Search } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  owner: {
    email: string;
  };
  creditWallet: {
    balance: number;
    lifetimeSpent: number;
  } | null;
}

export default function AdminCreditsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [grantAmount, setGrantAmount] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  async function fetchOrganizations() {
    try {
      const res = await fetch('/api/admin/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrgs(data.organizations || []);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGrant() {
    if (!selectedOrg || !grantAmount) return;

    setGranting(true);
    try {
      const res = await fetch('/api/admin/credits/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: selectedOrg,
          credits: parseInt(grantAmount),
          reason: grantReason || 'Manual admin grant',
        }),
      });

      if (res.ok) {
        alert('Credits granted successfully');
        setSelectedOrg(null);
        setGrantAmount('');
        setGrantReason('');
        await fetchOrganizations();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to grant credits');
      }
    } catch (error) {
      console.error('Failed to grant credits:', error);
      alert('Failed to grant credits');
    } finally {
      setGranting(false);
    }
  }

  const filteredOrgs = orgs.filter(
    org =>
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.owner.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading organizations...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Credit Management</h1>
        <p className="text-gray-600">Grant credits to organizations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizations List */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search organizations..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredOrgs.map(org => (
              <Card
                key={org.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedOrg === org.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedOrg(org.id)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{org.name}</h3>
                    <p className="text-sm text-gray-600">{org.owner.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Balance</p>
                    <p className="text-xl font-bold text-green-600">
                      {org.creditWallet?.balance.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-gray-500">
                      {org.creditWallet?.lifetimeSpent.toLocaleString() || 0} spent
                    </p>
                  </div>
                </div>
              </Card>
            ))}

            {filteredOrgs.length === 0 && (
              <Card className="p-12 text-center">
                <p className="text-gray-500">No organizations found</p>
              </Card>
            )}
          </div>
        </div>

        {/* Grant Form */}
        <div>
          <Card className="p-6 sticky top-4">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Grant Credits
            </h2>

            {selectedOrg ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    placeholder="Enter credits amount"
                    value={grantAmount}
                    onChange={e => setGrantAmount(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Input
                    id="reason"
                    type="text"
                    placeholder="e.g., Compensation for issue"
                    value={grantReason}
                    onChange={e => setGrantReason(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleGrant}
                  disabled={!grantAmount || granting}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {granting ? 'Granting...' : 'Grant Credits'}
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">Select an organization to grant credits</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
