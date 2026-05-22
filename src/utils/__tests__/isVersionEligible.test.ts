import isVersionEligible from "../isVersionEligible";

describe('isVersionEligible', () => {
  test('returns true when current version is greater than required version', () => {
    expect(isVersionEligible('1.2.0', '1.1.9')).toBe(true);
    expect(isVersionEligible('2.0.0', '1.9.9')).toBe(true);
    expect(isVersionEligible('1.1.1', '1.0.9')).toBe(true);
  });

  test('returns false when current version is less than required version', () => {
    expect(isVersionEligible('1.0.0', '1.0.1')).toBe(false);
    expect(isVersionEligible('1.0.0', '1.1.0')).toBe(false);
    expect(isVersionEligible('0.9.9', '1.0.0')).toBe(false);
  });

  test('returns true when both versions are equal', () => {
    expect(isVersionEligible('1.0.0', '1.0.0')).toBe(true);
    expect(isVersionEligible('1.2.3', '1.2.3')).toBe(true);
  });

  test('handles versions with different lengths', () => {
    expect(isVersionEligible('1.2', '1.2.0')).toBe(true);  // Treating shorter version as if trailing zeros
    expect(isVersionEligible('1.2.0', '1.2')).toBe(true);
    expect(isVersionEligible('1.0', '1.1.0')).toBe(false);
    expect(isVersionEligible('0.9', '1.0.1')).toBe(false);
  });

  test('handles edge cases', () => {
    expect(isVersionEligible('', '')).toBe(true);        // Both are empty
    expect(isVersionEligible('1.0.0', '')).toBe(true);   // Assuming an empty required version defaults to allow
    expect(isVersionEligible('', '1.0.0')).toBe(false);  // Any non-empty version is greater than an empty current
  });
});
