'use server'

const EVOLUTION_API_URL = (process.env.NEXT_PUBLIC_EVOLUTION_API_URL || 'http://localhost:8080').replace(/\/$/, '');
const EVOLUTION_API_KEY = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY;

export interface InstanceData {
    instanceName: string;
    owner: string;
    profileName: string;
    profilePictureUrl: string;
    profileStatus: string;
    status: string;
    serverUrl: string;
    apikey: string;
}

export async function fetchInstances() {
    console.log("Fetching instances from:", EVOLUTION_API_URL);
    if (!EVOLUTION_API_KEY) return [];

    try {
        const res = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
            headers: { 'apikey': EVOLUTION_API_KEY },
            cache: 'no-store'
        });

        if (!res.ok) {
            console.error("Fetch failed:", res.status, res.statusText);
            return [];
        }

        const data = await res.json();
        console.log("📦 Evolution Instances Raw:", JSON.stringify(data, null, 2)); // DEBUG

        if (Array.isArray(data)) {
            return data.map((item: any) => ({
                instanceName: item.name,
                owner: item.ownerJid,
                profileName: item.profileName,
                profilePictureUrl: item.profilePicUrl,
                status: item.connectionStatus, // 'close', 'open', 'connecting'
                serverUrl: EVOLUTION_API_URL,
                apikey: EVOLUTION_API_KEY
            })) as InstanceData[];
        }
        return [];
    } catch (e: any) {
        console.error("Error fetching instances", e);
        return [];
    }
}

export async function createInstanceAction(instanceName: string) {
    // Sanitize name: remove spaces, special chars, keep only alphanumeric and hyphens
    const cleanName = instanceName.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '');
    console.log(`🧹 Sanitized name: '${instanceName}' -> '${cleanName}'`);

    console.log("🚀 Create Instance Requested");
    console.log("Target URL:", `${EVOLUTION_API_URL}/instance/create`);
    console.log("API Key (masked):", EVOLUTION_API_KEY ? `${EVOLUTION_API_KEY.substring(0, 4)}...***` : "MISSING");


    try {
        const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
            method: 'POST',
            headers: {
                'apikey': EVOLUTION_API_KEY || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                instanceName: cleanName,
                token: Math.random().toString(36).substring(7),
                qrcode: true,
                integration: "WHATSAPP-BAILEYS"
            })
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("❌ API Error Response:", res.status, text);
            // Return error object instead of throwing if 401/403
            if (res.status === 401 || res.status === 403) {
                return { error: "Unauthorized", message: "Senha da API incorreta. Verifique na Railway e no .env.local" };
            }
            throw new Error(`API Error: ${res.status} ${text}`);
        }

        // ... success response
        const newInstance = await res.json();

        // AUTOMATION: Configure Webhook immediately
        try {
            console.log("🔗 Auto-configuring Webhook...");
            // Use host.docker.internal so container can reach host app
            // TODO: Make this URL configurable via ENV
            const WEBHOOK_URL = 'http://host.docker.internal:4001/webhook/evolution';

            await fetch(`${EVOLUTION_API_URL}/webhook/set/${cleanName}`, {
                method: 'POST',
                headers: {
                    'apikey': EVOLUTION_API_KEY || '',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    webhook: {
                        enabled: true,
                        url: WEBHOOK_URL,
                        webhookUrl: WEBHOOK_URL,
                        webhookByEvents: true,
                        events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE"]
                    }
                })
            });
            console.log("✅ Webhook Auto-configured!");
        } catch (webhookErr) {
            console.error("⚠️ Webhook auto-config failed (bot might be silent):", webhookErr);
        }

        return newInstance;
    } catch (e: any) {
        console.error("❌ Fetch Exception:", e.message);
        return { error: "FetchError", message: e.message };
    }
}

export async function connectInstanceAction(instanceName: string) {
    console.log("🔌 Connecting to instance:", instanceName);
    try {
        const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}?base64=true`, {
            headers: { 'apikey': EVOLUTION_API_KEY || '' }
        });

        if (!res.ok) {
            const text = await res.text();
            console.error("❌ Connect Error:", res.status, text);
            if (res.status === 401 || res.status === 403) {
                return { error: "Unauthorized", message: "Senha da API incorreta." };
            }
            throw new Error(`Connect Failed: ${res.status} ${text}`);
        }

        const data = await res.json();
        console.log("🔌 Connect Response:", JSON.stringify(data, null, 2));
        return data;
    } catch (e: any) {
        console.error("Error connecting", e);
        return { error: "FetchError", message: e.message };
    }
}

export async function logoutInstanceAction(instanceName: string) {
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

export async function deleteInstanceAction(instanceName: string) {
    console.log("🗑️ Deleting instance:", instanceName);
    try {
        const res = await fetch(`${EVOLUTION_API_URL}/instance/delete/${instanceName}`, {
            method: 'DELETE',
            headers: { 'apikey': EVOLUTION_API_KEY || '' }
        });

        if (!res.ok) {
            console.error("❌ Delete failed", res.status, res.statusText);
        }

        return await res.json();
    } catch (e) {
        console.error("Error deleting", e);
        throw e;
    }
}
