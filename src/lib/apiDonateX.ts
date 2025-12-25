import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from '@microsoft/signalr';
import { toast } from 'react-toastify';
import i18n from '../i18n';
import { useStore } from '../store/useStore';
import { addYoutubeVideoToQueue } from './apiYoutube';
import type { Donation } from './interfaces';

// Base URL for DonateX SignalR
const DX_HUB_URL = 'https://donatex.gg/api/public-donations-hub';

let connection: HubConnection | null = null;

export async function connectDonateX(token: string) {
    const store = useStore.getState();

    // If connection already exists and is active, do not reconnect unnecessarily
    if (connection && connection.state === 'Connected') {
        return { status: true };
    }

    try {
        store.setDXConnectionStatus('connecting');

        // Create SignalR connection
        connection = new HubConnectionBuilder()
            .withUrl(`${DX_HUB_URL}?access_token=${token}`)
            .withAutomaticReconnect() // Automatic reconnection on disconnect
            .configureLogging(LogLevel.Information)
            .build();

        // Listen for new donation event
        connection.on('DonationCreated', (donation: any) => {
            handleIncomingDXDonation(donation);
        });

        // Handle connection lifecycle events
        connection.onreconnecting(() => {
            store.setDXConnectionStatus('connecting');
        });

        connection.onreconnected(() => {
            store.setDXConnectionStatus('connected');
        });

        connection.onclose(() => {
            store.setDXConnectionStatus('disconnected');
        });

        // Start connection
        await connection.start();

        store.setDXConnectionStatus('connected');
        toast.success(i18n.t('status.connected'), { autoClose: 3000 });
        return { success: true };
    } catch (error) {
        console.error('[DX] SignalR Connection Error:', error);
        store.setDXConnectionStatus('disconnected');
        toast.error(
            `DonateX SignalR Error: ${
                error instanceof Error ? error.message : 'Unknown'
            }`
        );
    } 
}


export async function disconnectDonateX() {
    if (connection) {
        await connection.stop();
        connection = null;
        useStore.getState().setDXConnectionStatus('disconnected');
    }
}

async function handleIncomingDXDonation(data: any) {
    const donation: Donation = {
        id: data.id || Date.now().toString(),
        username: data.nickname || data.username || 'Anonymous',
        amount: parseFloat(data.amount),
        currency: data.currency || 'RUB',
        message: data.message || '',
        timestamp: new Date(data.createdAt).getTime(),
        is_test: data.isTest || false,
    };

    await addYoutubeVideoToQueue(donation);
}
