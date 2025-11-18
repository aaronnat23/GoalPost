'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Building2, CreditCard, TrendingUp, Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  totalOrgs: number;
  totalCreditsIssued: number;
  totalCreditsSpent: number;
  activeProjects: number;
  failedJobs: number;
  recentActivity: {
    signups7d: number;
    purchases7d: number;
    draftsGenerated7d: number;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-500">Loading admin dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-red-500">Failed to load admin statistics</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Organizations',
      value: stats.totalOrgs.toLocaleString(),
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Credits Issued',
      value: stats.totalCreditsIssued.toLocaleString(),
      icon: CreditCard,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Credits Spent',
      value: stats.totalCreditsSpent.toLocaleString(),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects.toLocaleString(),
      icon: Activity,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Failed Jobs',
      value: stats.failedJobs.toLocaleString(),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Platform overview and management tools
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Last 7 Days</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">New Signups</p>
            <p className="text-2xl font-bold">{stats.recentActivity.signups7d}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Credit Purchases</p>
            <p className="text-2xl font-bold">{stats.recentActivity.purchases7d}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Drafts Generated</p>
            <p className="text-2xl font-bold">{stats.recentActivity.draftsGenerated7d}</p>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/dashboard/admin/users">
            <Users className="w-5 h-5 mr-2" />
            Manage Users
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/dashboard/admin/organizations">
            <Building2 className="w-5 h-5 mr-2" />
            Manage Orgs
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/dashboard/admin/credits">
            <CreditCard className="w-5 h-5 mr-2" />
            Credit Manager
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/dashboard/admin/partner-review">
            <Activity className="w-5 h-5 mr-2" />
            Partner Review
          </Link>
        </Button>
      </div>
    </div>
  );
}
