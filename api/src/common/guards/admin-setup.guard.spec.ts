import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { AdminSetupGuard } from './admin-setup.guard';
import { IS_PUBLIC_KEY } from '../constants/metadata';

describe('AdminSetupGuard', () => {
  const reflector = {
    getAllAndOverride: jest.fn(),
  };

  let guard: AdminSetupGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AdminSetupGuard(reflector as unknown as Reflector);
  });

  it('allows admin setup routes before 2FA is enabled', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'admin-1',
              role: UserRole.admin,
              totpEnabled: false,
            },
            method: 'POST',
            originalUrl: '/admin/totp/setup',
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as never),
    ).toBe(true);
  });

  it('blocks other admin routes before 2FA is enabled', () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    expect(() =>
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              id: 'admin-1',
              role: UserRole.admin,
              totpEnabled: false,
            },
            method: 'GET',
            originalUrl: '/admin/stats',
          }),
        }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as never),
    ).toThrow(ForbiddenException);
  });
});
