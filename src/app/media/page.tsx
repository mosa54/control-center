'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Toast from '@/components/Toast';
import { BRIEFING_EXAMPLES, type BriefingExample } from '@/lib/mediaBriefingExamples';
import './media.css';

type QACategory = 'general' | 'pressure';
type MediaTab = QACategory | 'briefing';

interface QA {
    id: string;
    q: string;
    a: string;
    category: QACategory;
}

const DEFAULT_QA_DATA: QA[] = [
    // 일반 질문 (general)
    { id: 'g1', category: 'general', q: '현재까지 인명 피해는 어떻게 됩니까?', a: '현재까지 확인된 인명 피해는 사망 ○명, 중상 ○명, 경상 ○명이며, 추가 수색이 진행 중으로 피해 규모는 변동될 수 있습니다.' },
    { id: 'g2', category: 'general', q: '현재 화재 진행사항은 어떻습니까?', a: '(진압 전) 현재 화재는 건물 ○층을 중심으로 계속 진행 중이며, 약 ○○% 정도 진압된 상태입니다. 소방 인력 ○○명과 장비 ○○대를 동원해 인명구조와 화재 진압을 동시에 진행하고 있습니다.\n\n(진압 후) 현재 큰 불길은 모두 잡힌 상태이며, 잔불 정리와 함께 내부 수색 작업을 병행하고 있습니다. 추가 피해 여부를 확인하는 데 집중하고 있습니다.' },
    { id: 'g3', category: 'general', q: '화재는 언제, 어디서 발생했습니까?', a: '오늘 ○시 ○분경 ○○구 ○○동 소재 ○○건물에서 화재 신고가 접수되었으며, 정확한 발화 지점은 현재 조사 중입니다.' },
    { id: 'g4', category: 'general', q: '투입된 소방력은 어느 정도입니까?', a: '현재까지 소방 인력 ○○명과 장비 ○○대를 투입해 진화 및 구조 작업을 진행하고 있으며, 경찰과 지자체 등 유관기관도 함께 대응하고 있습니다. 현장 상황에 따라 필요한 소방력은 추가로 투입할 계획입니다.' },
    { id: 'g5', category: 'general', q: '대응단계는 언제 발령됐습니까?', a: '현장 상황과 화재 확산 정도를 고려해 ○시 ○분경 대응 ○단계를 발령했으며, 이후 상황 변화에 따라 대응을 강화했습니다.' },
    { id: 'g6', category: 'general', q: '현재 구조 작업은 어떻게 진행되고 있습니까?', a: '현재 건물 내부 전 층에 대해 인명 수색을 진행 중이며, 추가 인명 피해 여부를 확인하는 데 집중하고 있습니다.' },
    { id: 'g7', category: 'general', q: '추가 인명피해 발생 가능성은?', a: '현재 건물 내부 수색이 진행 중으로, 추가 인명 피해 가능성을 완전히 배제할 수는 없습니다. 수색에 총력을 기울이고 있으며, 확인되는 대로 신속히 안내드리겠습니다.' },
    { id: 'g8', category: 'general', q: '병원 이송 상황은 어떻습니까?', a: '부상자들은 동아대학교병원, 부산대학교병원 등 총 10여 개 병원으로 분산 이송되었으며, 현재 각 병원에서 치료를 받고 있습니다. 구체적인 환자 상태는 병원 측에서 확인이 필요한 상황입니다.' },
    { id: 'g9', category: 'general', q: '인근 주민 대피 조치는?', a: '화재 확산 우려에 따라 인근 주민에 대해 안전조치를 실시했으며, 필요 시 추가 대피가 이루어질 수 있도록 상황을 지속적으로 관리하고 있습니다.' },
    { id: 'g10', category: 'general', q: '신고 당시 어떤 상황이었습니까?', a: '신고 당시 ‘○층에서 불이 났다’, ‘연기가 빠르게 퍼진다’, ‘대피가 어렵다’는 긴급 신고가 잇따랐습니다. 당시 화재는 이미 상당 부분 진행된 것으로 보이며, 정확한 상황은 확인 중입니다.' },
    { id: 'g11', category: 'general', q: '화재 원인은 무엇입니까?', a: '현재로서는 정확한 화재 원인을 단정할 수 없으며, 화재 진압이 완료되는 대로 관계기관과 합동 감식을 통해 원인을 규명할 예정입니다.' },
    { id: 'g12', category: 'general', q: '이후 화재진압 방향은 어떻게 됩니까?', a: '우선 인명 수색을 최우선으로 진행하면서, 추가 확산을 차단하는 데 집중할 계획입니다. 이후 잔불 정리와 함께 완전 진압을 목표로 대응을 이어갈 예정입니다.' },
    { id: 'g13', category: 'general', q: '구조 작업이 어려웠던 이유는 무엇입니까?', a: '현장 내부에 연기와 고열이 빠르게 확산되면서 구조대 진입이 제한되는 어려움이 있었으나, 안전을 확보한 상태에서 최대한 신속하게 구조 작업을 진행했습니다.' },
    { id: 'g14', category: 'general', q: '대피가 제대로 이루어지지 않은 이유는?', a: '당시 내부 상황이 매우 급박했던 것으로 보이며, 대피 과정 전반에 대해서는 추가 확인이 필요한 상황입니다.' },
    { id: 'g15', category: 'general', q: '실종자가 더 있는 것 아닌가요?', a: '현재까지 접수된 신고를 기준으로 확인 중이며, 건물 내부 수색을 계속 진행하고 있습니다. 추가 확인되는 사항은 즉시 안내드리겠습니다.' },
    { id: 'g16', category: 'general', q: '다수 인명피해 발생 원인은?', a: '연기 확산과 대피 어려움 등 여러 요인이 복합적으로 작용한 것으로 보입니다. 정확한 원인은 종합적인 조사가 필요합니다.' },

    // 압박 질문 (pressure)
    { id: 'p1', category: 'pressure', q: '초기 대응이 늦은 것 아닌가요?', a: '신고 접수 즉시 출동했으며, 현장 도착 후 화재 규모와 위험도를 판단해 단계적으로 대응을 강화했습니다. 대응 적절성 여부는 향후 종합적으로 검토될 예정입니다.' },
    { id: 'p2', category: 'pressure', q: '대응단계 발령이 늦었던 것 아닌가요?', a: '대응단계는 현장 상황과 화재 확산 정도를 종합적으로 판단해 단계적으로 발령한 사항입니다. 적절성 여부는 사후에 종합적으로 검토될 예정입니다.' },
    { id: 'p3', category: 'pressure', q: '결국 대피가 제대로 안 된 것 아닌가요?', a: '당시 내부 상황이 매우 급박했던 것으로 보이며, 대피 과정 전반에 대해서는 추가적인 확인이 필요한 상황입니다. 정확한 경위는 조사 후 말씀드리겠습니다.' },
    { id: 'p4', category: 'pressure', q: '스프링클러 등 소방시설은 정상 작동했습니까?', a: '소방시설 작동 여부를 포함해 전반적인 안전시설에 대해서는 관계기관과 함께 면밀히 조사할 예정입니다. 현재 단계에서 단정적으로 말씀드리기는 어렵습니다.' },
    { id: 'p5', category: 'pressure', q: '불법 건축물이나 안전관리 문제는 없었습니까?', a: '해당 사항을 포함한 전반적인 안전관리 실태에 대해서도 관계기관과 함께 조사할 계획이며, 현재로서는 구체적인 내용을 말씀드리기 어려운 상황입니다.' },
    { id: 'p6', category: 'pressure', q: '출동로 상 문제는 없었습니까? (도착 지연 여부)', a: '출동 당시 교통 혼잡과 현장 주변 도로 여건 등으로 인해 일부 접근에 어려움은 있었으나, 가능한 모든 경로를 활용해 신속히 현장에 도착해 대응을 진행했습니다. 도착 시간에 대한 평가는 종합적으로 검토될 예정입니다.' },
    { id: 'p7', category: 'pressure', q: '이번 사고, 누가 책임져야 한다고 보십니까?', a: '현재는 인명 구조와 화재 진압에 집중하고 있는 단계이며, 책임 소재에 대해서는 관계기관 조사 결과를 토대로 판단될 사항입니다.' },
    { id: 'p8', category: 'pressure', q: '유가족들이 납득하겠습니까?', a: '안타까운 상황에 대해 깊이 유감을 표하며, 현재는 인명 수색과 피해 수습에 최선을 다하고 있습니다. 향후 조사 결과에 따라 필요한 조치가 이루어질 것입니다.' }
];

interface BriefingExamplesPanelProps {
    selectedBriefing: BriefingExample | undefined;
    selectedBriefingId: string;
    examples: BriefingExample[];
    isEditMode: boolean;
    onSelect: (id: string) => void;
    onAddExample: () => void;
    onDeleteExample: () => void;
    onUpdateDisasterType: (value: string) => void;
    onUpdateSection: (sectionIndex: number, field: 'title' | 'paragraphs', value: string) => void;
    onAddSection: () => void;
}

function BriefingExamplesPanel({
    selectedBriefing, selectedBriefingId, examples, isEditMode, onSelect,
    onAddExample, onDeleteExample, onUpdateDisasterType, onUpdateSection,
    onAddSection,
}: BriefingExamplesPanelProps) {
    return (
        <div className="briefing-panel">
            <div className="briefing-selector">
                <label htmlFor={isEditMode ? 'briefing-type-name' : 'briefing-disaster-type'} className="briefing-label">재난 유형</label>
                {isEditMode && selectedBriefing ? (
                    <input
                        id="briefing-type-name"
                        className="form-input"
                        value={selectedBriefing.disasterType}
                        onChange={(event) => onUpdateDisasterType(event.target.value)}
                    />
                ) : (
                    <select
                        id="briefing-disaster-type"
                        className="form-input"
                        value={selectedBriefingId}
                        onChange={(event) => onSelect(event.target.value)}
                        disabled={examples.length === 0}
                    >
                        {examples.length === 0 && <option value="">등록된 유형 없음</option>}
                        {examples.map((example) => (
                            <option key={example.id} value={example.id}>
                                {example.disasterType}
                            </option>
                        ))}
                    </select>
                )}
                {isEditMode && (
                    <div className="briefing-selector-actions">
                        <button type="button" className="briefing-add-button" onClick={onAddExample}>
                            + 재난 유형 추가
                        </button>
                        {selectedBriefing && (
                            <button type="button" className="briefing-delete-button" onClick={onDeleteExample}>유형 삭제</button>
                        )}
                    </div>
                )}
            </div>

            {!selectedBriefing ? (
                <div className="briefing-empty">등록된 브리핑 예문이 없습니다.{isEditMode && ' 재난 유형을 추가해 주세요.'}</div>
            ) : (
                <div className="briefing-paper">
                    {!isEditMode && (
                        <div className="briefing-paper-header">
                            <span className="briefing-kicker">언론 대응 · 브리핑 예문</span>
                            <h2 className="briefing-paper-title">{selectedBriefing.disasterType}</h2>
                            <p className="briefing-paper-intro">현장 정보에 맞게 시간·장소·피해 수치 등을 확인한 후 활용하세요.</p>
                        </div>
                    )}

                    <div className="briefing-paper-body">
                        {selectedBriefing.sections.map((section, sectionIndex) => (
                            <section key={`${selectedBriefing.id}-${sectionIndex}`} className="briefing-section">
                                {isEditMode ? (
                                    <>
                                        {selectedBriefing.sections.length > 1 && (
                                            <>
                                                <label htmlFor={`briefing-section-title-${sectionIndex}`} className="briefing-label">예문 제목</label>
                                                <input
                                                    id={`briefing-section-title-${sectionIndex}`}
                                                    className="form-input"
                                                    value={section.title}
                                                    onChange={(event) => onUpdateSection(sectionIndex, 'title', event.target.value)}
                                                />
                                            </>
                                        )}
                                        <label htmlFor={`briefing-section-body-${sectionIndex}`} className="briefing-label briefing-body-label">본문</label>
                                        <textarea
                                            id={`briefing-section-body-${sectionIndex}`}
                                            className="form-input briefing-textarea"
                                            rows={Math.min(Math.max(section.paragraphs.length + 2, 10), 24)}
                                            value={section.paragraphs.join('\n')}
                                            onChange={(event) => onUpdateSection(sectionIndex, 'paragraphs', event.target.value)}
                                            placeholder="브리핑 내용을 입력하세요. 줄바꿈으로 문단을 구분합니다."
                                        />
                                    </>
                                ) : (
                                    <>
                                        {selectedBriefing.sections.length > 1 && <h3 className="briefing-section-title">{section.title}</h3>}
                                        <div className="briefing-paragraphs">
                                            {section.paragraphs.map((paragraph, paragraphIndex) => (
                                                <p
                                                    key={`${selectedBriefing.id}-${sectionIndex}-${paragraphIndex}`}
                                                    className={paragraph.trimStart().startsWith('□') ? 'briefing-paragraph briefing-paragraph-heading' : 'briefing-paragraph'}
                                                >
                                                    {paragraph}
                                                </p>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </section>
                        ))}
                        {isEditMode && (
                            <button type="button" className="briefing-add-button briefing-add-section" onClick={onAddSection}>
                                + 예문 추가
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MediaResponsePage() {
    const router = useRouter();
    
    const [questions, setQuestions] = useState<QA[]>([]);
    const [briefingExamples, setBriefingExamples] = useState<BriefingExample[]>(BRIEFING_EXAMPLES);
    const [activeTab, setActiveTab] = useState<MediaTab>('general');
    const [selectedBriefingId, setSelectedBriefingId] = useState(BRIEFING_EXAMPLES[0]?.id ?? '');
    const [isLoading, setIsLoading] = useState(true);
    const [isBriefingLoading, setIsBriefingLoading] = useState(true);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const editSnapshot = useRef<{
        questions: QA[];
        briefings: BriefingExample[];
        selectedBriefingId: string;
    } | null>(null);
    
    const [showPinDialog, setShowPinDialog] = useState(false);
    const [pin, setPin] = useState('');
    const [pinError, setPinError] = useState(false);
    
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        fetchQA();
        fetchBriefings();
    }, []);

    const fetchQA = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('data')
                .eq('id', 'media-responses')
                .maybeSingle();

            if (error) throw error;

            if (data?.data) {
                const storedQuestions = typeof data.data === 'string'
                    ? JSON.parse(data.data)
                    : data.data;

                if (Array.isArray(storedQuestions)) {
                    setQuestions(storedQuestions as QA[]);
                    return;
                }
            }

            if (data?.data === null) {
                setQuestions(DEFAULT_QA_DATA);
            } else {
                setQuestions(DEFAULT_QA_DATA);
            }
        } catch (error) {
            console.error('Failed to parse Media Responses:', error);
            setQuestions(DEFAULT_QA_DATA);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBriefings = async () => {
        setIsBriefingLoading(true);
        try {
            const { data, error } = await supabase
                .from('reports')
                .select('data')
                .eq('id', 'media-briefing-examples')
                .maybeSingle();

            if (error) throw error;

            if (data?.data != null) {
                const stored = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
                if (!Array.isArray(stored) || !stored.every((example) =>
                    typeof example?.id === 'string' &&
                    typeof example?.disasterType === 'string' &&
                    Array.isArray(example?.sections) &&
                    example.sections.every((section: BriefingExample['sections'][number]) =>
                        typeof section?.title === 'string' &&
                        Array.isArray(section?.paragraphs) &&
                        section.paragraphs.every((paragraph) => typeof paragraph === 'string'))
                )) {
                    throw new Error('브리핑 예문 데이터 형식이 올바르지 않습니다.');
                }

                setBriefingExamples(stored as BriefingExample[]);
                setSelectedBriefingId(stored[0]?.id ?? '');
            }
        } catch (error) {
            console.error('Failed to load briefing examples:', error);
            setToast('브리핑 예문을 불러오지 못해 기본 예문을 표시합니다.');
        } finally {
            setIsBriefingLoading(false);
        }
    };

    const handleVerifyPin = () => {
        if (pin === '1234') {
            editSnapshot.current = { questions, briefings: briefingExamples, selectedBriefingId };
            setIsEditMode(true);
            setShowPinDialog(false);
            setPin('');
            setPinError(false);
            setToast('편집 모드가 활성화되었습니다.');
        } else {
            setPinError(true);
        }
    };

    const handleCancelEdit = () => {
        if (editSnapshot.current) {
            setQuestions(editSnapshot.current.questions);
            setBriefingExamples(editSnapshot.current.briefings);
            setSelectedBriefingId(editSnapshot.current.selectedBriefingId);
            editSnapshot.current = null;
        }
        setIsEditMode(false);
    };

    const handleSave = async () => {
        if (isSaving) return;
        if (activeTab === 'briefing' && briefingExamples.some((example) =>
            !example.disasterType.trim() || (example.sections.length > 1 && example.sections.some((section) => !section.title.trim())))) {
            setToast('재난 유형 이름과 예문 제목을 확인해 주세요.');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('reports')
                .upsert({
                    id: activeTab === 'briefing' ? 'media-briefing-examples' : 'media-responses',
                    data: activeTab === 'briefing' ? briefingExamples : questions,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

            if (error) throw error;
            setToast('저장되었습니다.');
            setIsEditMode(false);
            editSnapshot.current = null;
        } catch (error) {
            console.error(error);
            const message = error instanceof Error ? error.message : '알 수 없는 오류';
            setToast(`저장에 실패했습니다: ${message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const updateSelectedBriefing = (update: (example: BriefingExample) => BriefingExample) => {
        setBriefingExamples((examples) => examples.map((example) =>
            example.id === selectedBriefingId ? update(example) : example
        ));
    };

    const addBriefingExample = () => {
        const id = `briefing-${crypto.randomUUID()}`;
        setBriefingExamples((examples) => [
            ...examples,
            { id, disasterType: '새 재난 유형', sections: [{ title: '브리핑 예문', paragraphs: [''] }] },
        ]);
        setSelectedBriefingId(id);
    };

    const deleteBriefingExample = () => {
        if (!window.confirm('선택한 재난 유형과 모든 예문을 삭제할까요? 저장 전까지는 취소할 수 있습니다.')) return;
        const next = briefingExamples.filter((example) => example.id !== selectedBriefingId);
        setBriefingExamples(next);
        setSelectedBriefingId(next[0]?.id ?? '');
    };

    const updateBriefingSection = (sectionIndex: number, field: 'title' | 'paragraphs', value: string) => {
        updateSelectedBriefing((example) => ({
            ...example,
            sections: example.sections.map((section, index) => index === sectionIndex
                ? { ...section, [field]: field === 'paragraphs' ? value.split('\n') : value }
                : section),
        }));
    };

    const addBriefingSection = () => {
        updateSelectedBriefing((example) => ({
            ...example,
            sections: [...example.sections, { title: `${example.sections.length + 1}차 브리핑`, paragraphs: [''] }],
        }));
    };

    const addNewQA = () => {
        if (activeTab === 'briefing') return;

        const newId = Date.now().toString();
        setQuestions([
            ...questions,
            { id: newId, q: '', a: '', category: activeTab }
        ]);
    };

    const updateQA = (id: string, field: 'q' | 'a', value: string) => {
        setQuestions(questions.map(qa => 
            qa.id === id ? { ...qa, [field]: value } : qa
        ));
    };

    const deleteQA = (id: string) => {
        setQuestions(questions.filter(qa => qa.id !== id));
    };

    const filteredQuestions = useMemo(() => {
        if (activeTab === 'briefing') return [];
        return questions.filter(qa => qa.category === activeTab);
    }, [questions, activeTab]);

    const selectedBriefing = useMemo(() => {
        return briefingExamples.find(example => example.id === selectedBriefingId) ?? briefingExamples[0];
    }, [briefingExamples, selectedBriefingId]);

    const isBriefingTab = activeTab === 'briefing';

    return (
        <div className="page media-page">
            <div className="header">
                <button
                    onClick={() => {
                        if (isEditMode) {
                            handleCancelEdit();
                        } else {
                            router.back();
                        }
                    }} 
                    className="header-back"
                    disabled={isSaving}
                >
                    ←
                </button>
                <h1 className="header-title">언론 대응</h1>
            </div>

            <div className="page-content" style={{ padding: '0' }}>
                {/* 탭 헤더 */}
                <div className="media-tabs" role="tablist" aria-label="언론 대응 카테고리">
                    <button 
                        onClick={() => setActiveTab('general')}
                        disabled={isEditMode || isSaving}
                        role="tab"
                        aria-selected={activeTab === 'general'}
                        style={{ 
                            flex: '1 1 33.333%', minWidth: 0, padding: '12px 8px', border: 'none', background: 'none', fontSize: '14px', lineHeight: '1.3', fontWeight: 600,
                            color: activeTab === 'general' ? '#1976D2' : '#757575',
                            borderBottom: activeTab === 'general' ? '3px solid #1976D2' : '3px solid transparent'
                        }}
                    >
                        일반 질문 ({questions.filter(q => q.category === 'general').length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('pressure')}
                        disabled={isEditMode || isSaving}
                        role="tab"
                        aria-selected={activeTab === 'pressure'}
                        style={{ 
                            flex: '1 1 33.333%', minWidth: 0, padding: '12px 8px', border: 'none', background: 'none', fontSize: '14px', lineHeight: '1.3', fontWeight: 600,
                            color: activeTab === 'pressure' ? '#D32F2F' : '#757575',
                            borderBottom: activeTab === 'pressure' ? '3px solid #D32F2F' : '3px solid transparent'
                        }}
                    >
                        압박 질문 ({questions.filter(q => q.category === 'pressure').length})
                    </button>
                    <button
                        onClick={() => setActiveTab('briefing')}
                        disabled={isEditMode || isSaving}
                        role="tab"
                        aria-selected={activeTab === 'briefing'}
                        style={{
                            flex: '1 1 33.333%', minWidth: 0, padding: '12px 8px', border: 'none', background: 'none', fontSize: '14px', lineHeight: '1.3', fontWeight: 600,
                            color: activeTab === 'briefing' ? '#388E3C' : '#757575',
                            borderBottom: activeTab === 'briefing' ? '3px solid #388E3C' : '3px solid transparent'
                        }}
                    >
                        브리핑 예문 ({briefingExamples.length})
                    </button>
                </div>

                <div style={{ padding: '16px' }}>
                    <div className="media-toolbar">
                        <p style={{ color: '#757575', fontSize: '14px', margin: 0 }}>
                            {activeTab === 'general'
                                ? '사실 확인 중심 / 기본 브리핑'
                                : activeTab === 'pressure'
                                    ? '책임 / 문제 제기 대응'
                                    : '재난 유형별 언론브리핑 원문 예문'}
                        </p>
                        <div className="media-actions">
                            {isBriefingTab && !isEditMode && selectedBriefing && selectedBriefing.sections.length > 0 && (
                                <button type="button" onClick={() => window.print()} className="btn btn-secondary">
                                    🖨️ 출력
                                </button>
                            )}
                            {!isEditMode ? (
                                <button
                                    type="button"
                                    onClick={() => setShowPinDialog(true)}
                                    className="btn btn-secondary"
                                    disabled={isBriefingTab ? isBriefingLoading : isLoading}
                                >
                                    ✏️ 편집
                                </button>
                            ) : (
                                <>
                                    <button type="button" onClick={handleCancelEdit} className="btn btn-secondary" disabled={isSaving}>취소</button>
                                    <button type="button" onClick={handleSave} className="btn btn-primary" disabled={isSaving}>
                                        {isSaving ? '저장 중…' : '💾 저장'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* 압박 질문 가이드 포인트 */}
                    {activeTab === 'pressure' && (
                        <div className="card" style={{ marginBottom: '20px', padding: '16px', background: '#FFF3E0', border: '1px solid #FFE0B2' }}>
                            <div style={{ fontWeight: 800, color: '#E65100', marginBottom: '8px', fontSize: '14px' }}>📢 답변 포인트 (단정 절대 금지)</div>
                            <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#5D4037' }}>
                                <div style={{ marginBottom: '4px' }}>• 사실 설명 → 단정 회피 → 조사로 전환 → 동일 답변 유지</div>
                                <div>• &quot;현재 확인된 사실을 기준으로 말씀드리면...&quot;</div>
                                <div>• &quot;현 단계에서 단정적으로 말씀드리기는 어렵습니다.&quot;</div>
                                <div>• &quot;구체적 사항은 관계기관 조사 후 말씀드리겠습니다.&quot;</div>
                            </div>
                        </div>
                    )}

                    {isBriefingTab && isBriefingLoading ? (
                        <div className="briefing-empty">브리핑 예문을 불러오는 중...</div>
                    ) : isBriefingTab ? (
                        <BriefingExamplesPanel
                            selectedBriefing={selectedBriefing}
                            selectedBriefingId={selectedBriefingId}
                            examples={briefingExamples}
                            isEditMode={isEditMode}
                            onSelect={setSelectedBriefingId}
                            onAddExample={addBriefingExample}
                            onDeleteExample={deleteBriefingExample}
                            onUpdateDisasterType={(value) => updateSelectedBriefing((example) => ({ ...example, disasterType: value }))}
                            onUpdateSection={updateBriefingSection}
                            onAddSection={addBriefingSection}
                        />
                    ) : isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#9E9E9E' }}>
                            불러오는 중...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {filteredQuestions.length === 0 && !isEditMode && (
                                <div className="card" style={{ textAlign: 'center', color: '#9E9E9E', padding: '40px 20px' }}>
                                    해당 카테고리에 질문이 없습니다.
                                </div>
                            )}

                            {filteredQuestions.map((qa, index) => (
                                <div key={qa.id} className="card" style={{ padding: '16px' }}>
                                    {isEditMode ? (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <span style={{ fontWeight: 600, color: qa.category === 'pressure' ? '#D32F2F' : '#757575' }}>Q{index + 1}. 질문</span>
                                                <button 
                                                    onClick={() => deleteQA(qa.id)}
                                                    style={{ background: 'none', border: 'none', color: '#9E9E9E', cursor: 'pointer', fontSize: '16px' }}
                                                    title="삭제"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                            <textarea
                                                className="form-input"
                                                style={{ marginBottom: '12px', resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                                                rows={2}
                                                value={qa.q}
                                                onChange={(e) => updateQA(qa.id, 'q', e.target.value)}
                                                placeholder="예상 질문을 입력하세요..."
                                            />
                                            
                                            <div style={{ fontWeight: 600, color: '#1976D2', marginBottom: '8px' }}>A. 답변</div>
                                            <textarea
                                                className="form-input"
                                                style={{ resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                                                rows={3}
                                                value={qa.a}
                                                onChange={(e) => updateQA(qa.id, 'a', e.target.value)}
                                                placeholder="공식 답변을 입력하세요..."
                                            />
                                        </>
                                    ) : (
                                        <details style={{ cursor: 'pointer' }}>
                                            <summary style={{ outline: 'none', fontWeight: 600, fontSize: '15px', lineHeight: '1.4', listStylePosition: 'inside' }}>
                                                <span style={{ color: qa.category === 'pressure' ? '#D32F2F' : '#757575', marginRight: '6px' }}>Q.</span>
                                                <span style={{ wordBreak: 'keep-all' }}>{qa.q}</span>
                                            </summary>
                                            <div style={{ marginTop: '12px', padding: '12px', background: '#F5F5F5', borderRadius: '8px', fontSize: '14px', lineHeight: '1.6', wordBreak: 'keep-all', color: '#333' }}>
                                                <span style={{ color: '#1976D2', fontWeight: 600, marginRight: '6px' }}>A.</span>
                                                {qa.a.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                                            </div>
                                        </details>
                                    )}
                                </div>
                            ))}

                            {isEditMode && (
                                <button 
                                    onClick={addNewQA}
                                    className="card" 
                                    style={{ textAlign: 'center', background: '#E3F2FD', color: '#1976D2', fontWeight: 600, outline: 'none', cursor: 'pointer', border: '2px dashed #90CAF9' }}
                                >
                                    ➕ 새로운 {activeTab === 'general' ? '일반' : '압박'} 질문 추가
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* PIN 검증 다이얼로그 */}
            {showPinDialog && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="card" style={{ width: '90%', maxWidth: '320px' }}>
                        <div className="card-title">편집 권한 확인</div>
                        <p style={{ fontSize: '14px', color: '#757575', marginBottom: '16px' }}>
                            {isBriefingTab ? '브리핑 예문' : '질의응답'}을 수정하려면 관리자 PIN을 입력하세요.
                        </p>
                        <input
                            type="password"
                            className="form-input"
                            value={pin}
                            onChange={(e) => {
                                setPin(e.target.value);
                                setPinError(false);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
                            placeholder="PIN 입력"
                            maxLength={4}
                            autoFocus
                        />
                        {pinError && (
                            <p style={{ color: '#D32F2F', fontSize: '13px', marginTop: '8px' }}>
                                잘못된 PIN입니다.
                            </p>
                        )}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                            <button 
                                className="btn btn-secondary" 
                                style={{ flex: 1 }}
                                onClick={() => {
                                    setShowPinDialog(false);
                                    setPin('');
                                    setPinError(false);
                                }}
                            >
                                취소
                            </button>
                            <button 
                                className="btn btn-primary" 
                                style={{ flex: 1 }}
                                onClick={handleVerifyPin}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
    );
}
