import '@testing-library/jest-dom';

// Polyfill for Intl.DateTimeFormat in jsdom
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Intl.DateTimeFormat to return consistent results
global.Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
    format: () => '12:00 PM'
}));
