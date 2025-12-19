'use server';

export async function sendTestAlert(
    accessToken: string,
    externalId: string,
    header: string,
    message: string,
    imageUrl: string = 'https://s.gravatar.com/avatar/b642b4217b34b1e8d3bd915fc65c4452?s=80',
) {
    try {
        const params = new URLSearchParams({
            external_id: externalId,
            header: header,
            message: message,
            is_shown: '1',
            image_url: imageUrl,
        });

        const res = await fetch(`https://www.donationalerts.com/api/v1/custom_alert`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
            cache: 'no-store',
        });

        console.log('params.toString()', params.toString());

        if (!res.ok) {
            const text = await res.text();
            console.error('Send Test Alert Error:', res.status, text);
            throw new Error(`Failed to send test alert: ${res.status}`);
        }

        const data = await res.json();
        console.log('✅ Test Alert Sent Successfully!', data);
        return data;
    } catch (error) {
        console.error('sendTestAlert Error:', error);
        throw error;
    }
}
