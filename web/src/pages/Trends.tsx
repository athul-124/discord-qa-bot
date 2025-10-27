import { useState, useEffect } from 'react';
import { api, TrendsData } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Loader2, TrendingUp, Clock, MessageSquare, BarChart3 } from 'lucide-react';

export default function Trends() {
  const [trends, setTrends] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [serverId, setServerId] = useState('');
  const [isPro, setIsPro] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    const savedServerId = localStorage.getItem('selectedServerId');
    if (savedServerId) {
      setServerId(savedServerId);
      fetchTrends(savedServerId);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTrends = async (serverIdToFetch: string) => {
    setLoading(true);
    try {
      const data = await api.getTrends(serverIdToFetch);
      setTrends(data);
      setIsPro(true);
    } catch (error: any) {
      if (error.message.includes('Pro')) {
        setIsPro(false);
        addToast('warning', 'Trends feature is only available for Pro tier subscribers');
      } else {
        addToast('error', error.message || 'Failed to fetch trends data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleServerIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (serverId) {
      localStorage.setItem('selectedServerId', serverId);
      fetchTrends(serverId);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!serverId) {
    return (
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Server</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enter your Discord server ID to view trends and insights
          </p>
          <form onSubmit={handleServerIdSubmit}>
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

  if (!isPro) {
    return (
      <div>
        <div className="px-4 sm:px-0 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Trends & Insights</h1>
          <p className="mt-1 text-sm text-gray-600">
            Advanced analytics for your bot usage
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <TrendingUp className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Pro Feature</h2>
          <p className="text-sm text-gray-600 mb-4">
            Trends and Insights are available exclusively for Pro tier subscribers.
          </p>
          <p className="text-sm text-gray-600">
            Upgrade to Pro to access detailed analytics, usage trends, and topic insights.
          </p>
        </div>
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="text-center text-gray-600">
        No trends data available
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 sm:px-0 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trends & Insights</h1>
        <p className="mt-1 text-sm text-gray-600">
          Detailed analytics and usage patterns for your bot
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Questions
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {trends.totalQuestions}
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
                <Clock className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Response Time
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {trends.averageResponseTime}ms
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
                <BarChart3 className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Top Topics
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {trends.topTopics.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Top Topics</h2>
          <div className="space-y-3">
            {trends.topTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{topic.topic}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${(topic.count / trends.topTopics[0].count) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{topic.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Usage</h2>
          <div className="space-y-2">
            {trends.dailyUsage.slice(0, 7).map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{day.date}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${(day.count / Math.max(...trends.dailyUsage.map(d => d.count))) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">{day.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
