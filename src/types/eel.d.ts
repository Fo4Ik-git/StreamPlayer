// Type definitions for Eel (Python-JavaScript bridge)

interface EelCallbackResult {
    success: boolean;
    message: string;
    data: any;
}

interface EelCredentials {
    client_id: string;
    client_secret: string;
    access_token?: string;
}

interface EelTokenResult {
    success: boolean;
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user_id?: number;
    user_name?: string;
    message: string;
    error?: string;
}

interface EelDonation {
    id: number;
    username: string;
    amount: number;
    currency: string;
    message: string;
    timestamp: string;
}

interface Eel {
    // Python -> JavaScript exposed functions
    expose: (fn: Function, name: string) => void;
    
    // JavaScript -> Python exposed functions
    play_stream: (url: string) => () => Promise<any>;
    start_da_auth: (credentials: { client_id: string; client_secret: string }) => () => Promise<void>;
    test_da_connection: (credentials: EelCredentials) => () => Promise<EelCallbackResult>;
    exchange_da_code: (code: string, client_id: string, client_secret: string, redirect_uri?: string) => () => Promise<EelTokenResult>;
    connect_with_token: (access_token: string, refresh_token: string, client_id: string, client_secret: string) => () => Promise<EelTokenResult>;
    get_da_status: () => () => Promise<{status: string}>;
    
    // Callback functions (called from Python)
    onDAStatusUpdate?: (data: { status: string; token?: string }) => void;
    onNewDonation?: (donation: EelDonation) => void;
    onDAConnectionStatus?: (data: { status: string; channel?: string }) => void;
}

declare global {
    interface Window {
        eel: Eel;
    }
}

export { };

