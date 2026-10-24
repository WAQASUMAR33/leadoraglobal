"use client";

import { useState, useEffect, useContext } from "react";
import { UserContext } from "../../../lib/userContext";

export default function Referrals() {
  const { user, isAuthenticated } = useContext(UserContext);
  const [referrals, setReferrals] = useState([]);
  const [referralTree, setReferralTree] = useState(null);
  const [treeStats, setTreeStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalEarnings: 0,
    maxLevel: 0
  });
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('tree'); // 'tree' or 'list'

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchReferralData();
    }
  }, [isAuthenticated, user]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);
      
      // Fetch both tree and list data
      const [treeResponse, listResponse] = await Promise.all([
        fetch('/api/user/referral-tree', { credentials: 'include' }),
        fetch('/api/user/referrals', { credentials: 'include' })
      ]);

      if (treeResponse.ok) {
        const treeData = await treeResponse.json();
        setReferralTree(treeData.user);
        setTreeStats(treeData.treeStats);
      }

      if (listResponse.ok) {
        const listData = await listResponse.json();
        setReferralStats(listData.referralStats);
        setReferrals(listData.referrals);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (user?.username) {
      try {
        await navigator.clipboard.writeText(user.username);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const shareReferralLink = () => {
    const referralLink = `${window.location.origin}/signup?ref=${user?.username}`;
    if (navigator.share) {
      navigator.share({
        title: 'Join Ledora Global',
        text: 'Join me on Ledora Global and start earning!',
        url: referralLink,
      });
    } else {
      // Fallback to copying link
      navigator.clipboard.writeText(referralLink);
      alert('Referral link copied to clipboard!');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-gray-400">Please log in to view your referrals.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-2">My Referrals</h1>
        <p className="text-gray-400">Invite friends and earn commissions from their activities</p>
      </div>

      {/* View Mode Toggle */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Referral Network</h2>
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tree View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Network</p>
              <p className="text-2xl font-bold text-white">{treeStats.totalMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Active Members</p>
              <p className="text-2xl font-bold text-white">{treeStats.activeMembers}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Network Earnings</p>
              <p className="text-2xl font-bold text-white">₨{treeStats.totalEarnings.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Tree Depth</p>
              <p className="text-2xl font-bold text-white">Level {treeStats.maxLevel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Code Section */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">Your Referral Code</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Referral Code</label>
            <div className="flex">
              <input
                type="text"
                value={user?.username || "Loading..."}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-l-lg text-white font-mono text-lg"
              />
              <button
                onClick={copyReferralCode}
                className="px-6 py-3 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {copied ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Share this code with friends to earn commissions when they join
            </p>
          </div>
          <div className="md:w-48">
            <button
              onClick={shareReferralLink}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium"
            >
              Share Link
            </button>
          </div>
        </div>
      </div>

      {/* Referral Tree/List View */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">
          {viewMode === 'tree' ? 'Referral Tree' : 'Direct Referrals'}
        </h2>
        
        {viewMode === 'tree' ? (
          <ReferralTreeView user={referralTree} />
        ) : (
          <ReferralListView referrals={referrals} />
        )}
      </div>

      {/* How It Works */}
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-6">How Referrals Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">1</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Share Your Code</h3>
            <p className="text-gray-400 text-sm">Share your unique referral code with friends and family</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">2</span>
            </div>
            <h3 className="text-white font-semibold mb-2">They Join</h3>
            <p className="text-gray-400 text-sm">When they sign up using your code, they become your referral</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">3</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Earn Commissions</h3>
            <p className="text-gray-400 text-sm">Earn commissions from their package subscriptions and purchases</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Referral Tree View Component
function ReferralTreeView({ user }) {
  if (!user) {
    return (
      <div className="text-center py-8">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">Loading tree...</h3>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        <TreeNode node={user} level={0} />
      </div>
    </div>
  );
}

// Individual Tree Node Component
function TreeNode({ node, level }) {
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div className="relative">
      {/* Node */}
      <div className={`flex items-center p-4 mb-2 rounded-lg border ${
        level === 0 
          ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500' 
          : 'bg-gray-700 border-gray-600'
      }`}>
        {/* Level Indicator */}
        <div className="flex-shrink-0 mr-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
            level === 0 
              ? 'bg-white text-blue-600' 
              : 'bg-blue-500 text-white'
          }`}>
            {level}
          </div>
        </div>
        
        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-medium truncate ${
                level === 0 ? 'text-white' : 'text-white'
              }`}>
                {node.name}
              </h3>
              <p className="text-xs text-gray-300">@{node.username}</p>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className={`px-2 py-1 rounded-full ${
                node.status === 'active' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-red-500 text-white'
              }`}>
                {node.status}
              </span>
              <span className="text-gray-300">{node.rank}</span>
              <span className="text-yellow-400">₨{node.balance.toFixed(2)}</span>
            </div>
          </div>
          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-400">
            <span>Package: {node.package}</span>
            <span>Points: {node.points}</span>
            <span>Joined: {new Date(node.joinedDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      {/* Children */}
      {hasChildren && (
        <div className="ml-8 border-l-2 border-gray-600 pl-4">
          {node.children.map((child, index) => (
            <TreeNode key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// Referral List View Component
function ReferralListView({ referrals }) {
  if (referrals.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">No direct referrals yet</h3>
        <p className="text-gray-400">Start sharing your referral code to earn commissions!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Joined</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Package</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Earnings</th>
          </tr>
        </thead>
        <tbody>
          {referrals.map((referral) => (
            <tr key={referral.id} className="border-b border-gray-700">
              <td className="py-3 px-4 text-white">{referral.name}</td>
              <td className="py-3 px-4 text-gray-300">{referral.email}</td>
              <td className="py-3 px-4 text-gray-300">
                {new Date(referral.joinedDate).toLocaleDateString()}
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  referral.status === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {referral.status}
                </span>
              </td>
              <td className="py-3 px-4 text-gray-300">{referral.package}</td>
              <td className="py-3 px-4 text-right text-white font-medium">
                ₨{referral.earnings.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


