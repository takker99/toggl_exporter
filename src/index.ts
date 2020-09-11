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
import moment from 'moment';
const Moment = { moment: moment }; // GAS対策 cf. https://qiita.com/awa2/items/d24df6abd5fd5e4ca3d9

const TIME_OFFSET = 9 * 60 * 60; // JST

function getLastModifyDatetime() {
    let file = DriveApp.getFilesByName('toggl_exporter_cache');
    if (!file.hasNext()) {
        const now = Moment.moment().format('X');
        const beginning_of_day = parseInt(
            now - ((now % 86400) + TIME_OFFSET),
            10
        ).toFixed();
        putLastModifyDatetime(beginning_of_day);
        return beginning_of_day;
    }
    file = file.next();
    const data = JSON.parse(
        file.getAs('application/octet-stream').getDataAsString()
    );
    return parseInt(data[getCacheKey()], 10).toFixed();
}

function putLastModifyDatetime(unix_timestamp: string) {
    const cache: { [index: string]: string } = {};
    cache[getCacheKey()] = unix_timestamp;
    let file = DriveApp.getFilesByName('toggl_exporter_cache');
    if (!file.hasNext()) {
        DriveApp.createFile('toggl_exporter_cache', JSON.stringify(cache));
        return true;
    }
    file = file.next();
    file.setContent(JSON.stringify(cache));
    return true;
}

function getTimeEntries(unix_timestamp: string) {
    const uri = `https://www.toggl.com/api/v8/time_entries?start_date=${encodeURIComponent(
        Moment.moment(unix_timestamp, 'X').format()
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
        console.error([unix_timestamp, e]);
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
    started_at: string | number | Date,
    ended_at: string | number | Date
) {
    const calendar = CalendarApp.getCalendarById(getTargetCalendar());
    calendar.setTimeZone('Asia/Tokyo');
    calendar.createEvent(description, new Date(started_at), new Date(ended_at));
}

function watch() {
    try {
        const check_datetime = getLastModifyDatetime();
        const time_entries = getTimeEntries(check_datetime);

        if (!time_entries) return;
        let last_stop_datetime: string | undefined = undefined;
        for (const record of time_entries) {
            if (!record.stop) continue;

            const project_data = getProjectData(record.pid);
            const project_name = project_data ? project_data.name : '';
            const activity_log = [record.description, project_name].join(' : ');

            recordActivityLog(
                activity_log,
                Moment.moment(record.start).format(),
                Moment.moment(record.stop).format()
            );
            last_stop_datetime = record.stop;
        }
        if (!last_stop_datetime) return;
        putLastModifyDatetime(
            (
                parseInt(Moment.moment(last_stop_datetime).format('X'), 10) + 1
            ).toFixed()
        );
    } catch (e) {
        console.error(e);
    }
}
