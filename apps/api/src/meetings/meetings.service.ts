import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

type MeetingStatus = 'pending' | 'processing' | 'done' | 'error';

type ListMeetingsParams = {
  status?: string;
  take?: number;
  cursor?: string;
};

const isMeetingStatus = (value: string): value is MeetingStatus =>
  value === 'pending' ||
  value === 'processing' ||
  value === 'done' ||
  value === 'error';

@Injectable()
export class MeetingsService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  async list(params: ListMeetingsParams) {
    const take = Math.max(1, Math.min(100, Number(params.take ?? 10)));
    const status =
      params.status && isMeetingStatus(params.status)
        ? params.status
        : undefined;

    const items = await this.prisma.meeting.findMany({
      take: take + 1,
      ...(params.cursor ? { cursor: { id: params.cursor }, skip: 1 } : {}),
      where: status ? { classificationStatus: status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, classification: true },
    });

    const hasMore = items.length > take;
    const sliced = hasMore ? items.slice(0, take) : items;
    const nextCursor = hasMore ? (sliced[sliced.length - 1]?.id ?? null) : null;

    return { items: sliced, nextCursor };
  }
}
