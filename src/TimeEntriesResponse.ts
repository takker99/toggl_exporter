export interface TimeEntriesResponse {
    id: number;
    wid: number;
    pid: number;
    billable: boolean;
    start: string; // ISO 8601
    stop: string; // ISO 8601
    duration: number;
    description?: string;
    tags: string[];
    at: string;
}
