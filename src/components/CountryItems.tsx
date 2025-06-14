import type { Country } from "../types";
const UTC_TO_TIMEZONE: { [key: string]: string } = {
    "UTC+00:00": "UTC",
    "UTC+01:00": "Europe/London",
    "UTC+02:00": "Europe/Athens",
    "UTC+03:00": "Europe/Moscow",
    "UTC+04:00": "Asia/Dubai",
    "UTC+05:00": "Asia/Tashkent",
    "UTC+06:00": "Asia/Dhaka",
    "UTC+07:00": "Asia/Bangkok",
    "UTC+08:00": "Asia/Singapore",
    "UTC+09:00": "Asia/Tokyo",
    "UTC+10:00": "Australia/Sydney",
    "UTC+11:00": "Pacific/Noumea",
    "UTC+12:00": "Pacific/Auckland",
    "UTC-01:00": "Atlantic/Azores",
    "UTC-02:00": "America/Noronha",
    "UTC-03:00": "America/Sao_Paulo",
    "UTC-04:00": "America/New_York",
    "UTC-05:00": "America/Chicago",
    "UTC-06:00": "America/Mexico_City",
    "UTC-07:00": "America/Denver",
    "UTC-08:00": "America/Los_Angeles",
    "UTC-09:00": "America/Anchorage",
    "UTC-10:00": "Pacific/Honolulu",
    "UTC-11:00": "Pacific/Midway",
    "UTC-12:00": "Etc/GMT+12",
};

const COUNTRY_TIMEZONE_FALLBACK: { [key: string]: string } = {
    "United States": "America/New_York",
    Russia: "Europe/Moscow",
    Canada: "America/Toronto",
    Australia: "Australia/Sydney",
    Brazil: "America/Sao_Paulo",
    China: "Asia/Shanghai",
    India: "Asia/Kolkata",
    "United Kingdom": "Europe/London",
};


export const CountryItems = ({ selectedCountry, filteredCountries, handleCountryClick }: { selectedCountry: string | null, filteredCountries: Country[], handleCountryClick: (country: Country) => void }) => {

    return (
        filteredCountries?.map((country) => {
            const timezone = country.timezones?.[0] || "UTC+00:00";
            let calculatedTime = "N/A";

            try {
                // Determine the most appropriate timezone
                let timezoneName = UTC_TO_TIMEZONE[timezone];

                // Fallback for countries with multiple timezones or not in our mapping
                if (!timezoneName) {
                    // Try to find a fallback based on country name
                    const fallbackCountry = Object.keys(
                        COUNTRY_TIMEZONE_FALLBACK,
                    ).find((key) => country.name.common.includes(key));

                    timezoneName = fallbackCountry
                        ? COUNTRY_TIMEZONE_FALLBACK[fallbackCountry]
                        : "UTC";
                }

                // Create a formatter with the specific timezone
                const formatter = new Intl.DateTimeFormat("en-US", {
                    timeZone: timezoneName,
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                });

                // Get the local time in the specified timezone
                calculatedTime = formatter.format(new Date());
            } catch (error) {
                // Silently handle any time calculation errors
                calculatedTime = "N/A";
            }

            return (
                <div
                    key={country.name.common}
                    className={`country-item ${selectedCountry === country.name.common ? "selected" : ""}`}
                    onClick={() => handleCountryClick(country)}
                >
                    <div className="country-info">
                        <span className="country-name">{country.name.common}</span>
                        <span className="country-offset">
                            {timezone.replace("UTC", "GMT")}
                        </span>
                    </div>
                    <span className="country-time">{calculatedTime}</span>
                </div>
            );
        })
    )
}