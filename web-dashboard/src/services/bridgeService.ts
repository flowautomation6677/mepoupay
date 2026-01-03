// import { createClient } from '@/utils/supabase/client'

const EVOLUTION_API_URL = process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY;

export interface Instance {
    instance: {
        instanceName: string;
        owner: string;
        profileName: string;
        profilePictureUrl: string;
        profileStatus: string;
        status: string;
        serverUrl: string;
        apikey: string;
    }
}

export const bridgeService = {
    async getInstances() {
        if (!EVOLUTION_API_KEY) return [];

        try {
            const res = await fetch(`${EVOLUTION_API_URL}/instance/fetch`, {
                headers: { 'apikey': EVOLUTION_API_KEY }
            });
            const data = await res.json();
            return data as Instance[];
        } catch (e) {
            console.error("Error fetching instances", e);
            return [];
        }
    },

    async getConnectionState(instanceName: string) {
        try {
            const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
                headers: { 'apikey': EVOLUTION_API_KEY || '' }
            });
            return await res.json();
        } catch {
            return { instance: { state: 'close' } };
        }
    },

    async createInstance(instanceName: string) {
        try {
            const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
                method: 'POST',
                headers: {
                    'apikey': EVOLUTION_API_KEY || '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    instanceName,
                    token: Math.random().toString(36).substring(7),
                    qrcode: true
                })
            });
            return await res.json();
        } catch (e) {
            console.error("Error creating instance", e);
            throw e;
        }
    },

    async connectInstance(instanceName: string) {
        try {
            const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
                headers: { 'apikey': EVOLUTION_API_KEY || '' }
            });
            return await res.json(); // Should return base64 or QR
        } catch (e) {
            console.error("Error connecting", e);
            throw e;
        }
    },

    async logoutInstance(instanceName: string) {
        try {
            const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
                method: 'DELETE',
                headers: { 'apikey': EVOLUTION_API_KEY || '' }
            });
            return await res.json();
        } catch (e) {
            console.error("Error logging out", e);
            throw e;
        }
    }
}
