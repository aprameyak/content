import { authenticator } from 'otplib';
import { config } from '../config';

authenticator.options = {
  digits: 6,
  step: 30,
  window: 1, // Allow 1 step drift
};

export function generateTOTPSecret(): string {
  return authenticator.generateSecret(config.TOTP_SECRET_LENGTH);
}

export function verifyTOTPToken(token: string, secret: string): boolean {
  return authenticator.verify({ token, secret });
}

export function getTOTPUri(username: string, secret: string): string {
  return authenticator.keyuri(username, 'Chronicle', secret);
}
