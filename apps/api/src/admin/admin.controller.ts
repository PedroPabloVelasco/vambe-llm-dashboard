import { Controller, Post } from '@nestjs/common';

import { PrismaService } from '../prisma.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('reset')
  async reset() {
    const [classificationsDeleted, meetingsDeleted, customersDeleted] =
      await this.prisma.$transaction(async (tx) => {
        const [cls, meetings, customers] = await Promise.all([
          tx.classification.count(),
          tx.meeting.count(),
          tx.customer.count(),
        ]);

        await tx.classification.deleteMany();
        await tx.meeting.deleteMany();
        await tx.customer.deleteMany();

        return [cls, meetings, customers] as const;
      });

    return {
      classificationsDeleted,
      meetingsDeleted,
      customersDeleted,
      message:
        'Se eliminaron los registros. Sube un nuevo CSV para continuar trabajando.',
    };
  }
}
