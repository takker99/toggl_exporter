/*
  Toggl time entries export to GoogleCalendar
  Copyright (c) 2017 - 2019 Masato Kawaguchi
  Released under the MIT license
  https://github.com/mkawaguchi/toggl_exporter/blob/master/LICENSE

  required: moment.js
    project-key: MHMchiX6c1bwSqGM1PZiW_PxhMjh3Sh48
*/
import { getCacheKey, getTogglToken, getTargetCalendar } from './settings';
import { TimeEntriesResponse } from './TimeEntriesResponse';
import { ProjectsResponse } from './ProjectsResponse';

const CACHE_FILE_NAME = 'toggl_exporter_cache';

function getLastModifyDatetime() {
    const scriptProperties = PropertiesService.getScriptProperties();
    const lastModifiedDatetime = scriptProperties.getProperty(
        'LAST_MODIFIED_DATETIME'
    );
    if (lastModifiedDatetime) return parseInt(lastModifiedDatetime);
    // 値がなければ新規に設定する
    const beginning_of_day = new Date();
    beginning_of_day.setTime(Date.now());
    beginning_of_day.setUTCHours(-9, 0, 0, 0);
    console.log(
        `Time entries from ${beginning_of_day.toISOString()} will be logged.`
    );
    putLastModifyDatetime(beginning_of_day.getTime());
    return beginning_of_day.getTime();
}

function putLastModifyDatetime(unix_timestamp: number) {
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty(
        'LAST_MODIFIED_DATETIME',
        unix_timestamp.toString()
    );
    return true;
}

function getTimeEntries(unix_timestamp: number) {
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

function getProjectData(project_id: number) {
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

function recordActivityLog(
    description: string,
    started_at: number,
    ended_at: number
) {
    const calendar = CalendarApp.getCalendarById(getTargetCalendar());
    calendar.setTimeZone('Asia/Tokyo');
    const { start, end } = { start: new Date(), end: new Date() };
    start.setTime(started_at);
    end.setTime(ended_at);
    calendar.createEvent(description, start, end);
    console.log(
        `Registered the event:\n\ttitle: ${description}\n\tstart: ${start.toISOString()}\n\tend: ${end.toISOString()}`
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function watch() {
    try {
        const check_timestamp = getLastModifyDatetime();
        const time_entries = getTimeEntries(check_timestamp);

        if (!time_entries) return;
        let last_stop_datetime: string | undefined = undefined;
        for (const record of time_entries) {
            if (!record.stop) continue;

            const project_data = getProjectData(record.pid);
            const project_name = project_data
                ? project_data.name
                : 'no project';

            recordActivityLog(
                `${record.description} : ${project_name}`,
                Date.parse(record.start),
                Date.parse(record.stop)
            );
            last_stop_datetime = record.stop;
        }
        if (!last_stop_datetime) return;
        putLastModifyDatetime(Date.parse(last_stop_datetime));
    } catch (e) {
        console.error(e);
    }
}
