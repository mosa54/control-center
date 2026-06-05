'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ScenarioDocument } from '@/lib/scenarioDocumentTypes';

interface ScenarioDocumentViewerProps {
    document: ScenarioDocument;
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface SearchCursor {
    current: number;
    activeIndex: number;
}

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

const countTextMatches = (text: string, query: string) => {
    const keyword = query.trim();
    if (!keyword) return 0;

    return text.match(new RegExp(escapeRegExp(keyword), 'gi'))?.length ?? 0;
};

const renderHighlightedText = (text: string, query: string, searchCursor?: SearchCursor) => {
    const keyword = query.trim();
    if (!keyword) return text;

    const parts = text.split(new RegExp(`(${escapeRegExp(keyword)})`, 'gi'));
    return parts.map((part, index) => {
        if (part.toLowerCase() !== keyword.toLowerCase()) return part;

        const matchIndex = searchCursor?.current ?? index;
        if (searchCursor) searchCursor.current += 1;

        return (
            <mark
                key={`${part}-${index}`}
                className={`scenario-doc-search-highlight ${matchIndex === searchCursor?.activeIndex ? 'active' : ''}`}
                data-scenario-search-match={matchIndex}
            >
                {part}
            </mark>
        );
    });
};

const renderScenarioText = (text: string, selectedSpeakers: string[], query: string, searchCursor: SearchCursor) => {
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
                        {renderHighlightedText(trimmed, query, searchCursor)}
                    </div>
                );
            }

            const color = getSpeakerColor(speaker);
            const isHighlighted = selectedSpeakers.includes(speaker);

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
                        {renderHighlightedText(speaker, query, searchCursor)}
                    </span>
                    <span className="scenario-doc-quote-body">{renderHighlightedText(body, query, searchCursor)}</span>
                </div>
            );
        }

        return (
            <div
                key={`line-${index}`}
                className={`scenario-doc-line ${trimmed.startsWith('★') ? 'scenario-doc-note' : ''}`}
            >
                {renderHighlightedText(trimmed, query, searchCursor)}
            </div>
        );
    });
};

const getVisiblePageNumber = (page: ScenarioDocument['pages'][number]) => {
    return page.displayPageNumber ?? page.pageNumber;
};

export default function ScenarioDocumentViewer({ document }: ScenarioDocumentViewerProps) {
    const [query, setQuery] = useState('');
    const [activeSearchIndex, setActiveSearchIndex] = useState(0);
    const [hasSearchNavigated, setHasSearchNavigated] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState('all');
    const [selectedSpeakers, setSelectedSpeakers] = useState<string[]>([]);
    const speakerPickerRef = useRef<HTMLDetailsElement>(null);

    const visibleSections = useMemo(
        () => document.sections.filter((section) => section.id !== 'overview'),
        [document.sections]
    );

    const visiblePages = useMemo(
        () => document.pages.filter((page) => page.sectionId !== 'overview'),
        [document.pages]
    );

    const searchMatchCount = useMemo(() => {
        if (!query.trim()) return 0;

        return visiblePages.reduce((total, page) => {
            return total + countTextMatches(`${page.sectionTitle}\n${page.title}\n${page.text}`, query);
        }, 0);
    }, [query, visiblePages]);

    const firstPageNumberBySection = useMemo(() => {
        const pageNumbers = new Map<string, number>();
        visiblePages.forEach((page) => {
            if (!pageNumbers.has(page.sectionId)) {
                pageNumbers.set(page.sectionId, page.pageNumber);
            }
        });

        return pageNumbers;
    }, [visiblePages]);

    const speakers = useMemo(() => {
        const speakerSet = new Set<string>();
        visiblePages.forEach((page) => {
            getSpeakersFromText(page.text).forEach((speaker) => speakerSet.add(speaker));
        });

        return Array.from(speakerSet).sort((a, b) => a.localeCompare(b, 'ko'));
    }, [visiblePages]);

    const activeSection = visibleSections.find((section) => section.id === activeSectionId);
    const hasSearchQuery = query.trim().length > 0;
    const hasSearchMatches = searchMatchCount > 0;
    const visibleSearchIndex = hasSearchMatches ? Math.min(activeSearchIndex, searchMatchCount - 1) : 0;
    const selectedSpeakerLabel =
        selectedSpeakers.length === 0
            ? '전체'
            : selectedSpeakers.length === 1
                ? selectedSpeakers[0]
                : `${selectedSpeakers.length}명 선택`;

    const toggleSpeaker = (speaker: string) => {
        setSelectedSpeakers((current) =>
            current.includes(speaker)
                ? current.filter((selectedSpeaker) => selectedSpeaker !== speaker)
                : [...current, speaker]
        );
    };

    const handleSearchChange = (value: string) => {
        setQuery(value);
        setActiveSearchIndex(0);
        setHasSearchNavigated(false);
    };

    const scrollToSearchMatch = (matchIndex: number) => {
        if (!hasSearchMatches) return;
        setActiveSearchIndex(matchIndex);
        setHasSearchNavigated(true);

        requestAnimationFrame(() => {
            globalThis.document
                .querySelector(`[data-scenario-search-match="${matchIndex}"]`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    const goToNextSearchResult = () => {
        if (!hasSearchMatches) return;
        const nextIndex = hasSearchNavigated ? (visibleSearchIndex + 1) % searchMatchCount : visibleSearchIndex;
        scrollToSearchMatch(nextIndex);
    };

    const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        scrollToSearchMatch(visibleSearchIndex);
    };

    useEffect(() => {
        const closeSpeakerPickerOnOutsideClick = (event: PointerEvent) => {
            const picker = speakerPickerRef.current;
            if (!picker?.open) return;
            if (event.target instanceof Node && picker.contains(event.target)) return;

            picker.removeAttribute('open');
        };

        globalThis.document.addEventListener('pointerdown', closeSpeakerPickerOnOutsideClick);
        return () => {
            globalThis.document.removeEventListener('pointerdown', closeSpeakerPickerOnOutsideClick);
        };
    }, []);

    useEffect(() => {
        const needle = normalize(query);
        if (!needle) {
            setActiveSearchIndex(0);
            setHasSearchNavigated(false);
        }
    }, [query]);

    const scrollToScenarioTarget = (targetSectionId: string) => {
        setActiveSectionId(targetSectionId);

        requestAnimationFrame(() => {
            const firstPageNumber = firstPageNumberBySection.get(targetSectionId);
            const target =
                targetSectionId === 'all'
                    ? globalThis.document.getElementById('scenario-doc-start')
                    : firstPageNumber
                        ? globalThis.document.getElementById(`scenario-page-${firstPageNumber}`)
                        : null;

            target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    const searchCursor: SearchCursor = { current: 0, activeIndex: visibleSearchIndex };

    return (
        <div id="scenario-doc-start" className="scenario-doc">
            <div className="scenario-doc-toolbar no-print">
                <div className="scenario-doc-search">
                    <span>검색</span>
                    <input
                        value={query}
                        onChange={(event) => handleSearchChange(event.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder="예: RIT, 언론브리핑, 가스누출"
                    />
                    {hasSearchQuery && (
                        <span className="scenario-doc-search-count">
                            {hasSearchMatches ? `${visibleSearchIndex + 1}/${searchMatchCount}` : '0/0'}
                        </span>
                    )}
                    <button
                        type="button"
                        className="scenario-doc-search-next"
                        disabled={!hasSearchMatches}
                        onClick={goToNextSearchResult}
                    >
                        다음
                    </button>
                </div>
                <div className="scenario-doc-speaker-filter scenario-doc-speaker-multi">
                    <span>담당자</span>
                    <details ref={speakerPickerRef} className="scenario-doc-speaker-picker">
                        <summary>{selectedSpeakerLabel}</summary>
                        <div className="scenario-doc-speaker-menu">
                            <div className="scenario-doc-speaker-actions">
                                <button
                                    type="button"
                                    className="scenario-doc-speaker-clear"
                                    disabled={selectedSpeakers.length === 0}
                                    onClick={() => setSelectedSpeakers([])}
                                >
                                    선택 해제
                                </button>
                                <button
                                    type="button"
                                    className="scenario-doc-speaker-apply"
                                    onClick={(event) => {
                                        event.currentTarget.closest('details')?.removeAttribute('open');
                                    }}
                                >
                                    적용
                                </button>
                            </div>
                            {speakers.map((speaker) => (
                                <label key={speaker} className="scenario-doc-speaker-option">
                                    <input
                                        type="checkbox"
                                        checked={selectedSpeakers.includes(speaker)}
                                        onChange={() => toggleSpeaker(speaker)}
                                    />
                                    <span>{speaker}</span>
                                </label>
                            ))}
                        </div>
                    </details>
                </div>
            </div>

            <div className="scenario-doc-tabs no-print" aria-label="시나리오 단계">
                <button
                    type="button"
                    className={activeSectionId === 'all' ? 'active' : ''}
                    onClick={() => scrollToScenarioTarget('all')}
                >
                    전체
                </button>
                {visibleSections.map((section) => (
                    <button
                        key={section.id}
                        type="button"
                        className={activeSectionId === section.id ? 'active' : ''}
                        onClick={() => scrollToScenarioTarget(section.id)}
                    >
                        {section.title}
                    </button>
                ))}
            </div>

            <div className="scenario-doc-summary">
                <strong>{activeSection ? `${activeSection.title} 위치` : '전체 시나리오'}</strong>
                <span>
                    원문 {visiblePages.length}쪽
                    {query.trim() ? ` / 검색 ${searchMatchCount}개` : ''}
                </span>
            </div>

            {visiblePages.length === 0 ? (
                <div className="scenario-doc-empty">
                    표시할 시나리오가 없습니다.
                </div>
            ) : (
                <div className="scenario-doc-pages">
                    {visiblePages.map((page) => (
                        <article key={page.pageNumber} id={`scenario-page-${page.pageNumber}`} className="scenario-doc-page">
                            <header>
                                <div>
                                    <span className="scenario-doc-section">
                                        {renderHighlightedText(page.sectionTitle, query, searchCursor)}
                                    </span>
                                    <h2>{renderHighlightedText(page.title, query, searchCursor)}</h2>
                                </div>
                                <span className="scenario-doc-page-number">p.{getVisiblePageNumber(page)}</span>
                            </header>
                            <div className="scenario-doc-page-body">
                                {renderScenarioText(page.text, selectedSpeakers, query, searchCursor)}
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
