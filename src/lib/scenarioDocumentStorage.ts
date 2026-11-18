import { supabase } from './supabase';
import { ScenarioDocument } from './scenarioDocumentTypes';

export const saveScenarioDocument = async (document: ScenarioDocument): Promise<void> => {
    const { error } = await supabase
        .from('system_settings')
        .update({ scenario_document: document })
        .eq('id', 1);

    if (error) {
        throw error;
    }
};

export const getUploadedScenarioInfo = async () => {
    const { data } = await supabase.from('system_settings')
        .select('filename:scenario_document->>sourceFilename, uploadedAt:scenario_document->>uploadedAt')
        .eq('id', 1).single().throwOnError();
    return data?.filename ? { filename: String(data.filename), uploadedAt: data.uploadedAt ? String(data.uploadedAt) : null } : null;
};

export const deleteUploadedScenario = async (filename: string, uploadedAt: string | null) => {
    const query = supabase.from('system_settings').update({ scenario_document: null })
        .eq('id', 1).eq('scenario_document->>sourceFilename', filename);
    const version = 'scenario_document->>uploadedAt';
    const { data } = await (uploadedAt ? query.eq(version, uploadedAt) : query.is(version, null))
        .select('id').maybeSingle().throwOnError();
    return Boolean(data);
};
