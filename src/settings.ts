export function getCacheKey(): string {
    const scriptProperties = PropertiesService.getScriptProperties();
    const key = scriptProperties.getProperty('CACHE_KEY');
    if (key) return key;
    throw 'no cache key';
}

export function getTogglToken(): string {
    const scriptProperties = PropertiesService.getScriptProperties();
    const token = scriptProperties.getProperty('TOGGL_BASIC_AUTH');
    if (token) return token;
    throw 'no toggl token available';
}

export function getTargetCalendar(): string {
    const scriptProperties = PropertiesService.getScriptProperties();
    const calendarId = scriptProperties.getProperty('GOOGLE_CALENDAR_ID');
    if (calendarId) return calendarId;
    throw 'no calendar id available';
}
