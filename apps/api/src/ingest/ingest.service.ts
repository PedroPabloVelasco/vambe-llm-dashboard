import { Injectable } from '@nestjs/common';
import Papa from 'papaparse';

import { PrismaService } from '../prisma.service';

import type { CsvRow, IngestSummary } from './ingest.types';

@Injectable()
export class IngestService {
  private readonly prisma: PrismaService;

  constructor(prisma: PrismaService) {
    this.prisma = prisma;
  }

  parseCsv(content: string): CsvRow[] {
    const parsed = Papa.parse<CsvRow>(content, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      const msg = parsed.errors[0]?.message ?? 'Error parseando CSV';
      throw new Error(msg);
    }

    return parsed.data;
  }

  async ingestRows(rows: CsvRow[]): Promise<IngestSummary> {
    let customersUpserted = 0;
    let meetingsCreated = 0;
    let skipped = 0;
    const errors: IngestSummary['errors'] = [];

    for (let i = 0; i < rows.length; i += 1) {
      const r = rows[i];
      const rowNumber = i + 2;

      try {
        const email = (r['Correo Electronico'] ?? '').trim().toLowerCase();
        if (!email) {
          skipped += 1;
          errors.push({ row: rowNumber, reason: 'Email vacío' });
          continue;
        }

        const meetingDateRaw = (r['Fecha de la Reunion'] ?? '').trim();
        const meetingDate = new Date(meetingDateRaw);
        if (Number.isNaN(meetingDate.getTime())) {
          skipped += 1;
          errors.push({ row: rowNumber, reason: 'Fecha inválida' });
          continue;
        }

        const closed = String(r.closed).trim() === '1';
        const name = (r.Nombre ?? '').trim() || 'Sin nombre';
        const phone = (r['Numero de Telefono'] ?? '').trim() || null;
        const seller = (r['Vendedor asignado'] ?? '').trim() || 'Unknown';
        const transcript = r.Transcripcion ?? '';

        const customer = await this.prisma.customer.upsert({
          where: { email },
          update: { name, phone },
          create: { name, email, phone },
        });

        customersUpserted += 1;

        await this.prisma.meeting.create({
          data: {
            customerId: customer.id,
            meetingDate,
            seller,
            closed,
            transcript,
          },
        });

        meetingsCreated += 1;
      } catch (e) {
        skipped += 1;
        errors.push({
          row: rowNumber,
          reason: e instanceof Error ? e.message : 'Error desconocido',
        });
      }
    }

    return {
      rows: rows.length,
      customersUpserted,
      meetingsCreated,
      skipped,
      errors,
    };
  }
}
