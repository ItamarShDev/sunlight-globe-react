export interface Country {
    name: {
        common: string;
        official: string;
    };
    latlng: number[];
    timezones?: string[];
}

export interface SunPosition {
    lat: number;
    lng: number;
}

export interface CountryTimeZone {
    [countryName: string]: string;
}
