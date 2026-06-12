import type { NinVerificationData } from './ashlab-nin-verification.service';

function readString(
  record: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function fromFlatRecord(
  record: Record<string, unknown>,
  fallbackNin: string,
): NinVerificationData | null {
  const firstName = readString(record, 'first_name', 'firstName');
  const lastName = readString(record, 'last_name', 'lastName');

  if (!firstName || !lastName) {
    return null;
  }

  return {
    nin: readString(record, 'nin', 'idNumber') ?? fallbackNin,
    first_name: firstName,
    last_name: lastName,
    middle_name: readString(record, 'middle_name', 'middleName'),
    date_of_birth: readString(record, 'date_of_birth', 'dateOfBirth'),
    gender: readString(record, 'gender'),
    phone: readString(record, 'phone', 'mobile'),
  };
}

export function parseAshlabNinVerificationData(
  body: unknown,
  fallbackNin: string,
): NinVerificationData | null {
  if (!body || typeof body !== 'object' || (body as { success?: boolean }).success !== true) {
    return null;
  }

  const root = body as Record<string, unknown>;
  const data = root.data;

  if (!data || typeof data !== 'object') {
    return null;
  }

  const dataRecord = data as Record<string, unknown>;
  const flat = fromFlatRecord(dataRecord, fallbackNin);
  if (flat) {
    return flat;
  }

  const raw = dataRecord._raw;
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const rawRecord = raw as Record<string, unknown>;
  const inner = rawRecord.data;

  if (!inner || typeof inner !== 'object') {
    return null;
  }

  return fromFlatRecord(inner as Record<string, unknown>, fallbackNin);
}
