import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase URL or Key is missing. Please check .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: {
        worker: true,
        heartbeatIntervalMs: 15000,
        heartbeatCallback: (status, latency) => {
            if (status === 'timeout' || status === 'disconnected') {
                console.warn('[supabase:heartbeat]', status, latency ?? '');
            }
        },
    },
});
