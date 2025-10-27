import { useState } from 'react';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { Link2, Loader2, CheckCircle } from 'lucide-react';

export default function LinkServer() {
  const [whopToken, setWhopToken] = useState('');
  const [serverId, setServerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkResult, setLinkResult] = useState<{ tier: string; message: string } | null>(null);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLinkResult(null);

    try {
      const result = await api.linkServer({ whopToken, serverId });
      setLinkResult({ tier: result.tier, message: result.message });
      addToast('success', 'Server linked successfully!');
      localStorage.setItem('selectedServerId', serverId);
    } catch (error: any) {
      addToast('error', error.message || 'Failed to link server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="px-4 sm:px-0 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Link Server</h1>
        <p className="mt-1 text-sm text-gray-600">
          Connect your Discord server with your Whop subscription
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="serverId" className="block text-sm font-medium text-gray-700 mb-2">
                Discord Server ID
              </label>
              <input
                type="text"
                id="serverId"
                value={serverId}
                onChange={(e) => setServerId(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your Discord Server ID"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                You can find your server ID in Discord by enabling Developer Mode and right-clicking on your server
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="whopToken" className="block text-sm font-medium text-gray-700 mb-2">
                Whop Token
              </label>
              <input
                type="text"
                id="whopToken"
                value={whopToken}
                onChange={(e) => setWhopToken(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter your Whop authentication token"
                required
              />
              <p className="mt-2 text-xs text-gray-500">
                Your Whop token is provided when you purchase a subscription
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Link2 className="w-5 h-5 mr-2" />
                  Link Server
                </>
              )}
            </button>
          </form>

          {linkResult && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Server Linked Successfully
                  </h3>
                  <p className="mt-2 text-sm text-green-700">{linkResult.message}</p>
                  <div className="mt-3 flex items-center">
                    <span className="text-sm font-medium text-green-800">Subscription Tier:</span>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 capitalize">
                      {linkResult.tier}
                    </span>
                  </div>
                  {linkResult.tier === 'pro' && (
                    <p className="mt-2 text-sm text-green-700">
                      🎉 You now have access to Pro features including advanced trends and insights!
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Need Help?</h3>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
            <li>Make sure you have a valid Whop subscription</li>
            <li>Ensure your Discord server ID is correct</li>
            <li>The bot must be invited to your server before linking</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
