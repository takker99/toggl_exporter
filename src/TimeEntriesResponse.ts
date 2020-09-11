export interface TimeEntriesResponse {
    id: number;
    wid: number;
    pid: number;
    billable: boolean;
    start: string;
    stop: string;
    duration: number;
    description?: string;
    tags: string[];
    at: string;
}
