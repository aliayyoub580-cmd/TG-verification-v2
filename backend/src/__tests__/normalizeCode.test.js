const { normalizeCode } = require('../utils/csvUtils');

describe('normalizeCode', () => {
  test('trims whitespace', () => {
    expect(normalizeCode('  7GG6Y89U8K  ')).toBe('7GG6Y89U8K');
  });

  test('preserves client-provided casing', () => {
    expect(normalizeCode('7gg6y89u8k')).toBe('7gg6y89u8k');
  });

  test('trims without changing the code', () => {
    expect(normalizeCode(' abc123 ')).toBe('abc123');
  });

  test('returns empty string for non-string input', () => {
    expect(normalizeCode(null)).toBe('');
    expect(normalizeCode(undefined)).toBe('');
    expect(normalizeCode(123)).toBe('');
  });

  test('handles already normalized code', () => {
    expect(normalizeCode('7GG6Y89U8K')).toBe('7GG6Y89U8K');
  });

  test('extracts code query param from full URL', () => {
    expect(normalizeCode('https://tg-verification-v2.vercel.app/verify?code=2VXT4TN5RB')).toBe('2VXT4TN5RB');
    expect(normalizeCode('https://tg-verification-xi.vercel.app/verify?code=2VXT4TN5RB')).toBe('2VXT4TN5RB');
    expect(normalizeCode('http://localhost:5173/verify?code=ABC987XYZ')).toBe('ABC987XYZ');
    expect(normalizeCode('/verify?code=TEST1234')).toBe('TEST1234');
  });
});
