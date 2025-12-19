'use client'
import { useStore } from '@/store/useStore';
import { UserEventsClient } from '@donation-alerts/events';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useYoutubeValidator } from './useYoutubeValidator';

export const useDonationListener = () => {
    const { 
        donationAlertsToken, 
        donationAlertsUserId, 
        donationAlertsClientId,
        donationXApiKey, 
        addToQueue,
        minDonationAmount
    } = useStore();
    
    const { validateVideo } = useYoutubeValidator();
    
    const [daStatus, setDaStatus] = useState<'active' | 'inactive'>('inactive');
    const [dxStatus, setDxStatus] = useState<'active' | 'inactive'>('inactive');
    
    const isConnectingRef = useRef(false);
    const isConnectedRef = useRef(false);
    const eventsClientRef = useRef<UserEventsClient | null>(null);
    
    const validateVideoRef = useRef(validateVideo);
    const addToQueueRef = useRef(addToQueue);
    
    useEffect(() => {
        validateVideoRef.current = validateVideo;
        addToQueueRef.current = addToQueue;
    }, [validateVideo, addToQueue]);
    
    useEffect(() => {
        if (!donationAlertsToken || !donationAlertsUserId || !donationAlertsClientId) {
            setDaStatus('inactive');
            isConnectedRef.current = false;
            isConnectingRef.current = false;
            return;
        }

        if (isConnectedRef.current && eventsClientRef.current) {
            return;
        }

        if (isConnectingRef.current) {
            return;
        }

        let isActive = true;
        isConnectingRef.current = true;

        const connect = async () => {
            try {
                console.log('🔄 Starting DonationAlerts connection...');
                setDaStatus('inactive');
                
                let currentToken = donationAlertsToken;
                const now = Date.now();
                const store = useStore.getState();
                
                // Token refresh logic...
                if (store.donationAlertsTokenExpiry && now >= store.donationAlertsTokenExpiry) {
                    console.log('⏰ Access token expired, refreshing...');
                    if (store.donationAlertsRefreshToken && store.donationAlertsClientId && store.donationAlertsClientSecret) {
                        try {
                            const { refreshAccessToken } = await import('@/lib/donationAlertsApi');
                            const result = await refreshAccessToken(
                                store.donationAlertsRefreshToken,
                                store.donationAlertsClientId,
                                store.donationAlertsClientSecret
                            );
                            
                            if (result.success && result.access_token) {
                                const newExpiry = Date.now() + (result.expires_in * 1000);
                                store.setSettings({
                                    donationAlertsToken: result.access_token,
                                    donationAlertsRefreshToken: result.refresh_token,
                                    donationAlertsTokenExpiry: newExpiry
                                });
                                
                                currentToken = result.access_token;
                                console.log('✅ Token refreshed successfully');
                            } else {
                                console.error('❌ Failed to refresh token:', result.error);
                                setDaStatus('inactive');
                                isConnectingRef.current = false;
                                return;
                            }
                        } catch (error) {
                            console.error('❌ Failed to refresh token:', error);
                            setDaStatus('inactive');
                            isConnectingRef.current = false;
                            return;
                        }
                    } else {
                        setDaStatus('inactive');
                        isConnectingRef.current = false;
                        return;
                    }
                }
                
                const { getDonationAlertsConnectionData } = await import('@/lib/donationAlertsApi');
                const connectionData = await getDonationAlertsConnectionData(currentToken, store.donationAlertsClientId || '');
                
                const preAuthenticatedClient = {
                    users: {
                        getUser: async () => ({ id: Number(connectionData.userId) }),
                        getSocketConnectionToken: async () => connectionData.socketToken
                    },
                    centrifugo: {
                        subscribeUserToDonationAlertEvents: async () => {
                            // console.log('📡 SDK requested donation channel subscription');
                            return { 
                                channel: `$alerts:donation_${connectionData.userId}`, 
                                token: connectionData.channelTokens[`$alerts:donation_${connectionData.userId}`] || connectionData.channelToken 
                            };
                        },
                        subscribeUserToGoalUpdateEvents: async () => {
                            // console.log('📡 SDK requested goal channel subscription');
                            return {
                                channel: `$goals:goal_${connectionData.userId}`,
                                token: connectionData.channelTokens[`$goals:goal_${connectionData.userId}`] || connectionData.channelToken
                            };
                        },
                        subscribeUserToPollUpdateEvents: async () => {
                            // console.log('📡 SDK requested poll channel subscription');
                            return {
                                channel: `$polls:poll_${connectionData.userId}`,
                                token: connectionData.channelTokens[`$polls:poll_${connectionData.userId}`] || connectionData.channelToken
                            };
                        },
                        subscribeUserToPrivateChannels: async (_user: unknown, _clientId: string, channels: string[]) => {
                            // console.log('📡 SDK requested private channels subscription:', channels);
                            return channels.map((name: string) => ({
                                channel: name,
                                token: connectionData.channelTokens[name] || connectionData.channelToken
                            }));
                        }
                    }
                };
                
                const { ApiClient } = await import('@donation-alerts/api');
                eventsClientRef.current = new UserEventsClient({ 
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    apiClient: preAuthenticatedClient as any, 
                    user: Number(connectionData.userId)
                });

                const handleData = async (event: { username?: string, amount: number | string, message?: string }) => {
                    if (!isActive) return;
                    console.log("📩 Processing Donation:", event);
                    
                    const amount = parseFloat(String(event.amount));
                    if (amount < minDonationAmount) {
                        console.log(`⚠️ Donation amount ${amount} is less than min ${minDonationAmount}`);
                        toast.error(`Donation amount ${amount} is less than min ${minDonationAmount}`);
                        return;
                    }

                    const msg = event.message || '';
                    const regExp = /(https?:\/\/[^\s]+)/g;
                    const urls = msg.match(regExp);

                    if (urls) {
                        console.log(`🔗 Found ${urls.length} URLs in donation message`);
                        for (const url of urls) {
                            (async () => {
                                const { isValid, videoDetails } = await validateVideoRef.current(url);
                                if (isValid && videoDetails) {
                                    addToQueueRef.current({
                                        ...videoDetails,
                                        requester: event.username || 'Anonymous',
                                        amount: amount,
                                        addedAt: Date.now()
                                    });
                                    toast.success(`Added ${videoDetails.title}`);
                                } else {
                                    toast.error(`YouTube URL is invalid or video not found: ${url}`);
                                    console.log(`❌ YouTube URL is invalid or video not found: ${url}`);
                                }
                            })();
                        }
                    } else {
                        console.log('ℹ️ No URLs found in donation message');
                    }
                };

                // Expose simulation command to window
                (window as Window & typeof globalThis & { simulateDonation?: (m: string, a?: number, n?: string) => void }).simulateDonation = (message: string, amount: number = 500, name: string = 'Test User') => {
                    handleData({
                        username: name,
                        amount: amount,
                        message: message
                    });
                };
                console.log('💡 TIP: Use simulateDonation(message, amount, name) in console to test');

                eventsClientRef.current.onDonation(handleData);

                eventsClientRef.current.onGoalUpdate((event) => {
                    if (!isActive) return;
                    console.log("📩 Goal Update Received:", event);
                });

                eventsClientRef.current.onPollUpdate((event) => {
                    if (!isActive) return;
                    console.log("📩 Poll Update Received:", event);
                });

                eventsClientRef.current.onConnect(() => {
                    if (!isActive) return;
                    console.log("✅ SDK Events Client connected successfully!");
                    isConnectedRef.current = true;
                    isConnectingRef.current = false;
                    setDaStatus('active');
                });

                eventsClientRef.current.onDisconnect(() => {
                    if (isActive) {
                        console.log('❌ SDK Events Client disconnected');
                        isConnectedRef.current = false;
                        setDaStatus('inactive');
                    }
                });

                await eventsClientRef.current.connect();

            } catch (error) {
                console.error('❌ Failed to connect:', error);
                setDaStatus('inactive');
                isConnectingRef.current = false;
            }
        };

        connect();

        return () => {
            isActive = false;
            if (eventsClientRef.current) {
                eventsClientRef.current.disconnect();
                eventsClientRef.current = null;
                isConnectedRef.current = false;
            }
            isConnectingRef.current = false;
        };
    }, [donationAlertsToken, donationAlertsUserId, donationAlertsClientId, minDonationAmount]);

    useEffect(() => {
        setDxStatus(donationXApiKey ? 'active' : 'inactive'); 
    }, [donationXApiKey]);

    return { daStatus, dxStatus };
}
