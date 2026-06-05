import { supabase } from './supabase';
import { ScenarioDocument } from './scenarioDocumentTypes';

export const loadScenarioDocument = async (): Promise<ScenarioDocument | null> => {
    const { data, error } = await supabase
        .from('system_settings')
        .select('scenario_document')
        .eq('id', 1)
        .single();

    if (error) {
        console.warn('Scenario document load failed:', error.message);
        return null;
    }

    return (data?.scenario_document as ScenarioDocument | null) ?? null;
};

export const saveScenarioDocument = async (document: ScenarioDocument): Promise<void> => {
    const { error } = await supabase
        .from('system_settings')
        .update({ scenario_document: document })
        .eq('id', 1);

    if (error) {
        throw error;
    }
};
