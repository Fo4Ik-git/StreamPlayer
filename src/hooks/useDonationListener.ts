import { getChannelToken, getSocketToken } from '@/lib/donationAlertsApi';
import { useStore } from '@/store/useStore';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useYoutubeValidator } from './useYoutubeValidator';
// @ts-ignore
const Centrifuge = require('centrifuge');

export const useDonationListener = () => {
    const { 
        donationAlertsToken, 
        donationAlertsUserId, 
        donationXApiKey, 
        addToQueue,
        minDonationAmount
    } = useStore();
    
    const { validateVideo } = useYoutubeValidator();
    
    const [daStatus, setDaStatus] = useState<'active' | 'inactive'>('inactive');
    const [dxStatus, setDxStatus] = useState<'active' | 'inactive'>('inactive');
    
    // Use refs to prevent multiple simultaneous connections
    const isConnectingRef = useRef(false);
    const isConnectedRef = useRef(false);
    const centrifugeRef = useRef<any | null>(null);
    
    // Store functions in refs to avoid dependency issues
    const validateVideoRef = useRef(validateVideo);
    const addToQueueRef = useRef(addToQueue);
    
    // Update refs when functions change
    useEffect(() => {
        validateVideoRef.current = validateVideo;
        addToQueueRef.current = addToQueue;
    }, [validateVideo, addToQueue]);
    
    // DonationAlerts Logic
    useEffect(() => {
        if (!donationAlertsToken || !donationAlertsUserId) {
            setDaStatus('inactive');
            isConnectedRef.current = false;
            isConnectingRef.current = false;
            return;
        }

        // Skip if already successfully connected
        if (isConnectedRef.current && centrifugeRef.current) {
            return;
        }

        // Prevent multiple simultaneous connection attempts
        if (isConnectingRef.current) {
            return;
        }

        let isActive = true;
        isConnectingRef.current = true;

        const connect = async () => {
            try {
                console.log('🔄 Starting DonationAlerts connection...');
                
                let currentToken = donationAlertsToken;
                
                // Check if token is expired and refresh if needed
                const now = Date.now();
                const store = useStore.getState();
                
                if (store.donationAlertsTokenExpiry && now >= store.donationAlertsTokenExpiry) {
                    console.log('⏰ Access token expired, refreshing...');
                    if (store.donationAlertsRefreshToken && store.donationAlertsClientId && store.donationAlertsClientSecret) {
                        try {
                            const { refreshAccessToken } = await import('@/lib/donationAlertsApi');
                            const tokenResponse = await refreshAccessToken(
                                store.donationAlertsRefreshToken,
                                store.donationAlertsClientId,
                                store.donationAlertsClientSecret
                            );
                            
                            const newExpiry = Date.now() + (tokenResponse.expires_in * 1000);
                            store.setSettings({
                                donationAlertsToken: tokenResponse.access_token,
                                donationAlertsRefreshToken: tokenResponse.refresh_token,
                                donationAlertsTokenExpiry: newExpiry
                            });
                            
                            currentToken = tokenResponse.access_token;
                            console.log('✅ Token refreshed successfully');
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
                
                // 1. Get Socket Token
                const socketToken = await getSocketToken(currentToken);
                if (!isActive) return;
                
                console.log('✅ Socket token obtained');
                
                // 2. Initialize Centrifuge
                centrifugeRef.current = new Centrifuge('wss://centrifugo.donationalerts.com/connection/websocket', {
                    // Указываем любой путь, чтобы библиотека думала, что эндпоинт есть,
                    // но мы перехватим запрос через getToken ниже.
                    subscribeEndpoint: 'https://www.donationalerts.com/api/v1/centrifuge/subscribe',
                    subscribeHeaders: {
                        'Authorization': `Bearer ${currentToken}`
                    }
                });
                centrifugeRef.current.setToken(socketToken);
                
                console.log('🔌 Centrifuge instance created, connecting...');

                centrifugeRef.current.on('message', (data: any) => {
                    console.log("📡 RAW MESSAGE FROM DA:", data);
                });

                centrifugeRef.current.on('connect', async (ctx: any) => {
                    if (!isActive) return;
                    
                    isConnectedRef.current = true;
                    isConnectingRef.current = false;
                    setDaStatus('active');
                    console.log("✅ Centrifuge connected successfully!");
                    console.log("Client ID:", ctx.client);

                    // 3. Get Channel Token (Step 2 of DA docs)
                    try {
                        const channelToken = await getChannelToken(currentToken, donationAlertsUserId, ctx.client);
                        if (!isActive) return;

                        // const channelName = `$alerts:donation_${donationAlertsUserId}`;
                        const channelName = `$alerts:custom_alert_${donationAlertsUserId}`;
                        console.log("📡 Subscribing to channel:", channelName);

                        // Centrifuge v2 uses subscribe with an events object including the token
                        const sub = centrifugeRef.current!.subscribe(channelName, {
                            token: channelToken,
                        });

                        (sub as any).token = channelToken;
                        
                        // Centrifuge v2 uses 'publication' for incoming messages on the sub object
                        sub.on('publication', (subCtx: any) => {
                           const data = subCtx.data;
                           console.log("📩 New Donation Data:");
                           
                           const msg = data.message || '';
                           const amount = parseFloat(data.amount);
                           
                           if (amount < minDonationAmount) return;

                           const regExp = /(https?:\/\/[^\s]+)/g;
                           const urls = msg.match(regExp);

                           if (urls) {
                               for (const url of urls) {
                                  (async () => {
                                      const { isValid, videoDetails } = await validateVideoRef.current(url);
                                      if (isValid && videoDetails) {
                                          addToQueueRef.current({
                                              ...videoDetails,
                                              requester: data.username || 'Anonymous',
                                              amount: amount,
                                              addedAt: Date.now()
                                          });
                                          toast.success(`Added ${videoDetails.title}`);
                                      }
                                  })();
                               }
                           }
                        });

                        sub.on('publish', (subCtx: any) => {
                            console.log("📩 New Donation Data:", subCtx);
                        });

                        sub.on('error', (err: any) => {
                            console.error("❌ Subscription error:", err);
                        });

                        sub.on('', (subCtx: any) => {
                            console.log("📩 New Donation Data:", subCtx);
                        });

                        sub.on('close', () => {
                            console.log('📡 Subscription closed');
                        });

                        sub.on('subscribe', (subCtx: any) => {
                            console.log('📡 Subscription triggered successfully', subCtx);
                        });
                        
                    } catch (err) {
                        console.error("Failed to subscribe to channel", err);
                    }
                });
                
                centrifugeRef.current.on('disconnect', (ctx: any) => {
                     if (isActive) {
                        isConnectedRef.current = false;
                        console.log('❌ Centrifuge disconnected', ctx);
                        setDaStatus('inactive');
                    }
                });

                centrifugeRef.current.connect();

            } catch (error) {
                console.error('❌ Failed to connect:', error);
                setDaStatus('inactive');
                isConnectingRef.current = false;
            }
        };

        connect();

        return () => {
            isActive = false;
            if (centrifugeRef.current) {
                centrifugeRef.current.disconnect();
                centrifugeRef.current = null;
                isConnectedRef.current = false;
            }
            isConnectingRef.current = false;
        };
    }, [donationAlertsToken, donationAlertsUserId, minDonationAmount]);

    // Donation X Logic
    useEffect(() => {
        setDxStatus(donationXApiKey ? 'active' : 'inactive'); 
    }, [donationXApiKey]);

    // Console Helpers
    useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).checkDonationStatus = () => {
                console.log('DA Status:', daStatus, 'Connected:', isConnectedRef.current, 'Token:', donationAlertsToken);
            };

            (window as any).sendTestAlert = async (message: string, amount: number) => {
                if (!donationAlertsToken) return;
                try {
                     const { sendTestAlert } = await import('@/lib/testAlert');
                     await sendTestAlert(donationAlertsToken, Math.random().toString(), 'Test', message);
                     console.log('✅ Test alert sent!');
                } catch (e) {
                    console.error('❌ Test alert failed:', e);
                }
            };
        }
    }, [donationAlertsToken, daStatus]);

    return { daStatus, dxStatus };
}
