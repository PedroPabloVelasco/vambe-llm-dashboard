export type CsvRow = {
  Nombre: string;
  'Correo Electronico': string;
  'Numero de Telefono': string;
  'Fecha de la Reunion': string;
  'Vendedor asignado': string;
  closed: string | number;
  Transcripcion: string;
};

export type IngestSummary = {
  rows: number;
  customersUpserted: number;
  meetingsCreated: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
};
