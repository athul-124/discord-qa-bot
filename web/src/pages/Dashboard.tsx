import { useState, useEffect } from 'react';
import { api, UsageData } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Loader2, Activity, TrendingUp, Database } from 'lucide-react';

export default function Dashboard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverId, setServerId] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    const savedServerId = localStorage.getItem('selectedServerId');
    if (savedServerId) {
      setServerId(savedServerId);
      fetchUsage(savedServerId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUsage = async (serverIdToFetch: string) => {
    setLoading(true);
    try {
      const data = await api.getUsage(serverIdToFetch);
      setUsage(data);
    } catch (error: any) {
      addToast('error', error.message || 'Failed to fetch usage data');
    } finally {
      setLoading(false);
    }
  };

  const handleServerIdChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (serverId) {
      localStorage.setItem('selectedServerId', serverId);
      fetchUsage(serverId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!serverId || !usage) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Server</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enter your Discord server ID to view usage statistics
          </p>
          <form onSubmit={handleServerIdChange}>
            <input
              type="text"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              placeholder="Discord Server ID"
              className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm mb-4"
              required
            />
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  const quotaPercentage = (usage.monthlyCount / (usage.monthlyCount + usage.remainingQuota)) * 100;

  return (
    <div>
      <div className="px-4 sm:px-0">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Overview of your bot usage and statistics
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Monthly Usage
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {usage.monthlyCount}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Database className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Remaining Quota
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {usage.remainingQuota}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Subscription Tier
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900 capitalize">
                      {usage.tier}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Usage Progress</h2>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-indigo-600 h-4 rounded-full"
            style={{ width: `${quotaPercentage}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {quotaPercentage.toFixed(1)}% of quota used
        </p>
      </div>
    </div>
  );
}
