
import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Defined" : "MISSING",
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `Defined (Length: ${process.env.SUPABASE_SERVICE_ROLE_KEY.length})` : "MISSING",
        NODE_ENV: process.env.NODE_ENV
    });
}
