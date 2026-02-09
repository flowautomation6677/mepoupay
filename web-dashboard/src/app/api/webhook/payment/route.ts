import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // Initialize Supabase Admin Client (Service Role) - Lazy Load
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    try {
        const payload = await request.json();
        console.log('Webhook Received (Kirvano/Generic):', JSON.stringify(payload, null, 2));

        // Kirvano Strategy (and fallback for others)
        // Common paths: customer.mobile, customer.phone, or root
        const customer = payload.customer || {};
        const rawPhone =
            customer.mobile ||
            customer.phone ||
            customer.whatsapp ||
            payload.phone ||
            payload.mobile;

        const email = customer.email || payload.email;

        // Status normalization
        const statusRaw = payload.status || payload.transaction_status || 'pending';
        const isApproved = ['approved', 'paid', 'completed', 'succeeded'].includes(statusRaw.toLowerCase());

        if (!rawPhone) {
            console.error('❌ Phone not found in payload. check logs.');
            return NextResponse.json({ error: 'Phone is required in customer/root' }, { status: 400 });
        }

        // Normalize phone (remove chars, ensure DDI 55 if missing but length suggests BR)
        let normalizedPhone = rawPhone.replace(/\D/g, '');

        // Simple heuristic: if length is 10 or 11 (BR w/ DDD), add 55.
        if (normalizedPhone.length >= 10 && normalizedPhone.length <= 11) {
            normalizedPhone = '55' + normalizedPhone;
        }

        const whatsappNumber = normalizedPhone.includes('@c.us')
            ? normalizedPhone
            : `${normalizedPhone}@c.us`;

        console.log(`Processing User: ${whatsappNumber}, Status: ${statusRaw} (Active: ${isApproved})`);

        // 1. Upsert User in Supabase
        // Strategy: Try to find by phone (in array) OR email.

        let { data: user } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .or(`email.eq.${email},whatsapp_numbers.cs.{${whatsappNumber}}`)
            .single();

        if (user) {
            // Update existing
            const { data: updated, error: updateError } = await supabaseAdmin
                .from('profiles')
                .update({
                    active_subscription: isApproved,
                    subscription_status: statusRaw,
                    updated_at: new Date().toISOString()
                    // We could append the new phone if it differs, but let's keep it simple for now
                })
                .eq('id', user.id)
                .select()
                .single();

            if (updateError) throw updateError;
            user = updated;
        } else {
            // Insert new
            const { data: created, error: createError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    whatsapp_numbers: [whatsappNumber],
                    email: email || `${whatsappNumber}@placeholder.com`, // Email is unique/required in new schema
                    active_subscription: isApproved,
                    subscription_status: statusRaw,
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) throw createError;
            user = created;
        }



        // 2. Trigger Email (Mock or Real)
        if (isApproved && email) {
            // Call Email Service
            // Dynamic import to avoid build issues if lib not present during static analysis
            try {
                const { sendWelcomeEmail } = require('../../../../lib/email');
                await sendWelcomeEmail(email, whatsappNumber);
                console.log(`[Email Service] Welcome email triggered for ${email}`);
            } catch (e: any) {
                console.error("Failed to send welcome email:", e);
            }
        }

        return NextResponse.json({ success: true, user_id: user.id });

    } catch (err: unknown) {
        const error = err as Error;
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
