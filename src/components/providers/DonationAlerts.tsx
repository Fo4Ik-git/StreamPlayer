import { CheckCircle2, ExternalLink, HelpCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useStore } from '../../store/useStore';

interface DonationAlertsProviderProps {
    showSecrets?: boolean;
}

export default function DonationAlertsProvider({
    showSecrets = false,
}: DonationAlertsProviderProps) {
    const [showInstructions, setShowInstructions] = useState(false);
    const [testingDa, setTestingDa] = useState(false);
    const { t } = useTranslation();
    const store = useStore();

    const testDonationAlerts = async () => {
        setTestingDa(true);
        try {
            // Проверяем подключение через Eel
            const credentials = {
                client_id: store.donationAlertsClientId,
                client_secret: store.donationAlertsClientSecret,
                access_token: store.donationAlertsToken || undefined,
            };

            const result = await window.eel.test_da_connection(credentials)();

            console.log('DonationAlerts test result:', result);

            if (result.success) {
                if (result.data?.user_id) {
                    toast.success(
                        `Connected as: ${result.data.name || 'User'}`
                    );
                } else {
                    toast.success(result.message);
                }
            } else {
                toast.error(result.message || 'Connection test failed');
            }
        } catch (e) {
            console.error('DonationAlerts test error:', e);
            toast.error('Connection test error');
        } finally {
            setTestingDa(false);
        }
    };

    return (
        <div className="space-y-2 md:col-span-2 grid md:grid-cols-2 gap-4 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/30">
            <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">
                            DonationAlerts Authorization
                        </h4>
                        <p className="text-xs text-zinc-500">
                            Connect your account to receive donations and
                            alerts.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowInstructions(!showInstructions)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            showInstructions
                                ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50'
                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
                        }`}
                    >
                        <HelpCircle className="w-3.5 h-3.5" />
                        {showInstructions
                            ? 'Hide Guide'
                            : 'How to get credentials?'}
                    </button>
                </div>

                {showInstructions && (
                    <div className="relative overflow-hidden bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                        {/* Декоративная иконка на фоне */}
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] dark:opacity-[0.03] scale-150 rotate-12 pointer-events-none">
                            <HelpCircle className="w-24 h-24 text-indigo-600 dark:text-indigo-500" />
                        </div>

                        <div className="space-y-3 relative">
                            {[
                                {
                                    step: 1,
                                    text: 'Go to your',
                                    link: 'DonationAlerts Applications',
                                    url: 'https://www.donationalerts.com/application/clients',
                                    sub: 'You may need to log in first.',
                                },
                                {
                                    step: 2,
                                    text: 'Click',
                                    highlight: 'Create New Application',
                                    sub: 'Fill in the name and description as you like.',
                                },
                                {
                                    step: 3,
                                    text: 'Set',
                                    highlight: 'Redirect URI',
                                    code: `${window.location.protocol}//${window.location.host}`,
                                    sub: 'This is required for the application to work.',
                                },
                                {
                                    step: 4,
                                    text: 'Click',
                                    highlight: 'Save',
                                    sub: 'Copy the Client ID and Client Secret from the next screen.',
                                },
                            ].map((item: any) => (
                                <div key={item.step} className="flex gap-3">
                                    {/* Кружок с номером шага */}
                                    <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                        {item.step}
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                            {item.text}{' '}
                                            {item.link && (
                                                <a
                                                    href={item.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                                                >
                                                    {item.link}{' '}
                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                </a>
                                            )}
                                            {item.highlight && (
                                                <span className="text-zinc-950 dark:text-white font-semibold">
                                                    "{item.highlight}"
                                                </span>
                                            )}
                                            {item.code && (
                                                <code className="mx-1 px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded text-[10px] font-mono text-indigo-700 dark:text-indigo-300">
                                                    {item.code}
                                                </code>
                                            )}
                                        </p>
                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
                                            {item.sub}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {t('settings.client_id')}
                </label>
                <input
                    type={showSecrets ? 'text' : 'password'}
                    value={store.donationAlertsClientId}
                    onChange={(e) =>
                        store.setSettings({
                            donationAlertsClientId: e.target.value,
                        })
                    }
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="12345"
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {t('settings.client_secret')}
                </label>
                <input
                    type={showSecrets ? 'text' : 'password'}
                    value={store.donationAlertsClientSecret}
                    onChange={(e) =>
                        store.setSettings({
                            donationAlertsClientSecret: e.target.value,
                        })
                    }
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="Secret..."
                />
            </div>
            {/* <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                    {t('settings.user_id')}
                </label>
                <input
                    type={showSecrets ? 'text' : 'password'}
                    value={store.donationAlertsUserId}
                    onChange={(e) =>
                        store.setSettings({
                            donationAlertsUserId: e.target.value,
                        })
                    }
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="12345"
                />
            </div> */}

            <div className="md:col-span-2 flex items-center justify-between mt-2">
                <div className="text-xs text-zinc-500">
                    {store.donationAlertsToken ? (
                        <span className="text-green-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Connected
                            (Token Saved)
                        </span>
                    ) : (
                        <span className="text-zinc-600">Not Connected</span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={testDonationAlerts}
                        disabled={
                            testingDa ||
                            !store.donationAlertsClientId ||
                            !store.donationAlertsClientSecret
                        }
                        className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-900 dark:text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                        title="Test Connection"
                    >
                        {testingDa ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-4 h-4" />
                        )}
                        Test
                    </button>
                    <button
                        disabled={
                            !store.donationAlertsClientId ||
                            !store.donationAlertsClientSecret
                        }
                        onClick={() => {
                            const redirectUri = `${window.location.protocol}//${window.location.host}`;
                            const scope =
                                'oauth-user-show oauth-donation-index oauth-donation-subscribe';
                            const authUrl = `https://www.donationalerts.com/oauth/authorize?client_id=${encodeURIComponent(
                                store.donationAlertsClientId
                            )}&redirect_uri=${encodeURIComponent(
                                redirectUri
                            )}&response_type=code&scope=${encodeURIComponent(
                                scope
                            )}`;
                            window.location.href = authUrl;
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        {t('settings.connect_da')}
                    </button>
                </div>
            </div>
        </div>
    );
}
