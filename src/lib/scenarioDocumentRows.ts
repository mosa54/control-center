import type { ScenarioContentRow } from './scenarioDocumentTypes';

const cleanText = (text: string) => text.replace(/\r/g, '').trim();

const appendText = (current: string, next: string) => {
    return [cleanText(current), cleanText(next)].filter(Boolean).join('\n');
};

const isTimeSituation = (text: string) => /^\[\d{1,2}:\d{2}]\s*\S/.test(text.trim());

const startsWithActionCue = (text: string) => /^(?:★|□||•|-)\s*/.test(text.trim());

const getSpeakerMatches = (text: string) => {
    return Array.from(text.matchAll(/\[\s*([^\]]+?)\s*]\s*/g))
        .map((match) => ({
            label: match[1].trim(),
            index: match.index ?? 0,
            end: (match.index ?? 0) + match[0].length,
        }))
        .filter(({ label }) => !label.includes('(!)') && label !== '채널');
};

const isDialogueText = (text: string) => {
    const value = cleanText(text);
    const speakers = getSpeakerMatches(value);
    if (speakers.length >= 2) return true;
    if (speakers.length === 0 || speakers[0].index !== 0) return false;

    const firstLine = value.split('\n')[0];
    const bodyOnFirstLine = firstLine.slice(speakers[0].end).trim();
    return bodyOnFirstLine.length > 0;
};

const isMajorSituation = (text: string) => {
    const value = cleanText(text);
    if (!value) return false;
    if (isTimeSituation(value)) return true;
    if (startsWithActionCue(value) || isDialogueText(value)) return false;
    if (/^\[[^\]]+]\s*$/.test(value)) return false;

    return value.replace(/\s+/g, ' ').length <= 40;
};

const isActionText = (text: string) => {
    const value = cleanText(text);
    if (/^\[[^\]]+]\s*\n/.test(value) || /^\[[^\]]*\(!\)[^\]]*]/.test(value)) {
        return false;
    }

    return startsWithActionCue(value)
        || isDialogueText(value)
        || value.replace(/\s+/g, ' ').length >= 100;
};

export const compactScenarioOtherText = (text: string) => {
    const lines = cleanText(text)
        .split('\n')
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    return lines.reduce<string[]>((paragraphs, line) => {
        const startsNewItem = /^(?:★|-|•|※|□|[①-⑳]|\d+[.)]|\[[^\]]+])\s*/.test(line);

        if (paragraphs.length === 0 || startsNewItem) {
            paragraphs.push(line);
        } else {
            paragraphs[paragraphs.length - 1] = `${paragraphs[paragraphs.length - 1]} ${line}`;
        }

        return paragraphs;
    }, []).join('\n');
};

export const normalizeScenarioRows = (
    rows: ScenarioContentRow[],
    fallbackSituation = '',
): ScenarioContentRow[] => {
    const normalized: ScenarioContentRow[] = [];

    const getCurrent = () => {
        if (normalized.length === 0) {
            normalized.push({
                situation: fallbackSituation,
                action: '',
                other: '',
            });
        }

        return normalized[normalized.length - 1];
    };

    for (const sourceRow of rows) {
        const situation = cleanText(sourceRow.situation);
        const action = cleanText(sourceRow.action);
        const other = compactScenarioOtherText(sourceRow.other);

        if (!situation && !action && !other) continue;

        if (isMajorSituation(situation)) {
            const actionBelongsToScenario = isActionText(action);
            normalized.push({
                situation,
                action: actionBelongsToScenario ? action : '',
                other: compactScenarioOtherText(
                    appendText(actionBelongsToScenario ? '' : action, other),
                ),
            });
            continue;
        }

        const current = getCurrent();

        if (situation) {
            if (startsWithActionCue(situation) || isDialogueText(situation) || situation.length >= 50) {
                current.action = appendText(current.action, situation);
            } else {
                current.other = compactScenarioOtherText(appendText(current.other, situation));
            }
        }

        if (action) {
            if (isActionText(action)) {
                current.action = appendText(current.action, action);
            } else {
                current.other = compactScenarioOtherText(appendText(current.other, action));
            }
        }

        if (other) {
            current.other = compactScenarioOtherText(appendText(current.other, other));
        }
    }

    return normalized.filter((row) => row.situation || row.action || row.other);
};
