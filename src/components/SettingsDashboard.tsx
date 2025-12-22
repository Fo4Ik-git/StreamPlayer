'use client';

// import { checkYoutubeConnection, getSocketToken } from '@/lib/donationAlertsApi';
import {
    CheckCircle2,
    ExternalLink,
    Eye,
    EyeOff,
    HelpCircle,
    Loader2,
    Moon,
    Save,
    Settings,
    Sun,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { checkYoutubeConnection } from '../lib/apiYoutube';
import { useStore } from '../store/useStore';

export default function SettingsDashboard() {
    const store = useStore();
    const { t, i18n } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [showSecrets, setShowSecrets] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [showYtInstructions, setShowYtInstructions] = useState(false);
    // const [newKeyword, setNewKeyword] = useState('');

    const [testingYt, setTestingYt] = useState(false);
    const [testingDa, setTestingDa] = useState(false);

    const handleSave = () => {
        setIsOpen(false);
        toast.success(t('settings.saved'));
    };

    const toggleTheme = () => {
        store.setTheme(store.theme === 'dark' ? 'light' : 'dark');
    };

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const testYoutube = async () => {
        setTestingYt(true);
        try {
            const isValid = await checkYoutubeConnection(store.youtubeApiKey);
            console.log('YouTube API test result:', isValid);
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
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="sticky top-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Settings className="w-6 h-6 text-indigo-500" />
                        {t('settings.title')}
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* Appearance Section */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                            {t('settings.appearance')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {t('settings.theme')}
                                </label>
                                <button
                                    onClick={toggleTheme}
                                    className="w-full flex items-center justify-between px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        {store.theme === 'dark' ? (
                                            <Moon className="w-4 h-4" />
                                        ) : (
                                            <Sun className="w-4 h-4" />
                                        )}
                                        {store.theme === 'dark'
                                            ? t('settings.dark')
                                            : t('settings.light')}
                                    </span>
                                </button>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {t('settings.language')}
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => changeLanguage('en')}
                                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                                            i18n.language === 'en'
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => changeLanguage('ru')}
                                        className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                                            i18n.language === 'ru'
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                                        }`}
                                    >
                                        Русский
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                    {/* API Keys Section */}
                    <section className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                                {t('settings.api_config')}
                            </h3>
                            <button
                                onClick={() => setShowSecrets(!showSecrets)}
                                className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                            >
                                {showSecrets ? (
                                    <EyeOff className="w-3 h-3" />
                                ) : (
                                    <Eye className="w-3 h-3" />
                                )}
                                {showSecrets ? 'Hide Secrets' : 'Show Secrets'}
                            </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-4 md:col-span-2 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/30">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">
                                            YouTube API Configuration
                                        </label>
                                        <p className="text-xs text-zinc-500">
                                            Required to search and fetch video
                                            metadata.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() =>
                                            setShowYtInstructions(
                                                !showYtInstructions
                                            )
                                        }
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                            showYtInstructions
                                                ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50'
                                                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-zinc-200'
                                        }`}
                                    >
                                        <HelpCircle className="w-3.5 h-3.5" />
                                        {showYtInstructions
                                            ? 'Hide Guide'
                                            : 'How to get key?'}
                                    </button>
                                </div>

                                {showYtInstructions && (
                                    <div className="relative overflow-hidden bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] dark:opacity-[0.03] scale-150 rotate-12 pointer-events-none">
                                            <Settings className="w-24 h-24 text-indigo-600 dark:text-indigo-500" />
                                        </div>

                                        <div className="space-y-3 relative">
                                            {[
                                                {
                                                    step: 1,
                                                    text: 'Go to',
                                                    link: 'Google Cloud Console',
                                                    url: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
                                                    sub: 'Log in with your Google account.',
                                                },
                                                {
                                                    step: 2,
                                                    text: 'Create a project or select an existing one',
                                                },
                                                {
                                                    step: 3,
                                                    text: 'Search',
                                                    highlight:
                                                        'YouTube Data API v3',
                                                    text2: 'in the search bar',
                                                    sub: 'Enable the API.',
                                                },
                                                {
                                                    step: 4,
                                                    text: 'Go to the',
                                                    highlight: 'Credentials',
                                                    text2: 'tab and click',
                                                    highlight2:
                                                        'Create Credentials > API key',
                                                },
                                                {
                                                    step: 5,
                                                    text: 'Copy your new',
                                                    highlight: 'API key',
                                                    sub: 'Paste it into the field below and test.',
                                                },
                                            ].map((item: any) => (
                                                <div
                                                    key={item.step}
                                                    className="flex gap-3"
                                                >
                                                    <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                        {item.step}
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                                            {item.text}{' '}
                                                            {item.highlight && (
                                                                <span className="text-zinc-950 dark:text-white font-semibold">
                                                                    "
                                                                    {
                                                                        item.highlight
                                                                    }
                                                                    "
                                                                </span>
                                                            )}
                                                            {item.link && (
                                                                <a
                                                                    href={
                                                                        item.url
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                                                                >
                                                                    {item.link}{' '}
                                                                    <ExternalLink className="w-2.5 h-2.5" />
                                                                </a>
                                                            )}
                                                            {item.text2 &&
                                                                ` ${item.text2} `}
                                                            {item.highlight2 && (
                                                                <span className="text-zinc-950 dark:text-white font-semibold">
                                                                    "
                                                                    {
                                                                        item.highlight2
                                                                    }
                                                                    "
                                                                </span>
                                                            )}
                                                        </p>
                                                        {item.sub && (
                                                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed italic">
                                                                {item.sub}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        type={showSecrets ? 'text' : 'password'}
                                        value={store.youtubeApiKey}
                                        onChange={(e) =>
                                            store.setSettings({
                                                youtubeApiKey: e.target.value,
                                            })
                                        }
                                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        placeholder="AIzaSy..."
                                    />
                                    <button
                                        onClick={testYoutube}
                                        disabled={
                                            testingYt || !store.youtubeApiKey
                                        }
                                        className="bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 text-zinc-900 dark:text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                        title="Test Connection"
                                    >
                                        {testingYt ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <CheckCircle2 className="w-4 h-4" />
                                        )}
                                        Test
                                    </button>
                                </div>
                            </div>

                            {/* DonationAlerts OAuth Section */}
                            <div className="space-y-2 md:col-span-2 grid md:grid-cols-2 gap-4 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/30">
                                <div className="md:col-span-2 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">
                                                DonationAlerts Authorization
                                            </h4>
                                            <p className="text-xs text-zinc-500">
                                                Connect your account to receive
                                                donations and alerts.
                                            </p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setShowInstructions(
                                                    !showInstructions
                                                )
                                            }
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
                                                        highlight:
                                                            'Create New Application',
                                                        sub: 'Fill in the name and description as you like.',
                                                    },
                                                    {
                                                        step: 3,
                                                        text: 'Set',
                                                        highlight:
                                                            'Redirect URI',
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
                                                    <div
                                                        key={item.step}
                                                        className="flex gap-3"
                                                    >
                                                        {/* Кружок с номером шага */}
                                                        <div className="shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                            {item.step}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                                                                {item.text}{' '}
                                                                {item.link && (
                                                                    <a
                                                                        href={
                                                                            item.url
                                                                        }
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-0.5 font-medium"
                                                                    >
                                                                        {
                                                                            item.link
                                                                        }{' '}
                                                                        <ExternalLink className="w-2.5 h-2.5" />
                                                                    </a>
                                                                )}
                                                                {item.highlight && (
                                                                    <span className="text-zinc-950 dark:text-white font-semibold">
                                                                        "
                                                                        {
                                                                            item.highlight
                                                                        }
                                                                        "
                                                                    </span>
                                                                )}
                                                                {item.code && (
                                                                    <code className="mx-1 px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded text-[10px] font-mono text-indigo-700 dark:text-indigo-300">
                                                                        {
                                                                            item.code
                                                                        }
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
                                                donationAlertsClientId:
                                                    e.target.value,
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
                                                donationAlertsClientSecret:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        placeholder="Secret..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                        {t('settings.user_id')}
                                    </label>
                                    <input
                                        type={showSecrets ? 'text' : 'password'}
                                        value={store.donationAlertsUserId}
                                        onChange={(e) =>
                                            store.setSettings({
                                                donationAlertsUserId:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                        placeholder="12345"
                                    />
                                </div>

                                <div className="md:col-span-2 flex items-center justify-between mt-2">
                                    <div className="text-xs text-zinc-500">
                                        {store.donationAlertsToken ? (
                                            <span className="text-green-500 flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" />{' '}
                                                Connected (Token Saved)
                                            </span>
                                        ) : (
                                            <span className="text-zinc-600">
                                                Not Connected
                                            </span>
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

                            {/* <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Donation X API Key</label>
                <input
                   type={showSecrets ? "text" : "password"}
                   value={store.donationXApiKey}
                   onChange={(e) => store.setSettings({ donationXApiKey: e.target.value })}
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                   placeholder="Key..."
                />
              </div> */}
                        </div>
                    </section>

                    <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                    {/* Filters Section */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                            {t('settings.filters')}
                        </h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            {/* <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {t('settings.min_donation')}
                                </label>
                                <input
                                    type="number"
                                    value={store.minDonationAmount}
                                    onChange={(e) =>
                                        store.setSettings({
                                            minDonationAmount: Number(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div> */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {t('settings.min_views')}
                                </label>
                                <input
                                    type="number"
                                    value={store.minViewCount}
                                    onChange={(e) =>
                                        store.setSettings({
                                            minViewCount: Number(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                    {t('settings.min_likes')}
                                </label>
                                <input
                                    type="number"
                                    value={store.minLikeCount}
                                    onChange={(e) =>
                                        store.setSettings({
                                            minLikeCount: Number(
                                                e.target.value
                                            ),
                                        })
                                    }
                                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>
                        </div>
                    </section>

                    {/* <div className="h-px bg-zinc-200 dark:bg-zinc-800" /> */}

                    {/* Blacklist Section */}
                    {/* <section className="space-y-4">
                        <h3 className="text-lg font-semibold text-zinc-200">
                            Blacklisted Keywords
                        </h3>
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
                                <span
                                    key={keyword}
                                    className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-sm text-zinc-300"
                                >
                                    {keyword}
                                    <button
                                        onClick={() =>
                                            store.removeBlacklistedKeyword(
                                                keyword
                                            )
                                        }
                                        className="hover:text-red-400"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            {store.blacklistedKeywords.length === 0 && (
                                <p className="text-sm text-zinc-600 italic">
                                    No blacklisted keywords.
                                </p>
                            )}
                        </div>
                    </section> */}
                </div>

                <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-indigo-500/20"
                    >
                        <Save className="w-4 h-4" />
                        {t('settings.save')}
                    </button>
                </div>
            </div>
        </div>
    );
}
