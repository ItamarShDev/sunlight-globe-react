/**
 * Formats a date to a time string in the specified timezone
 * @param timezone The IANA timezone string (e.g., 'America/New_York')
 * @returns Formatted time string (e.g., '14:30')
 */
export const getTimeInTimezone = (timezone: string): string => {
  try {
    // Get current time in the specified timezone
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone
    };
    
    return new Date().toLocaleTimeString('en-US', options);
  } catch (error) {
    console.error(`Error getting time for timezone ${timezone}:`, error);
    return '--:--';
  }
};

/**
 * Extracts the IANA timezone from a country's timezone string
 * @param timezoneString The timezone string from the country data (e.g., 'UTC+02:00')
 * @returns IANA timezone string (e.g., 'Europe/Paris' for UTC+01:00)
 */
export const getIANATimezone = (timezoneString: string): string => {
  // This is a simplified mapping - in a real app, you'd want a more comprehensive solution
  const offset = timezoneString.replace('UTC', '').trim();
  
  // Map common offsets to IANA timezones
  const offsetToIANA: Record<string, string> = {
    '+00:00': 'UTC',
    '+01:00': 'Europe/Paris',
    '+02:00': 'Europe/Helsinki',
    '+03:00': 'Europe/Moscow',
    '-05:00': 'America/New_York',
    '-08:00': 'America/Los_Angeles',
    '+09:00': 'Asia/Tokyo',
    '+10:00': 'Australia/Sydney',
    // Add more mappings as needed
  };
  
  return offsetToIANA[offset] || 'UTC';
};
