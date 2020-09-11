const LAST_MODIFIED_DATETIME = 'LAST_MODIFIED_DATETIME';

export function getLastModifyDatetime() {
    const scriptProperties = PropertiesService.getScriptProperties();
    const lastModifiedDatetime = scriptProperties.getProperty(
        LAST_MODIFIED_DATETIME
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

export function putLastModifyDatetime(unix_timestamp: number) {
    const scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty(
        LAST_MODIFIED_DATETIME,
        unix_timestamp.toString()
    );
    return true;
}
