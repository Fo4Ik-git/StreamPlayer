export interface Donation {
    username: string;
    amount: number;
    currency: string;
    message?: string;
    id: number;
    timestamp: number;
    is_test?: boolean;
}