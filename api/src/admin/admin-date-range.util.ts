import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AdminDateRangeQueryDto } from './dto/admin-date-range-query.dto';

export type ParsedAdminDateRange = {
  from?: Date;
  to?: Date;
};

function parseDateOnly(value: string, endOfDay: boolean): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    throw new BadRequestException('Invalid date format. Use YYYY-MM-DD.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = endOfDay
    ? new Date(year, month, day, 23, 59, 59, 999)
    : new Date(year, month, day, 0, 0, 0, 0);

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Invalid date.');
  }

  return date;
}

export function parseAdminDateRange(
  query: AdminDateRangeQueryDto,
): ParsedAdminDateRange {
  const from = query.from ? parseDateOnly(query.from, false) : undefined;
  const to = query.to ? parseDateOnly(query.to, true) : undefined;

  if (from && to && from.getTime() > to.getTime()) {
    throw new BadRequestException('from must be on or before to.');
  }

  return { from, to };
}

export function buildCreatedAtFilter(
  range: ParsedAdminDateRange,
): Prisma.DateTimeFilter | undefined {
  if (!range.from && !range.to) {
    return undefined;
  }

  return {
    ...(range.from ? { gte: range.from } : {}),
    ...(range.to ? { lte: range.to } : {}),
  };
}
