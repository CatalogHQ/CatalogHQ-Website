import {
  ninIdentityMatchesVendor,
  normalizePersonName,
  personNamesMatch,
  tokenizePersonName,
  verifiedLegalNameMatchesBankAccount,
} from './nin-identity.util';

describe('nin-identity.util', () => {
  it('normalizes names for comparison', () => {
    expect(normalizePersonName('  Chidi  ')).toBe('chidi');
    expect(normalizePersonName("O'Brien")).toBe("o'brien");
  });

  it('tokenizes names and drops titles', () => {
    expect(tokenizePersonName('Mr Godwin Adigun')).toEqual([
      'godwin',
      'adigun',
    ]);
  });

  it('matches when first and last names align', () => {
    expect(
      ninIdentityMatchesVendor(
        { legalFirstName: 'John', legalLastName: 'Doe' },
        { first_name: 'John', last_name: 'Doe' },
      ),
    ).toBe(true);
  });

  it('matches when casing and spacing differ', () => {
    expect(
      ninIdentityMatchesVendor(
        { legalFirstName: '  amaka ', legalLastName: 'Okafor' },
        { first_name: 'Amaka', last_name: 'OKAFOR' },
      ),
    ).toBe(true);
  });

  it('matches reordered legal names against NIN record', () => {
    expect(
      personNamesMatch('Adigun Godwin', 'Godwin Adigun Toluwashe'),
    ).toBe(true);
    expect(
      personNamesMatch('Godwin Adigun Toluwashe', 'Adigun Godwin Toluwashe'),
    ).toBe(true);
    expect(personNamesMatch('Godwin Adigun', 'Adigun Godwin')).toBe(true);
  });

  it('matches vendor legal name to NIN with middle name', () => {
    expect(
      ninIdentityMatchesVendor(
        { legalFirstName: 'Godwin', legalLastName: 'Adigun' },
        {
          first_name: 'Godwin',
          middle_name: 'Toluwashe',
          last_name: 'Adigun',
        },
      ),
    ).toBe(true);
  });

  it('matches bank account names to verified legal name', () => {
    expect(
      verifiedLegalNameMatchesBankAccount(
        { legalFirstName: 'Godwin', legalLastName: 'Adigun' },
        'ADIGUN GODWIN TOLUWASHE',
      ),
    ).toBe(true);
    expect(
      verifiedLegalNameMatchesBankAccount(
        { legalFirstName: 'Godwin', legalLastName: 'Adigun' },
        'Adigun Godwin',
      ),
    ).toBe(true);
  });

  it('rejects when first or last name differs', () => {
    expect(
      ninIdentityMatchesVendor(
        { legalFirstName: 'John', legalLastName: 'Doe' },
        { first_name: 'Jane', last_name: 'Doe' },
      ),
    ).toBe(false);

    expect(
      ninIdentityMatchesVendor(
        { legalFirstName: 'John', legalLastName: 'Doe' },
        { first_name: 'John', last_name: 'Smith' },
      ),
    ).toBe(false);
  });

  it('rejects unrelated bank account names', () => {
    expect(
      verifiedLegalNameMatchesBankAccount(
        { legalFirstName: 'Godwin', legalLastName: 'Adigun' },
        'Jane Smith',
      ),
    ).toBe(false);
    expect(
      verifiedLegalNameMatchesBankAccount(
        { legalFirstName: 'Godwin', legalLastName: 'Adigun' },
        'Godwin Smith',
      ),
    ).toBe(false);
  });
});
