export interface DocumentResult {
    id: string;
    filename: string;
    file_type: string;
    file_size: number;
    document_category: string;
    category_confidence: number; 
    summary: string;
    extracted_text: string;
    processing_time: number;
    entities: any;   
    key_fields: any;
    status: string;
}

export interface Stats {
    total_documents: number;
    categories: Record<string, number>;
    avg_processing_time: number;
    avg_confidence: number;
}
