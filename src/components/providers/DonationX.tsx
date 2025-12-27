import { CheckCircle2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { connectDonateX } from '../../lib/apiDonateX';
import { useStore } from '../../store/useStore';
import { Switch } from '../ui/switch';

interface DonationXProviderProps {
    showSecrets?: boolean;
}

export default function DonationXProvider({
    showSecrets,
}: DonationXProviderProps) {
    const store = useStore();
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();

    const handleConnect = async () => {
        if (!store.donatexToken) return;
        setLoading(true);
        try {
            const result = await connectDonateX(store.donatexToken);

            console.log('DonateX connection result:', result);

            if (result?.status) {
                toast.success('DonateX connected!');
            } else {
                toast.error('Failed to connect');
            }
        } catch (e) {
            toast.error('Error calling backend');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/30 md:col-span-2">
            <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-orange-500" />
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">
                    DonateX Integration
                </h4>
            </div>

            <div className="flex gap-2">
                <input
                    type={showSecrets ? 'text' : 'password'}
                    value={store.donatexToken}
                    onChange={(e) =>
                        store.setSettings({ donatexToken: e.target.value })
                    }
                    className="w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-4 py-2 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    placeholder="API Token (Bearer)"
                />
            </div>
            <div className="md:col-span-2 flex items-center justify-between mt-2">
                <div className="text-xs text-zinc-500">
                    {store.dxConnectionStatus === 'connected' ? (
                        <span className="text-green-500 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Connected
                            (Token Saved)
                        </span>
                    ) : (
                        <span className="text-zinc-600">Not Connected</span>
                    )}
                </div>
                <div className="flex gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 uppercase font-medium">
                            {store.isDXEnabled ? 'On' : 'Off'}
                        </span>
                        <Switch
                            checked={store.isDXEnabled}
                            onCheckedChange={(checked) =>
                                store.setSettings({ isDXEnabled: checked })
                            }
                        />
                    </div>
                    <button
                        onClick={handleConnect}
                        disabled={loading || !store.donatexToken}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        {t('settings.connect_dx')}
                    </button>
                </div>
            </div>
        </div>
    );
}
