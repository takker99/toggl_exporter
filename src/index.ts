/*
  Toggl time entries export to GoogleCalendar
  Copyright (c) 2017 - 2019 Masato Kawaguchi
  Released under the MIT license
  https://github.com/mkawaguchi/toggl_exporter/blob/master/LICENSE

  required: moment.js
    project-key: MHMchiX6c1bwSqGM1PZiW_PxhMjh3Sh48
*/
import { getTargetCalendar } from './settings';
import {
    getLastModifyDatetime,
    putLastModifyDatetime,
} from './LastModifyDatetime';
import { getTimeEntries, getProjectData } from './Toggl';

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
