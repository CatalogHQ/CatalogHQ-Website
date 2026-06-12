import {
  ninIdentityMatchesVendor,
  normalizePersonName,
} from './nin-identity.util';

describe('nin-identity.util', () => {
  it('normalizes names for comparison', () => {
    expect(normalizePersonName('  Chidi  ')).toBe('chidi');
    expect(normalizePersonName("O'Brien")).toBe("o'brien");
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
});
