import { getTogglToken } from './settings';
import { ProjectsResponse } from './ProjectsResponse';
import { TimeEntriesResponse } from './TimeEntriesResponse';

export function getTimeEntries(unix_timestamp: number) {
    const date = new Date();
    date.setTime(unix_timestamp);
    console.log(`Getting time entries from ${date.toISOString()}...`);
    const uri = `https://www.toggl.com/api/v8/time_entries?start_date=${encodeURIComponent(
        date.toISOString()
    )}`;
    const response = UrlFetchApp.fetch(uri, {
        method: 'get',
        headers: {
            Authorization: ` Basic ${Utilities.base64Encode(getTogglToken())}`,
        },
        muteHttpExceptions: true,
    });
    try {
        return JSON.parse(response.getContentText()) as TimeEntriesResponse[];
    } catch (e) {
        console.error([date.toISOString(), e]);
    }
}

export function getProjectData(project_id: number) {
    const uri = `https://www.toggl.com/api/v8/projects/${project_id}`;
    const response = UrlFetchApp.fetch(uri, {
        method: 'get',
        headers: {
            Authorization: ` Basic ${Utilities.base64Encode(getTogglToken())}`,
        },
        muteHttpExceptions: true,
    });
    try {
        return JSON.parse(response.getContentText()).data as ProjectsResponse;
    } catch (e) {
        console.error(['getProjectData', e]);
    }
}
