import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FLUTTERWAVE_TOKEN_URL } from './flutterwave.config';

type TokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
};

@Injectable()
export class FlutterwaveAuthService {
  private readonly logger = new Logger(FlutterwaveAuthService.name);
  private readonly clientId: string | undefined;
  private readonly clientSecret: string | undefined;

  private accessToken: string | null = null;
  private expiresAt = 0;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('FLUTTERWAVE_CLIENT_ID');
    this.clientSecret = this.configService.get<string>(
      'FLUTTERWAVE_CLIENT_SECRET',
    );
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  async getAccessToken(): Promise<string | null> {
    if (!this.clientId || !this.clientSecret) {
      return null;
    }

    const secondsLeft = (this.expiresAt - Date.now()) / 1000;
    if (this.accessToken && secondsLeft > 60) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials',
    });

    const response = await fetch(FLUTTERWAVE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const payload = (await response.json()) as TokenResponse;
    if (!response.ok || !payload.access_token) {
      this.logger.error('Flutterwave OAuth token request failed.');
      throw new InternalServerErrorException('Could not authenticate payment.');
    }

    this.accessToken = payload.access_token;
    this.expiresAt = Date.now() + (payload.expires_in ?? 600) * 1000;
    return this.accessToken;
  }
}
