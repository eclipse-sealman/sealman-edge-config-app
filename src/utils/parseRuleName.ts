const INVALID_CHARS_REGEX = /[^a-zA-Z0-9 _]/;

const RULE_NAME_ERROR =
  "Rule name must not contain special symbols. Only letters, digits, spaces, and underscores (_) are permitted.";

/**
 * Validates and sanitizes a rule name for devices.
 * Spaces are automatically converted to underscores.
 * Returns an error message if unsupported special characters are present.
 */
export function parseRuleName(name: string): { value: string; error: string | null } {
  if (INVALID_CHARS_REGEX.test(name)) {
    return { value: name, error: RULE_NAME_ERROR };
  }
  return { value: name.replace(/ /g, "_"), error: null };
}
