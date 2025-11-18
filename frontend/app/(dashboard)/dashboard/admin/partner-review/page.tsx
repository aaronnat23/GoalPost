'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Eye, Globe, Shield, Calendar } from 'lucide-react';

interface PartnerRequest {
  id: string;
  orgId: string;
  orgName: string;
  domainsAllowed: string[];
  rules: {
    maxLinksPerArticle?: number;
    topicalCategories?: string[];
    autoApprove?: boolean;
  };
  active: boolean;
  createdAt: string;
}

export default function PartnerReviewPage() {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch('/api/admin/partners/review');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch partner requests:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      const res = await fetch(`/api/admin/partners/${id}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchRequests();
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  }

  async function handleReject(id: string) {
    try {
      const res = await fetch(`/api/admin/partners/${id}/reject`, {
        method: 'POST',
      });
      if (res.ok) {
        await fetchRequests();
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  }

  const filteredRequests = requests.filter(req => {
    if (filter === 'pending') return !req.active;
    if (filter === 'approved') return req.active;
    return true;
  });

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading partner requests...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Partner Review Queue</h1>
        <p className="text-gray-600">
          Review and approve partner opt-in requests for ethical backlink network
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          All ({requests.length})
        </Button>
        <Button
          variant={filter === 'pending' ? 'default' : 'outline'}
          onClick={() => setFilter('pending')}
        >
          Pending ({requests.filter(r => !r.active).length})
        </Button>
        <Button
          variant={filter === 'approved' ? 'default' : 'outline'}
          onClick={() => setFilter('approved')}
        >
          Approved ({requests.filter(r => r.active).length})
        </Button>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No partner requests found</p>
          </Card>
        ) : (
          filteredRequests.map(request => (
            <Card key={request.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">{request.orgName}</h3>
                    {request.active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Approved
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                        Pending Review
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Domains */}
                    <div className="flex items-start gap-2">
                      <Globe className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Domains</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {request.domainsAllowed.map((domain, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                            >
                              {domain}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Rules */}
                    <div className="flex items-start gap-2">
                      <Shield className="w-4 h-4 text-gray-400 mt-1" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Rules</p>
                        <ul className="text-sm text-gray-600 mt-1 space-y-1">
                          {request.rules.maxLinksPerArticle && (
                            <li>• Max links per article: {request.rules.maxLinksPerArticle}</li>
                          )}
                          {request.rules.topicalCategories && request.rules.topicalCategories.length > 0 && (
                            <li>• Categories: {request.rules.topicalCategories.join(', ')}</li>
                          )}
                          {request.rules.autoApprove && (
                            <li>• Auto-approve enabled</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!request.active && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleApprove(request.id)}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(request.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
