export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

export function getPasswordPolicyError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (password.length > PASSWORD_MAX_LENGTH) return `Use no máximo ${PASSWORD_MAX_LENGTH} caracteres.`;
  return null;
}

export function isPasswordPolicySatisfied(password: string): boolean {
  return getPasswordPolicyError(password) === null;
}
