'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  api,
  type ClassificationRunSummary,
  type ClassificationStatusSummary,
  type IngestSummary,
} from '../lib/api';

const numberFormat = new Intl.NumberFormat('es-CL');
const formatDuration = (seconds: number) => {
  const totalSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const parts: string[] = [];
  if (hours) {
    parts.push(`${hours} ${hours === 1 ? 'hora' : 'horas'}`);
  }
  if (minutes) {
    parts.push(`${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`);
  }
  if (secs || parts.length === 0) {
    parts.push(`${secs} ${secs === 1 ? 'segundo' : 'segundos'}`);
  }

  if (parts.length > 1) {
    const last = parts.pop();
    return `${parts.join(', ')} y ${last}`;
  }
  return parts[0] ?? '0 segundos';
};

type Props = {
  onDataRefresh?: () => Promise<void> | void;
};

export function DataOpsPanel({ onDataRefresh }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [uploadState, setUploadState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [uploadResult, setUploadResult] = useState<IngestSummary | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [status, setStatus] = useState<ClassificationStatusSummary | null>(
    null,
  );
  const [statusError, setStatusError] = useState<string | null>(null);

  const [runState, setRunState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [runResult, setRunResult] = useState<ClassificationRunSummary | null>(
    null,
  );
  const [runError, setRunError] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const [limitDirty, setLimitDirty] = useState(false);

  const [resetState, setResetState] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const current = await api.classificationStatus();
      setStatus(current);
      setStatusError(null);
      if (!limitDirty) {
        const nextLimit = current.pending > 0 ? current.pending : 1;
        setLimit(nextLimit);
      }
    } catch (error) {
      setStatusError(
        error instanceof Error ? error.message : 'Error obteniendo estado',
      );
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 6000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const clearFileSelection = () => {
    setFile(null);
    setFileInputKey((key) => key + 1);
    setUploadState('idle');
    setUploadError(null);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadState('loading');
    setUploadError(null);
    setUploadResult(null);
    try {
      const summary = await api.uploadCsv(file);
      setUploadResult(summary);
      setUploadState('success');
      clearFileSelection();
      await refreshStatus();
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Error subiendo CSV',
      );
      setUploadState('error');
    }
  };

  const handleRun = async () => {
    setRunState('loading');
    setRunError(null);
    setRunResult(null);
    try {
      const summary = await api.classificationRun({ limit });
      setRunResult(summary);
      setRunState('success');
      setLimitDirty(false);
      await refreshStatus();
      await onDataRefresh?.();
    } catch (error) {
      setRunError(
        error instanceof Error
          ? error.message
          : 'Error ejecutando clasificación',
      );
      setRunState('error');
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm(
      'Esto eliminará todos los clientes, reuniones y clasificaciones actuales. ¿Deseas continuar?',
    );
    if (!confirmed) return;
    setResetState('loading');
    setResetMessage(null);
    try {
      const summary = await api.resetDatabase();
      setResetState('success');
      setResetMessage(
        summary.message ??
          `Se eliminaron ${summary.meetingsDeleted} reuniones y ${summary.customersDeleted} clientes.`,
      );
      setUploadResult(null);
      clearFileSelection();
      setLimitDirty(false);
      await refreshStatus();
      await onDataRefresh?.();
    } catch (error) {
      setResetState('error');
      setResetMessage(
        error instanceof Error ? error.message : 'Error al limpiar los datos',
      );
    }
  };

  const progress = useMemo(() => {
    if (!status || status.totalMeetings === 0) return 0;
    const completed = status.totalClassifications || status.done;
    return Math.min(100, Math.round((completed / status.totalMeetings) * 100));
  }, [status]);

  const pendingCount = status?.pending ?? 0;
  const canClassify = pendingCount > 0;

  return (
    <section
      className="surface-card"
      style={{
        padding: '1.8rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}
    >
      <div>
        <p className="section-eyebrow">Operaciones de datos</p>
        <h3 className="chart-card__title">
          Carga, clasificación y mantenimiento
        </h3>
        <p className="text-subtle">
          Sube un CSV desde tu computador, ejecuta la clasificación con el LLM y
          administra la base para repetir el flujo cuando lo necesites.
        </p>
      </div>

      <div className="two-column">
        <article>
          <h4 className="chart-card__title">1. Subir CSV</h4>
          <p className="text-subtle">
            Selecciona un archivo <code>.csv</code> desde tu equipo con el
            formato entregado.
          </p>
          <div
            style={{
              marginTop: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.7rem',
            }}
          >
            <input
              key={fileInputKey}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!file || uploadState === 'loading'}
              >
                {uploadState === 'loading' ? 'Subiendo…' : 'Subir CSV'}
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={!file}
                onClick={clearFileSelection}
              >
                Limpiar selección
              </button>
            </div>
            {uploadState === 'success' && uploadResult ? (
              <p className="text-subtle">
                Procesadas {uploadResult.meetingsCreated} reuniones (omitidas{' '}
                {uploadResult.skipped}).
              </p>
            ) : null}
            {uploadError ? (
              <p className="text-subtle" style={{ color: 'var(--danger)' }}>
                {uploadError}
              </p>
            ) : null}
          </div>
        </article>

        <article>
          <h4 className="chart-card__title">2. Ejecutar clasificación</h4>
          <p className="text-subtle">
            Usa el LLM para etiquetar reuniones pendientes.
          </p>
          <div
            style={{
              marginTop: '0.8rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.7rem',
            }}
          >
            {canClassify ? (
              <>
                <label className="input-control">
                  <span>Tamaño de lote</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={limit}
                    onChange={(event) => {
                      setLimitDirty(true);
                      setLimit(Number(event.target.value));
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleRun}
                  disabled={runState === 'loading'}
                >
                  {runState === 'loading'
                    ? 'Clasificando…'
                    : 'Clasificar pendientes'}
                </button>
                {status?.lastRun?.avgDurationMsPerItem ? (
                  <p className="text-subtle">
                    Tiempo estimado para {limit} reuniones:{' '}
                    {formatDuration(
                      ((status.lastRun.avgDurationMsPerItem ?? 0) * limit) /
                        1000,
                    )}{' '}
                    (basado en el último lote).
                  </p>
                ) : null}
              </>
            ) : (
              <div className="subtle-card" style={{ padding: '1rem' }}>
                <p className="text-subtle">
                  Todas las reuniones están clasificadas. Sube un nuevo CSV para
                  cargar más datos y volver a ejecutar el LLM.
                </p>
              </div>
            )}
            {runResult ? (
              <p className="text-subtle">
                {runResult.ok} reuniones clasificadas ({runResult.errors}{' '}
                errores) en {formatDuration(runResult.durationMs / 1000)}.
              </p>
            ) : null}
            {runError ? (
              <p className="text-subtle" style={{ color: 'var(--danger)' }}>
                {runError}
              </p>
            ) : null}
          </div>
        </article>
      </div>

      <article>
        <h4 className="chart-card__title">Estado del pipeline</h4>
        {statusError ? (
          <p className="text-subtle" style={{ color: 'var(--danger)' }}>
            {statusError}
          </p>
        ) : (
          <>
            <div
              style={{
                width: '100%',
                height: 8,
                borderRadius: 999,
                background: 'var(--surface-muted)',
                marginTop: '0.6rem',
              }}
            >
              <div
                style={{
                  width: `${progress}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: 'var(--accent)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p className="text-subtle" style={{ marginTop: '0.4rem' }}>
              {status
                ? `${numberFormat.format(status.totalClassifications)} de ${numberFormat.format(
                    status.totalMeetings,
                  )} reuniones ya cuentan con clasificación (${progress}%).`
                : 'Sin datos aún.'}
            </p>
            {status ? (
              <div className="detail-grid" style={{ marginTop: '0.8rem' }}>
                <div className="detail-chip">
                  <span className="text-subtle">Pendientes: </span>
                  <strong>{numberFormat.format(status.pending)}</strong>
                </div>
                <div className="detail-chip">
                  <span className="text-subtle">En proceso: </span>
                  <strong>{numberFormat.format(status.processing)}</strong>
                </div>
                <div className="detail-chip">
                  <span className="text-subtle">Completadas: </span>
                  <strong>{numberFormat.format(status.done)}</strong>
                </div>
                <div className="detail-chip">
                  <span className="text-subtle">Errores: </span>
                  <strong>{numberFormat.format(status.error)}</strong>
                </div>
              </div>
            ) : null}
          </>
        )}
      </article>

      <article>
        <h4 className="chart-card__title">3. Limpiar base actual</h4>
        <p className="text-subtle">
          Elimina todos los clientes, reuniones y clasificaciones almacenados.
          Luego podrás cargar un nuevo CSV desde tu equipo.
        </p>
        <div
          style={{
            marginTop: '0.8rem',
            display: 'flex',
            gap: '0.8rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleReset}
            disabled={resetState === 'loading'}
          >
            {resetState === 'loading'
              ? 'Limpiando…'
              : 'Eliminar datos cargados'}
          </button>
          {resetMessage ? (
            <span className="text-subtle">{resetMessage}</span>
          ) : null}
        </div>
      </article>
    </section>
  );
}
