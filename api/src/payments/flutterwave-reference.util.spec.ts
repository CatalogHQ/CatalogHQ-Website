import { buildFlutterwaveReference } from './flutterwave-reference.util';

describe('buildFlutterwaveReference', () => {
  it('uses hyphens only (no underscores) for Flutterwave v4', () => {
    const ref = buildFlutterwaveReference('SHP-20260612-ABCD');
    expect(ref).toBe('flw-SHP-20260612-ABCD');
    expect(ref).toMatch(/^[a-zA-Z0-9-]+$/);
  });
});
