'use client';

import { checkYoutubeConnection, getSocketToken } from '@/lib/donationAlertsApi';
import { useStore } from '@/store/useStore';
import { CheckCircle2, Eye, EyeOff, Loader2, Plus, Save, Settings, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function SettingsDashboard() {
  const store = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  
  const [testingYt, setTestingYt] = useState(false);
  const [testingDa, setTestingDa] = useState(false);

  const handleSave = () => {
    setIsOpen(false);
    toast.success('Settings saved successfully');
  };

  const testYoutube = async () => {
      setTestingYt(true);
      try {
          const isValid = await checkYoutubeConnection(store.youtubeApiKey);
          if (isValid) toast.success('YouTube API connection successful');
          else toast.error('YouTube API connection failed');
      } catch {
          toast.error('YouTube API connection error');
      } finally {
          setTestingYt(false);
      }
  };

  const testDonationAlerts = async () => {
      setTestingDa(true);
      try {
          // We test by trying to get the socket token using the access token
          await getSocketToken(store.donationAlertsToken);
          toast.success('DonationAlerts token is valid');
      } catch (e) {
          toast.error('DonationAlerts token invalid or network error');
          console.error(e);
      } finally {
          setTestingDa(false);
      }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-zinc-900 text-white rounded-full shadow-lg hover:bg-zinc-800 transition-all border border-zinc-700 z-50"
      >
        <Settings className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="sticky top-0 bg-zinc-950/90 backdrop-blur p-6 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-500" />
            Control Panel
          </h2>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* API Keys Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-zinc-200">API Configuration</h3>
              <button 
                onClick={() => setShowSecrets(!showSecrets)}
                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
              >
                {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {showSecrets ? 'Hide Secrets' : 'Show Secrets'}
              </button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">YouTube API Key</label>
                <div className="flex gap-2">
                    <input
                    type={showSecrets ? "text" : "password"}
                    value={store.youtubeApiKey}
                    onChange={(e) => store.setSettings({ youtubeApiKey: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="AIza..."
                    />
                    <button 
                        onClick={testYoutube}
                        disabled={testingYt || !store.youtubeApiKey}
                        className="bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
                        title="Test Connection"
                    >
                        {testingYt ? <Loader2 className="w-5 h-5 animate-spin"/> : <CheckCircle2 className="w-5 h-5" />}
                    </button>
                </div>
              </div>
              
              {/* DonationAlerts OAuth Section */}
              <div className="space-y-2 md:col-span-2 grid md:grid-cols-2 gap-4 border border-zinc-800 p-4 rounded-xl bg-zinc-900/30">
                  <div className="md:col-span-2">
                      <h4 className="text-sm font-semibold text-zinc-300 mb-2">DonationAlerts Authorization</h4>
                      <p className="text-xs text-zinc-500 mb-4">Enter your Client ID and Secret to connect. You will be redirected to approve access.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Client ID</label>
                    <input
                       type={showSecrets ? "text" : "password"}
                       value={store.donationAlertsClientId}
                       onChange={(e) => store.setSettings({ donationAlertsClientId: e.target.value })}
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                       placeholder="12345"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Client Secret</label>
                    <input
                       type={showSecrets ? "text" : "password"}
                       value={store.donationAlertsClientSecret}
                       onChange={(e) => store.setSettings({ donationAlertsClientSecret: e.target.value })}
                       className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                       placeholder="Secret..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">DonationAlerts User ID</label>
                    <input
                      type={showSecrets ? "text" : "password"}
                      value={store.donationAlertsUserId}
                      onChange={(e) => store.setSettings({ donationAlertsUserId: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      placeholder="12345"
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex items-center justify-between mt-2">
                       <div className="text-xs text-zinc-500">
                           {store.donationAlertsToken ? (
                               <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Connected (Token Saved)</span>
                           ) : (
                               <span className="text-zinc-600">Not Connected</span>
                           )}
                       </div>
                       <button
                           disabled={!store.donationAlertsClientId || !store.donationAlertsClientSecret}
                           onClick={() => {
                               const redirectUri = `${window.location.protocol}//${window.location.host}`;
                               const scope = 'oauth-donation-subscribe oauth-user-show oauth-custom_alert-store oauth-donation-index';
                               const authUrl = `https://www.donationalerts.com/oauth/authorize?client_id=${encodeURIComponent(store.donationAlertsClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`;
                               window.location.href = authUrl;
                           }}
                           className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                       >
                           Connect DonationAlerts
                       </button>
                  </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Donation X API Key</label>
                <input
                   type={showSecrets ? "text" : "password"}
                   value={store.donationXApiKey}
                   onChange={(e) => store.setSettings({ donationXApiKey: e.target.value })}
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                   placeholder="Key..."
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-zinc-800" />

          {/* Filters Section */}
          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-200">Filters & Thresholds</h3>
             <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Min Donation Amount</label>
                <input
                  type="number"
                  value={store.minDonationAmount}
                  onChange={(e) => store.setSettings({ minDonationAmount: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Min YouYube View Count</label>
                <input
                  type="number"
                  value={store.minViewCount}
                  onChange={(e) => store.setSettings({ minViewCount: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Min YouTube Likes</label>
                <input
                  type="number"
                  value={store.minLikeCount}
                  onChange={(e) => store.setSettings({ minLikeCount: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-zinc-800" />

          {/* Blacklist Section */}
          <section className="space-y-4">
             <h3 className="text-lg font-semibold text-zinc-200">Blacklisted Keywords</h3>
             <div className="flex gap-2">
               <input 
                 className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                 placeholder="e.g. 'cringe', 'banned'"
                 value={newKeyword}
                 onChange={(e) => setNewKeyword(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && newKeyword) {
                     store.addBlacklistedKeyword(newKeyword);
                     setNewKeyword('');
                   }
                 }}
               />
               <button 
                onClick={() => {
                  if (newKeyword) {
                    store.addBlacklistedKeyword(newKeyword);
                    setNewKeyword('');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 transition-colors"
               >
                 <Plus className="w-5 h-5" />
               </button>
             </div>
             <div className="flex flex-wrap gap-2">
               {store.blacklistedKeywords.map((keyword) => (
                 <span key={keyword} className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-300">
                   {keyword}
                   <button onClick={() => store.removeBlacklistedKeyword(keyword)} className="hover:text-red-400">
                     <X className="w-3 h-3" />
                   </button>
                 </span>
               ))}
               {store.blacklistedKeywords.length === 0 && (
                 <p className="text-sm text-zinc-600 italic">No blacklisted keywords.</p>
               )}
             </div>
          </section>
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end">
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
