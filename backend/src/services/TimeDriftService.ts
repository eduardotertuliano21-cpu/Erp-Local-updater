import { getOperacaoDb } from '../config/database.js';

export interface TimeIntegrityStatus {
  valido: boolean;
  fraudeDetectada: boolean;
  divergenciaDetectada: boolean;
  timeOffsetMs: number;
  diferencaMinutos: number;
  mensagem?: string;
  ultimoTimestampRegistrado: number;
  horaAtualSistema: number;
}

export class TimeDriftService {
  private db = getOperacaoDb();
  private timeOffsetMs = 0;
  private fraudeDetectada = false;
  private divergenciaDetectada = false;
  private diferencaMinutos = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initTable();
    this.iniciarHeartbeat();
    this.validarOfflineAoIniciar();
    this.verificarNtpOnlineSilencioso();
  }

  private initTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sys_health (
        id INTEGER PRIMARY KEY,
        ultimo_timestamp INTEGER NOT NULL,
        atualizado_em TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const row = this.db.prepare('SELECT id FROM sys_health WHERE id = 1').get();
    if (!row) {
      this.db.prepare('INSERT INTO sys_health (id, ultimo_timestamp) VALUES (1, ?)').run(Date.now());
    }
  }

  private iniciarHeartbeat(): void {
    if (this.heartbeatInterval) return;

    // Heartbeat a cada 10 minutos atualiza a linha id=1 (apenas UPDATE, nunca INSERT)
    this.heartbeatInterval = setInterval(() => {
      this.executarHeartbeat();
    }, 10 * 60 * 1000);
  }

  public executarHeartbeat(): void {
    try {
      const agora = Date.now();
      const stmt = this.db.prepare('UPDATE sys_health SET ultimo_timestamp = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = 1');
      stmt.run(agora);
      console.log(`[TimeDrift] Heartbeat anti-fraude registrado: ${new Date(agora).toISOString()}`);
    } catch (err: any) {
      console.warn('[TimeDrift] Falha ao registrar heartbeat:', err.message);
    }
  }

  public validarOfflineAoIniciar(): boolean {
    try {
      const row = this.db.prepare('SELECT ultimo_timestamp FROM sys_health WHERE id = 1').get() as { ultimo_timestamp: number } | undefined;
      if (!row) return true;

      const agora = Date.now();
      // Tolerância de 60 segundos para variações normais de shutdown
      if (agora < (row.ultimo_timestamp - 60000)) {
        this.fraudeDetectada = true;
        console.error(`🚨 [ANTI-FRAUDE] O relógio do computador (${new Date(agora).toISOString()}) está no passado em relação ao último registro do sistema (${new Date(row.ultimo_timestamp).toISOString()})!`);
        return false;
      }

      // Se o relógio estiver no futuro ou presente, atualiza o timestamp imediatamente
      this.executarHeartbeat();
      return true;
    } catch (err: any) {
      console.warn('[TimeDrift] Erro na validação offline:', err.message);
      return true;
    }
  }

  public async verificarNtpOnlineSilencioso(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Consulta API leve de horário oficial
      const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', {
        signal: controller.signal,
      }).catch(() => null);

      clearTimeout(timeoutId);

      if (res && res.ok) {
        const data = await res.json() as { unixtime: number };
        if (data.unixtime) {
          const ntpTimestamp = data.unixtime * 1000;
          const localTimestamp = Date.now();
          const diffMs = Math.abs(ntpTimestamp - localTimestamp);

          this.diferencaMinutos = Math.round(diffMs / 60000);
          this.timeOffsetMs = ntpTimestamp - localTimestamp;

          // Se divergir mais de 3 minutos (180.000 ms)
          if (diffMs > 3 * 60 * 1000) {
            this.divergenciaDetectada = true;
            console.warn(`⚠️ [TimeDrift] Divergência de relógio detectada: ${this.diferencaMinutos} min de diferença do horário oficial NTP.`);
          } else {
            this.divergenciaDetectada = false;
            this.timeOffsetMs = 0;
          }
        }
      }
    } catch {
      // Sem internet: opera 100% offline sem travar
    }
  }

  public obterTimestampCorrigido(): number {
    return Date.now() + this.timeOffsetMs;
  }

  public obterStatusIntegridade(): TimeIntegrityStatus {
    const row = this.db.prepare('SELECT ultimo_timestamp FROM sys_health WHERE id = 1').get() as { ultimo_timestamp: number } | undefined;
    const ultimoTs = row ? row.ultimo_timestamp : Date.now();
    const agora = Date.now();

    // Revalidação offline
    const retrocedido = agora < (ultimoTs - 60000);
    if (retrocedido) {
      this.fraudeDetectada = true;
    }

    let mensagem: string | undefined;
    if (this.fraudeDetectada) {
      mensagem = 'Tentativa de voltar a data do sistema detectada. Acesso bloqueado por segurança.';
    } else if (this.divergenciaDetectada) {
      mensagem = `Atenção: O relógio deste computador está com ${this.diferencaMinutos} minutos de diferença do horário oficial. Ajuste a data/hora do Windows.`;
    }

    return {
      valido: !this.fraudeDetectada,
      fraudeDetectada: this.fraudeDetectada,
      divergenciaDetectada: this.divergenciaDetectada,
      timeOffsetMs: this.timeOffsetMs,
      diferencaMinutos: this.diferencaMinutos,
      mensagem,
      ultimoTimestampRegistrado: ultimoTs,
      horaAtualSistema: agora,
    };
  }

  public pararHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
