/**
 * Lightweight Zodiac sun sign helper exposed as a Netlify Function.
 * Accepts a date of birth (`dob`) either as a query parameter (GET)
 * or in the JSON body (POST) and responds with the matching sun sign.
 */

const SIGNS = [
  { name: "Capricorn", start: [12, 22], end: [1, 19] },
  { name: "Aquarius", start: [1, 20], end: [2, 18] },
  { name: "Pisces", start: [2, 19], end: [3, 20] },
  { name: "Aries", start: [3, 21], end: [4, 19] },
  { name: "Taurus", start: [4, 20], end: [5, 20] },
  { name: "Gemini", start: [5, 21], end: [6, 20] },
  { name: "Cancer", start: [6, 21], end: [7, 22] },
  { name: "Leo", start: [7, 23], end: [8, 22] },
  { name: "Virgo", start: [8, 23], end: [9, 22] },
  { name: "Libra", start: [9, 23], end: [10, 22] },
  { name: "Scorpio", start: [10, 23], end: [11, 21] },
  { name: "Sagittarius", start: [11, 22], end: [12, 21] },
];

export function isValidDate(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day));
  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  );
}

export function isWithinRange(month, day, range) {
  const [startMonth, startDay] = range.start;
  const [endMonth, endDay] = range.end;

  if (startMonth === endMonth) {
    return month === startMonth && day >= startDay && day <= endDay;
  }

  if (startMonth < endMonth) {
    if (month < startMonth || month > endMonth) {
      return false;
    }

    if (month === startMonth) {
      return day >= startDay;
    }

    if (month === endMonth) {
      return day <= endDay;
    }

    return true;
  }

  // Range wraps across the end of the year (e.g. Capricorn).
  if (month > startMonth || month < endMonth) {
    return true;
  }

  if (month === startMonth) {
    return day >= startDay;
  }

  if (month === endMonth) {
    return day <= endDay;
  }

  return false;
}

export function getSunSign(month, day) {
  for (const sign of SIGNS) {
    if (isWithinRange(month, day, sign)) {
      return sign.name;
    }
  }

  // Capricorn straddles the year boundary and doubles as the fallback.
  return "Capricorn";
}

function parseDob(event) {
  if (event.httpMethod === "GET") {
    return (event.queryStringParameters && event.queryStringParameters.dob) || "";
  }

  if (event.httpMethod === "POST") {
    if (!event.body) {
      return "";
    }

    try {
      const payload = JSON.parse(event.body);
      if (payload && typeof payload.dob === "string") {
        return payload.dob;
      }
    } catch (error) {
      return { error: "Invalid JSON body" };
    }

    return "";
  }

  return { error: "Method not allowed" };
}

export async function handler(event) {
  if (!["GET", "POST"].includes(event.httpMethod)) {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  const dobValue = parseDob(event);
  if (dobValue && dobValue.error) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: dobValue.error }),
    };
  }

  const dob = typeof dobValue === "string" ? dobValue.trim() : "";

  if (!dob) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Expected dob in YYYY-MM-DD format" }),
    };
  }

  const match = dob.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Expected dob in YYYY-MM-DD format" }),
    };
  }

  const [, yearStr, monthStr, dayStr] = match;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!isValidDate(year, month, day)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Invalid calendar date" }),
    };
  }

  const sunSign = getSunSign(month, day);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify({
      sun_sign: sunSign,
      dob,
    }),
  };
}

export default handler;
