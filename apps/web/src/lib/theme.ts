export const defaultPrimaryColor = "#1f6f5b";

const hexColorPattern = /^#[0-9a-fA-F]{6}$/;

export function isValidHexColor(value: string) {
  return hexColorPattern.test(value);
}

export function normalizeHexColor(value: string) {
  const trimmedValue = value.trim();
  const withHash = trimmedValue.startsWith("#") ? trimmedValue : `#${trimmedValue}`;

  return withHash.toLowerCase();
}
