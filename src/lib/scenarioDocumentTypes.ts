export interface ScenarioSection {
    id: string;
    title: string;
    range: number[];
}

export interface ScenarioPage {
    pageNumber: number;
    displayPageNumber?: number;
    sectionId: string;
    sectionTitle: string;
    title: string;
    text: string;
}

export interface ScenarioDocument {
    title: string;
    sourceFilename: string;
    uploadedAt?: string;
    sections: ScenarioSection[];
    pages: ScenarioPage[];
}
