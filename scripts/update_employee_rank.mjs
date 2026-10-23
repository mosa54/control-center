import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';

// Usage: node scripts/update_employee_rank.mjs --name 신영일 --rank 소방위 [--apply]
// Read-only by default. Changes only the named employee's rank in the live roster.
process.loadEnvFile('.env.local');
const args = process.argv.slice(2);
const name = args[args.indexOf('--name') + 1];
const rank = args[args.indexOf('--rank') + 1];
if (!args.includes('--name') || !args.includes('--rank') || !name || !rank) {
    throw new Error('Specify --name and --rank; add --apply to save.');
}
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data: settings, error } = await client.from('system_settings')
    .select('id,excel_data,updated_at').eq('id', 1).single();
if (error) throw new Error(error.message);
const matching = settings.excel_data.employees.flatMap((employee, index) => employee.성명 === name ? [index] : []);
assert.equal(matching.length, 1, 'Employee name must match exactly one record.');
const index = matching[0];
const employee = settings.excel_data.employees[index];
const report = { name, id: employee.id, from: employee.직급, to: rank, applied: false };
if (!args.includes('--apply') || employee.직급 === rank) {
    console.log(JSON.stringify({ ...report, alreadyCorrect: employee.직급 === rank }));
} else {
const next = structuredClone(settings.excel_data);
next.employees[index].직급 = rank;
await fs.mkdir('tmp', { recursive: true });
await fs.writeFile('tmp/employee-rank-before.json', JSON.stringify(settings, null, 2));
let query = client.from('system_settings').update({ excel_data: next, updated_at: new Date().toISOString() })
    .eq('id', settings.id)
    .eq(`excel_data->employees->${index}->>성명`, name)
    .eq(`excel_data->employees->${index}->>직급`, employee.직급);
if (settings.updated_at) query = query.eq('updated_at', settings.updated_at);
const saved = await query.select('id').single();
if (saved.error) throw new Error(`Roster changed or update failed: ${saved.error.message}`);
const verified = await client.from('system_settings').select('excel_data').eq('id', settings.id).single();
if (verified.error) throw new Error(verified.error.message);
assert.deepEqual(verified.data.excel_data, next, 'Saved roster does not match the requested one-field change.');
console.log(JSON.stringify({ ...report, applied: true, verified: true, employeeCount: next.employees.length }));
}
