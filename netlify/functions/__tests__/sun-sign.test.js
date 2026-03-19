import { describe, expect, it } from 'vitest';
import handler, { getSunSign, isValidDate, isWithinRange } from '../sun-sign.js';

const buildEvent = (overrides = {}) => ({
  httpMethod: 'GET',
  headers: {},
  queryStringParameters: {},
  body: undefined,
  ...overrides,
});

describe('getSunSign', () => {
  it('returns Aquarius for January 25', () => {
    expect(getSunSign(1, 25)).toBe('Aquarius');
  });

  it('returns Capricorn for December 22', () => {
    expect(getSunSign(12, 22)).toBe('Capricorn');
  });

  it('handles boundary days inclusively', () => {
    expect(getSunSign(3, 20)).toBe('Pisces');
    expect(getSunSign(3, 21)).toBe('Aries');
  });
});

describe('isValidDate', () => {
  it('accepts real calendar dates', () => {
    expect(isValidDate(1992, 2, 29)).toBe(true);
  });

  it('rejects impossible dates', () => {
    expect(isValidDate(2024, 2, 30)).toBe(false);
  });
});

describe('isWithinRange', () => {
  it('understands ranges spanning a calendar year', () => {
    const capricorn = { name: 'Capricorn', start: [12, 22], end: [1, 19] };
    expect(isWithinRange(12, 31, capricorn)).toBe(true);
    expect(isWithinRange(1, 5, capricorn)).toBe(true);
    expect(isWithinRange(2, 1, capricorn)).toBe(false);
  });
});

describe('handler', () => {
  it('responds with sun sign for GET query input', async () => {
    const response = await handler(
      buildEvent({
        queryStringParameters: { dob: '1992-02-25' },
      })
    );

    expect(response.statusCode).toBe(200);
    const payload = JSON.parse(response.body);
    expect(payload).toEqual({ sun_sign: 'Pisces', dob: '1992-02-25' });
  });

  it('responds with sun sign for POST JSON input', async () => {
    const response = await handler(
      buildEvent({
        httpMethod: 'POST',
        body: JSON.stringify({ dob: '1988-07-22' }),
      })
    );

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).sun_sign).toBe('Cancer');
  });

  it('rejects unsupported methods', async () => {
    const response = await handler(buildEvent({ httpMethod: 'PUT' }));
    expect(response.statusCode).toBe(405);
  });

  it('rejects invalid payloads', async () => {
    const response = await handler(
      buildEvent({
        httpMethod: 'POST',
        body: '{"dob": "2024-02-30"}',
      })
    );

    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toContain('Invalid calendar date');
  });
});
