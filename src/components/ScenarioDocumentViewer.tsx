'use client';

import { useMemo, useState } from 'react';
import { ScenarioDocument } from '@/lib/scenarioDocumentTypes';

interface ScenarioDocumentViewerProps {
    document: ScenarioDocument;
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

const speakerColors = [
    '#C62828',
    '#1565C0',
    '#2E7D32',
    '#6A1B9A',
    '#EF6C00',
    '#00838F',
    '#AD1457',
    '#4527A0',
    '#5D4037',
    '#283593',
    '#00695C',
    '#B71C1C',
];

const getSpeakerColor = (speaker: string) => {
    let hash = 0;
    for (let i = 0; i < speaker.length; i += 1) {
        hash = (hash + speaker.charCodeAt(i) * (i + 1)) % speakerColors.length;
    }

    return speakerColors[hash];
};

const isSelectableSpeaker = (speaker: string, body: string) => {
    if (!body.trim()) return false;
    if (/^\d{1,2}:\d{2}$/.test(speaker)) return false;
    if (['채널', '좌', '우'].includes(speaker)) return false;

    return true;
};

const getSpeakersFromText = (text: string) => {
    const speakers = new Set<string>();
    text.split('\n').forEach((line) => {
        const speakerMatch = line.trim().match(/^\[\s*([^\]]+?)\s*\]\s*(.*)$/);
        if (!speakerMatch) return;

        const speaker = speakerMatch[1].trim();
        const body = speakerMatch[2].trim();
        if (isSelectableSpeaker(speaker, body)) speakers.add(speaker);
    });

    return speakers;
};

const renderScenarioText = (text: string, selectedSpeaker: string) => {
    return text.split('\n').map((line, index) => {
        const trimmed = line.trim();
        const speakerMatch = trimmed.match(/^\[\s*([^\]]+?)\s*\]\s*(.*)$/);

        if (speakerMatch) {
            const speaker = speakerMatch[1].trim();
            const body = speakerMatch[2].trim();
            const selectableSpeaker = isSelectableSpeaker(speaker, body);

            if (!selectableSpeaker) {
                return (
                    <div key={`line-${index}`} className="scenario-doc-line">
                        {trimmed}
                    </div>
                );
            }

            const color = getSpeakerColor(speaker);
            const isHighlighted = selectedSpeaker === speaker;

            return (
                <div
                    key={`${speaker}-${index}`}
                    className={`scenario-doc-line scenario-doc-quote ${isHighlighted ? 'highlighted' : ''}`}
                    style={isHighlighted ? { borderColor: color, backgroundColor: `${color}1F` } : undefined}
                >
                    <span
                        className="scenario-doc-speaker"
                        style={{ color, borderColor: color, backgroundColor: isHighlighted ? `${color}2E` : `${color}14` }}
                    >
                        {speaker}
                    </span>
                    <span className="scenario-doc-quote-body">{body}</span>
                </div>
            );
        }

        return (
            <div
                key={`line-${index}`}
                className={`scenario-doc-line ${trimmed.startsWith('★') ? 'scenario-doc-note' : ''}`}
            >
                {trimmed}
            </div>
        );
    });
};

const getVisiblePageNumber = (page: ScenarioDocument['pages'][number]) => {
    return page.displayPageNumber ?? page.pageNumber;
};

export default function ScenarioDocumentViewer({ document }: ScenarioDocumentViewerProps) {
    const [query, setQuery] = useState('');
    const [sectionId, setSectionId] = useState('all');
    const [selectedSpeaker, setSelectedSpeaker] = useState('');

    const visibleSections = useMemo(
        () => document.sections.filter((section) => section.id !== 'overview'),
        [document.sections]
    );

    const visiblePages = useMemo(
        () => document.pages.filter((page) => page.sectionId !== 'overview'),
        [document.pages]
    );

    const filteredPages = useMemo(() => {
        const needle = normalize(query);

        return visiblePages.filter((page) => {
            const matchesSection = sectionId === 'all' || page.sectionId === sectionId;
            if (!matchesSection) return false;
            if (!needle) return true;

            return normalize(`${page.sectionTitle} ${page.title} ${page.text}`).includes(needle);
        });
    }, [query, sectionId, visiblePages]);

    const speakers = useMemo(() => {
        const speakerSet = new Set<string>();
        visiblePages.forEach((page) => {
            getSpeakersFromText(page.text).forEach((speaker) => speakerSet.add(speaker));
        });

        return Array.from(speakerSet).sort((a, b) => a.localeCompare(b, 'ko'));
    }, [visiblePages]);

    const activeSection = visibleSections.find((section) => section.id === sectionId);

    return (
        <div className="scenario-doc">
            <div className="scenario-doc-toolbar no-print">
                <label className="scenario-doc-search">
                    <span>검색</span>
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="예: RIT, 언론브리핑, 가스누출"
                    />
                </label>
                <label className="scenario-doc-speaker-filter">
                    <span>담당자</span>
                    <select
                        value={selectedSpeaker}
                        onChange={(event) => setSelectedSpeaker(event.target.value)}
                    >
                        <option value="">전체</option>
                        {speakers.map((speaker) => (
                            <option key={speaker} value={speaker}>
                                {speaker}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <div className="scenario-doc-tabs no-print" aria-label="시나리오 단계">
                <button
                    type="button"
                    className={sectionId === 'all' ? 'active' : ''}
                    onClick={() => setSectionId('all')}
                >
                    전체
                </button>
                {visibleSections.map((section) => (
                    <button
                        key={section.id}
                        type="button"
                        className={sectionId === section.id ? 'active' : ''}
                        onClick={() => setSectionId(section.id)}
                    >
                        {section.title}
                    </button>
                ))}
            </div>

            <div className="scenario-doc-summary">
                <strong>{activeSection?.title ?? '전체 시나리오'}</strong>
                <span>
                    {filteredPages.length}쪽 표시 / 원문 {visiblePages.length}쪽
                </span>
            </div>

            {filteredPages.length === 0 ? (
                <div className="scenario-doc-empty">
                    검색 결과가 없습니다.
                </div>
            ) : (
                <div className="scenario-doc-pages">
                    {filteredPages.map((page) => (
                        <article key={page.pageNumber} id={`scenario-page-${page.pageNumber}`} className="scenario-doc-page">
                            <header>
                                <div>
                                    <span className="scenario-doc-section">{page.sectionTitle}</span>
                                    <h2>{page.title}</h2>
                                </div>
                                <span className="scenario-doc-page-number">p.{getVisiblePageNumber(page)}</span>
                            </header>
                            <div className="scenario-doc-page-body">
                                {renderScenarioText(page.text, selectedSpeaker)}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
