'use client';

import { exchangeCodeForToken } from '@/lib/donationAlertsApi';
import { useStore } from '@/store/useStore';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function DonationAlertsAuthHandler() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const store = useStore();
    const [isProcessing, setIsProcessing] = useState(false);
    const processedCodeRef = useRef<string | null>(null);

    useEffect(() => {
        const code = searchParams.get('code');
        
        // Skip if no code, already processing, or already processed this exact code
        if (!code || isProcessing || processedCodeRef.current === code) {
            return;
        }

        // Skip if missing required credentials
        if (!store.donationAlertsClientId || !store.donationAlertsClientSecret) {
            return;
        }

        // Mark this code as processed immediately to prevent duplicate attempts
        processedCodeRef.current = code;
        setIsProcessing(true);

        const handleExchange = async () => {
            try {
                toast.info('Exchanging code for token...');
                const redirectUri = `${window.location.protocol}//${window.location.host}`;
                const tokenResponse = await exchangeCodeForToken(
                    store.donationAlertsClientId,
                    store.donationAlertsClientSecret,
                    code,
                    redirectUri
                );
                
                if (tokenResponse.access_token) {
                    // Fetch user ID automatically
                    try {
                        const { getUserInfo } = await import('@/lib/donationAlertsApi');
                        const userId = await getUserInfo(tokenResponse.access_token);
                        
                        // Calculate token expiry (current time + expires_in seconds)
                        const expiryTimestamp = Date.now() + (tokenResponse.expires_in * 1000);
                        
                        store.setSettings({ 
                            donationAlertsToken: tokenResponse.access_token,
                            donationAlertsRefreshToken: tokenResponse.refresh_token,
                            donationAlertsTokenExpiry: expiryTimestamp,
                            donationAlertsUserId: String(userId)
                        });
                        toast.success('DonationAlerts successfully connected!');
                    } catch (error) {
                        console.error('Failed to fetch user ID', error);
                        // Still save the tokens even if user ID fetch fails
                        const expiryTimestamp = Date.now() + (tokenResponse.expires_in * 1000);
                        
                        store.setSettings({ 
                            donationAlertsToken: tokenResponse.access_token,
                            donationAlertsRefreshToken: tokenResponse.refresh_token,
                            donationAlertsTokenExpiry: expiryTimestamp
                        });
                        toast.success('DonationAlerts connected! Please enter your User ID manually in Settings.');
                    }
                    
                    // Remove code from URL
                    router.replace('/');
                }
            } catch (error) {
                console.error('Auth Exchange Error', error);
                
                // Check if error is due to revoked or expired code
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage.includes('revoked') || errorMessage.includes('expired') || errorMessage.includes('400')) {
                    console.log('🔄 Code is revoked/expired, redirecting to new authorization...');
                    toast.info('Authorization code expired. Starting new authorization...');
                    
                    // Clear the code from URL and processed ref
                    processedCodeRef.current = null;
                    router.replace('/');
                    
                    // Wait a bit then trigger new OAuth flow
                    setTimeout(() => {
                        if (store.donationAlertsClientId && store.donationAlertsClientSecret) {
                            const redirectUri = encodeURIComponent(`${window.location.protocol}//${window.location.host}`);
                            const authUrl = `https://www.donationalerts.com/oauth/authorize?client_id=${store.donationAlertsClientId}&redirect_uri=${redirectUri}&response_type=code&scope=oauth-donation-subscribe%20oauth-user-show%20oauth-custom_alert-store%20oauth-donation-index`;
                            window.location.href = authUrl;
                        } else {
                            toast.error('Please enter Client ID and Client Secret first');
                        }
                    }, 1000);
                } else {
                    toast.error('Failed to authenticate with DonationAlerts');
                    // Clear the processed code ref so user can try again
                    processedCodeRef.current = null;
                }
            } finally {
                setIsProcessing(false);
            }
        };

        handleExchange();
        window.history.replaceState({}, '', '/');
        router.replace('/');
    }, [searchParams, store.donationAlertsClientId, store.donationAlertsClientSecret, isProcessing, router, store]);

    return null;
}
