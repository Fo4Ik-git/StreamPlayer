'use server';

import { ApiClient } from '@donation-alerts/api';

export async function getSocketToken(accessToken: string) {
  try {
    // Use a shim AuthProvider that returns the token regardless of user ID
    const authProvider = {
      clientId: '',
      getAccessTokenForUser: async () => ({
        accessToken,
        refreshToken: null,
        expiresIn: null,
        obtainmentTimestamp: Date.now(),
        scope: []
      }),
      getScopesForUser: () => []
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiClient = new ApiClient({ authProvider: authProvider as any });
    
    // @ts-expect-error - using internal API to get user info from token
    const user = await apiClient.users.getUser();
    if (!user) {
        throw new Error('User not found');
    }
    const socketToken = await apiClient.users.getSocketConnectionToken(user.id);
    
    return socketToken;
  } catch (error) {
    console.error('getSocketToken Error:', error);
    throw error;
  }
}

export async function getChannelToken(accessToken: string, userId: string, clientId: string) {
  try {
    const authProvider = {
      clientId: clientId,
      getAccessTokenForUser: async () => ({
        accessToken,
        refreshToken: null,
        expiresIn: null,
        obtainmentTimestamp: Date.now(),
        scope: []
      }),
      getScopesForUser: () => []
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiClient = new ApiClient({ authProvider: authProvider as any });
    
    const channel = await apiClient.centrifugo.subscribeUserToDonationAlertEvents(userId, clientId);
    return channel.token;
  } catch (error) {
    console.error('getChannelToken Error:', error);
    throw error;
  }
}

export async function exchangeCodeForToken(clientId: string, clientSecret: string, code: string, redirectUri: string) {
    try {
        console.log('==== Token Exchange Request ====');
        
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            code: code,
        });

        const res = await fetch('https://www.donationalerts.com/oauth/token', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
            cache: 'no-store'
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('Token Exchange Error:', res.status, text);
            return { 
                success: false, 
                error: text, 
                status: res.status 
            };
        }

        const data = await res.json();
        console.log('✅ Token exchange successful!');
        
        return {
            success: true,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            token_type: data.token_type
        };

    } catch (error) {
        console.error('exchangeCodeForToken Error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
}

export async function refreshAccessToken(
    refreshToken: string, 
    clientId: string, 
    clientSecret: string,
    scope : string = 'oauth-donation-subscribe oauth-user-show oauth-custom_alert-store oauth-donation-index'
) {
    try {
        console.log('==== Refreshing Access Token ====');
        
        const params = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
            scope: scope,
        });

        const res = await fetch('https://www.donationalerts.com/oauth/token', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
            cache: 'no-store'
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('Token Refresh Error:', res.status, text);
            return { 
                success: false, 
                error: text, 
                status: res.status 
            };
        }

        const data = await res.json();
        console.log('✅ Token refreshed successfully!');
        
        return {
            success: true,
            access_token: data.access_token,
            refresh_token: data.refresh_token || refreshToken,
            expires_in: data.expires_in,
            token_type: data.token_type
        };

    } catch (error) {
        console.error('refreshAccessToken Error:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
        };
    }
}

export async function checkYoutubeConnection(apiKey: string) {
    if (!apiKey) return false;
    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=id&chart=mostPopular&maxResults=1&key=${apiKey}`);
        return res.ok;
    } catch {
        return false;
    }
}

async function getUserOauthId(accessToken: string): Promise<string> {
    const res = await fetch('https://www.donationalerts.com/api/v1/user/oauth', {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: 'no-store'
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('User Info Fetch Error:', res.status, text);
        throw new Error(`Failed to fetch user info: ${res.status}`);
    }

    const userData = await res.json();
    const userId = String(userData.data?.id || userData.id);
    
    if (!userId || userId === 'undefined') {
        throw new Error('Could not extract valid User ID from response');
    }
    
    return userId;
}

export async function getDonationAlertsConnectionData(accessToken: string, clientId: string = '') {
    try {
        console.log('🔄 Fetching DonationAlerts connection data on server...');
        
        const userId = await getUserOauthId(accessToken);
        console.log('✅ User ID resolved:', userId);

        const authProvider = {
            clientId: clientId,
            getAccessTokenForUser: async () => ({
                accessToken,
                refreshToken: null,
                expiresIn: null,
                obtainmentTimestamp: Date.now(),
                scope: []
            }),
            getScopesForUser: () => []
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const apiClient = new ApiClient({ authProvider: authProvider as any });
        
        const socketToken = await apiClient.users.getSocketConnectionToken(userId);

        let donationData: { channel: string, token: string };
        let goalData: { channel: string, token: string };
        let pollData: { channel: string, token: string };

        try {
            donationData = await apiClient.centrifugo.subscribeUserToDonationAlertEvents(userId, clientId);
        } catch (e) {
            console.error('❌ Failed to fetch donation channel token:', e);
            throw e;
        }

        try {
            goalData = await apiClient.centrifugo.subscribeUserToGoalUpdateEvents(userId, clientId);
        } catch (e) {
            goalData = { channel: `$goals:goal_${userId}`, token: '' };
        }

        try {
            pollData = await apiClient.centrifugo.subscribeUserToPollUpdateEvents(userId, clientId);
        } catch (e) {
            pollData = { channel: `$polls:poll_${userId}`, token: '' };
        }
        
        const channelTokens: Record<string, string> = {
            [donationData.channel]: donationData.token,
            [goalData.channel]: goalData.token,
            [pollData.channel]: pollData.token
        };

        return {
            userId,
            socketToken,
            channelToken: donationData.token,
            channelTokens
        };
    } catch (error) {
        console.error('getDonationAlertsConnectionData Error:', error);
        throw error;
    }
}

export async function getUserInfo(accessToken: string, _clientId?: string) {
    try {
        return await getUserOauthId(accessToken);
    } catch (error) {
        console.error('getUserInfo Error:', error);
        throw error;
    }
}
