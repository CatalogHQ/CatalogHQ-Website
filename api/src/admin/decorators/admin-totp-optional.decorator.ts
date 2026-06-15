import { ADMIN_TOTP_OPTIONAL_KEY } from '../constants/metadata';
import { SetMetadata } from '@nestjs/common';

export const AdminTotpOptional = () => SetMetadata(ADMIN_TOTP_OPTIONAL_KEY, true);
