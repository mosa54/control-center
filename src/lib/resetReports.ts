import { supabase } from './supabase';

// Other features, including the assembly roster, also store rows in reports.
const reportIds = ['accident', 'casualty', 'building-register', 'building-plan', 'misc-docs', 'response-plan', 'field-command', 'resource-support'];

export async function resetReports() {
    const bucket = supabase.storage.from('report-files');
    const files: string[] = [];
    for (const id of reportIds) {
        for (let offset = 0; ; offset += 100) {
            const { data, error } = await bucket.list(id, { limit: 100, offset, sortBy: { column: 'name', order: 'asc' } });
            // Installations without this optional bucket embed files in the report row.
            if (error?.message.toLowerCase() === 'bucket not found') break;
            if (error) throw error;
            files.push(...data.filter(file => file.id).map(file => id + '/' + file.name));
            if (data.length < 100) break;
        }
    }

    await supabase.from('reports').delete().in('id', reportIds).throwOnError();
    const { count } = await supabase.from('reports').select('id', { head: true, count: 'exact' })
        .in('id', reportIds).throwOnError();
    if (count !== 0) throw new Error('Reports remain after reset.');

    for (let offset = 0; offset < files.length; offset += 100) {
        const batch = files.slice(offset, offset + 100);
        const { data, error } = await bucket.remove(batch);
        if (error) throw error;
        if (data.length !== batch.length) throw new Error('Report attachments remain after reset.');
    }
}
