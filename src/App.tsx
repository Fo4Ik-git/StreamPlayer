import { Filter, Settings } from 'lucide-react';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToastContainer, toast } from 'react-toastify';
import './App.css';
import FiltersDashboard from './components/FiltersDashboard';
import FloatingActions from './components/FloatingActions';
import Player from './components/Player';
import QueueList from './components/QueueList';
import SettingsDashboard from './components/SettingsDashboard';
import StatusIndicator from './components/StatusIndicator';
import i18n from './i18n';
import { addYoutubeVideoToQueue } from './lib/apiYoutube';
import type { Donation } from './lib/interfaces';
import { useStore } from './store/useStore';

// --- Global Eel Exposure ---

// Define callbacks globally so Eel can find them during initialization
// @ts-ignore
window.onNewDonation = async (donation: Donation) => {
    console.log('[App] 💰 New donation received:', donation);
    const store = useStore.getState();
    const { donationAlertsNotifications } = store;

    // 1. Show notification
    if (donation.is_test) {
        toast.info(
            i18n.t('notifications.test_donation', {
                username: donation.username,
                amount: donation.amount,
                currency: donation.currency,
            }),
            {
                autoClose: 3000,
            }
        );
    } else {
        if (donationAlertsNotifications) {
            toast.success(
                i18n.t('notifications.new_donation', {
                    username: donation.username,
                    amount: donation.amount,
                    currency: donation.currency,
                }),
                {
                    autoClose: 5000,
                }
            );
        }
    }

    await addYoutubeVideoToQueue(donation);
};

// @ts-ignore
window.onDAConnectionStatus = (data: { status: string; channel?: string }) => {
    console.log('[App] 🔌 DA Connection status changed:', data);

    // Access store outside of component
    const store = useStore.getState();

    if (data.status === 'connected') {
        store.setDAConnectionStatus('connected');
        toast.success(i18n.t('status.connected'), { autoClose: 3000 });
    } else if (data.status === 'connecting') {
        store.setDAConnectionStatus('connecting');
    } else if (data.status === 'disconnected') {
        store.setDAConnectionStatus('disconnected');
        toast.warning(i18n.t('status.disconnected'), { autoClose: 3000 });
    }
};

// Expose to Eel immediately if available
if (window.eel) {
    // @ts-ignore
    window.eel.expose(window.onNewDonation, 'onNewDonation');
    // @ts-ignore
    window.eel.expose(window.onDAConnectionStatus, 'onDAConnectionStatus');
} else {
    console.warn(
        '[App] window.eel not found during initial load. Callbacks might not be registered correctly if not using global window functions.'
    );
}
// ---------------------------

const waitForEel = (timeout = 5000) => {
    return new Promise((resolve, reject) => {
        if (window.eel) return resolve(true);
        const start = Date.now();
        const interval = setInterval(() => {
            if (window.eel) {
                clearInterval(interval);
                resolve(true);
            } else if (Date.now() - start > timeout) {
                clearInterval(interval);
                reject(new Error('Eel timeout'));
            }
        }, 100);
    });
};

function App() {
    const { t } = useTranslation();
    const [hasWindow, setHasWindow] = useState(false);
    const store = useStore();
    const isProcessingOAuth = useRef(false);
    const [isEelReady, setIsEelReady] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);

    // Apply theme
    useEffect(() => {
        if (store.theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }
    }, [store.theme]);

    useEffect(() => {
        waitForEel()
            .then(() => {
                console.log('[App] ✅ Eel is ready');
                setIsEelReady(true);
                setHasWindow(true);
            })
            .catch(() => {
                console.error('[App] ❌ Eel failed to load');
                toast.error(t('errors.crtitical'), { autoClose: 3000 });
            });
    }, []);

    useEffect(() => {
        if (!isEelReady || isProcessingOAuth.current) return;

        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            isProcessingOAuth.current = true;
            const handleAuth = async () => {
                try {
                    // Wait a bit more to ensure all exports are registered
                    await new Promise((r) => setTimeout(r, 500));

                    const clientId = store.donationAlertsClientId;
                    const clientSecret = store.donationAlertsClientSecret;
                    const redirectUri = `${window.location.protocol}//${window.location.host}/`;

                    const result = await window.eel.exchange_da_code(
                        code,
                        clientId,
                        clientSecret,
                        redirectUri
                    )();

                    if (result.success) {
                        store.setSettings({
                            donationAlertsToken: result.access_token,
                            donationAlertsUserId: String(result.user_id),
                        });
                        toast.success(t('settings.connected_success'), { autoClose: 3000 });
                    }
                    window.history.replaceState({}, document.title, '/');
                } catch (err) {
                    console.error('OAuth Error:', err);
                } finally {
                    isProcessingOAuth.current = false;
                }
            };
            handleAuth();
        }
    }, [isEelReady]);

    // Get current DA connection status on Eel ready
    useEffect(() => {
        if (!isEelReady) return;

        // @ts-ignore
        window.eel
            .get_da_status()()
            .then((res: { status: string }) => {
                if (res.status === 'connected')
                    store.setDAConnectionStatus('connected');
                else if (res.status === 'connecting')
                    store.setDAConnectionStatus('connecting');
                else store.setDAConnectionStatus('disconnected');
            })
            .catch(console.error);
    }, [isEelReady, store]);

    // Auto-connect if token exists
    useEffect(() => {
        if (!hasWindow || !window.eel) return;

        // If tokens exist, auto-connect
        if (store.donationAlertsToken && store.donationAlertsClientId) {
            console.log('[App] 🔄 Token found, auto-connecting...');

            const connectWithExistingToken = async () => {
                try {
                    const result = await window.eel.connect_with_token(
                        store.donationAlertsToken,
                        store.donationAlertsRefreshToken,
                        store.donationAlertsClientId,
                        store.donationAlertsClientSecret
                    )();

                    if (result.success) {
                        console.log('[App] ✅ Auto-connected successfully');
                    } else {
                        console.warn(
                            '[App] ⚠️ Auto-connect failed:',
                            result.message
                        );
                    }
                } catch (error) {
                    console.error('[App] ❌ Auto-connect error:', error);
                }
            };

            connectWithExistingToken();
        }
    }, [
        hasWindow,
        store.donationAlertsToken,
        store.donationAlertsClientId,
        store.donationAlertsRefreshToken,
        store.donationAlertsClientSecret,
    ]);

    if (!hasWindow) return null;

    const actions = [
        {
            id: 'filters',
            icon: Filter,
            onClick: () => setIsFiltersOpen(true),
            label: t('filters.title'),
            color: 'bg-red-500',
        },
        {
            id: 'settings',
            icon: Settings,
            onClick: () => setIsSettingsOpen(true),
            label: t('settings.title'),
        },
    ];

    return (
        <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white p-4 md:p-6 lg:p-8 flex flex-col gap-6 transition-colors duration-300">
            <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                    {t('app.title')}{' '}
                    <span className="text-zinc-500 text-sm font-normal">
                        {t('app.version')}
                    </span>
                </h1>
                <StatusIndicator />
            </header>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <div className="lg:col-span-2 flex flex-col min-h-[400px]">
                    <Player />
                </div>
                <div className="h-[500px] lg:h-auto">
                    <QueueList />
                </div>
            </div>

            {/* <FiltersDashboard />
            <SettingsDashboard /> */}

            <FloatingActions actions={actions} />
            <SettingsDashboard isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            <FiltersDashboard isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} />
            <Suspense fallback={null}></Suspense>
            <ToastContainer />
        </main>
    );
}

export default App;
