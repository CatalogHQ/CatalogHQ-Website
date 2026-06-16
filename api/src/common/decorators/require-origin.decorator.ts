import { SetMetadata } from '@nestjs/common';
import { REQUIRE_ORIGIN_KEY } from '../constants/metadata';

/** Require allowed Origin/Referer even on @Public() routes (e.g. auth cookie issuance). */
export const RequireOrigin = () => SetMetadata(REQUIRE_ORIGIN_KEY, true);
