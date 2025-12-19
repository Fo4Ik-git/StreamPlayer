'use server';

const DA_API_BASE = 'https://www.donationalerts.com/api/v1';

export async function getSocketToken(accessToken: string) {
  try {
    const res = await fetch(`${DA_API_BASE}/user/oauth`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    });
    
    if (!res.ok) {
        const text = await res.text();
        console.error('DA API Error (Socket):', res.status, text);
        throw new Error(`Failed to get socket token: ${res.status}`);
    }
    
    const data = await res.json();
    console.log('Full /user/oauth response:', JSON.stringify(data, null, 2));
    console.log('socket_connection_token:', data.data.socket_connection_token);
    return data.data.socket_connection_token;
  } catch (error) {
    console.error('getSocketToken Error:', error);
    throw error;
  }
}

// Subscribing to the Private Channels and Obtaining Connection Tokens
// POST https://www.donationalerts.com/api/v1/centrifuge/subscribe
export async function getChannelToken(accessToken: string, userId: string, clientId: string) {
  const channel = `$alerts:donation_${userId}`;
  
  try {
      const res = await fetch(`${DA_API_BASE}/centrifuge/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channels: [channel],
          client: clientId,
        }),
        cache: 'no-store',
      });
      
      if (!res.ok) {
          const text = await res.text();
          console.error('DA API Error (Channel Token):', res.status, text);
          throw new Error(`Failed to get channel token: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Response contains array of the subscribed channels and tokens
      if (data && data.channels && data.channels.length > 0) {
        return data.channels[0].token;
      }
      
      throw new Error('No channel token returned');
  } catch (error) {
      console.error('getChannelToken Error:', error);
      throw error;
  }
}

export async function exchangeCodeForToken(clientId: string, clientSecret: string, code: string, redirectUri: string) {
    try {
        console.log('==== Token Exchange Request ====');
        console.log('Client ID:', clientId);
        console.log('Redirect URI:', redirectUri);
        console.log('Code (first 20 chars):', code.substring(0, 20) + '...');
        
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
            throw new Error(`Failed to exchange token: ${res.status}`);
        }

        const data = await res.json();
        console.log('✅ Token exchange successful!');
        
        // Return full token response
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            token_type: data.token_type
        };

    } catch (error) {
        console.error('exchangeCodeForToken Error:', error);
        throw error;
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
            throw new Error(`Failed to refresh token: ${res.status}`);
        }

        const data = await res.json();
        console.log('✅ Token refreshed successfully!');
        
        // Return full token response
        return {
            access_token: data.access_token,
            refresh_token: data.refresh_token || refreshToken, // Use old refresh token if new one not provided
            expires_in: data.expires_in,
            token_type: data.token_type
        };

    } catch (error) {
        console.error('refreshAccessToken Error:', error);
        throw error;
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

export async function getUserInfo(accessToken: string) {
    try {
        const res = await fetch('https://www.donationalerts.com/api/v1/user/oauth', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            const text = await res.text();
            console.error('Get User Info Error:', res.status, text);
            throw new Error(`Failed to get user info: ${res.status}`);
        }

        const data = await res.json();
        return data.data.id; // Returns user ID
    } catch (error) {
        console.error('getUserInfo Error:', error);
        throw error;
    }
}
