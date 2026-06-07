export interface ScenarioSection {
    id: string;
    title: string;
    range: number[];
}

export interface ScenarioContentRow {
    situation: string;
    action: string;
    other: string;
}

export interface ScenarioPage {
    pageNumber: number;
    displayPageNumber?: number;
    sectionId: string;
    sectionTitle: string;
    title: string;
    text: string;
    rows?: ScenarioContentRow[];
    hasOtherColumn?: boolean;
}

export interface ScenarioDocument {
    title: string;
    sourceFilename: string;
    uploadedAt?: string;
    sections: ScenarioSection[];
    pages: ScenarioPage[];
}
