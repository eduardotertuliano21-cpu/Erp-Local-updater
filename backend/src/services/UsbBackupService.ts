import fs from 'node:fs';
import path from 'node:path';
import cron, { type ScheduledTask } from 'node-cron';
import { DATA_DIR } from '../config/database.js';

export interface UsbBackupResult {
  sucesso: boolean;
  unidadeEncontrada?: string;
  pastaDestino?: string;
  arquivosCopiados: string[];
  timestamp: string;
  mensagem: string;
}

export class UsbBackupService {
  private cronJob: ScheduledTask | null = null;
  private readonly DRIVE_LETTERS = ['D:', 'E:', 'F:', 'G:', 'H:', 'I:', 'J:', 'K:', 'U:'];

  public iniciarAgendamentoAutomatico(): void {
    if (this.cronJob) return;

    // Executa verificação a cada 15 minutos
    this.cronJob = cron.schedule('*/15 * * * *', () => {
      console.log('[UsbBackupService] Verificando unidades removíveis para backup automático...');
      try {
        const res = this.executarBackup();
        if (res.sucesso) {
          console.log(`[UsbBackupService] Backup realizado com sucesso em ${res.pastaDestino}`);
        }
      } catch (err: any) {
        console.warn(`[UsbBackupService] Aviso na verificação de backup USB: ${err.message}`);
      }
    });

    console.log('[UsbBackupService] Serviço de backup automático em pendrive ativado (a cada 15 min).');
  }

  public pararAgendamento(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
    }
  }

  public detectarUnidadesRemoviveis(): string[] {
    const unidadesValidas: string[] = [];
    for (const drive of this.DRIVE_LETTERS) {
      try {
        const rootPath = `${drive}\\`;
        if (fs.existsSync(rootPath)) {
          unidadesValidas.push(rootPath);
        }
      } catch {}
    }
    return unidadesValidas;
  }

  public executarBackup(caminhoPersonalizado?: string): UsbBackupResult {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let destinoRaiz: string | null = caminhoPersonalizado || null;

    if (!destinoRaiz) {
      const unidades = this.detectarUnidadesRemoviveis();
      if (unidades.length === 0) {
        return {
          sucesso: false,
          arquivosCopiados: [],
          timestamp,
          mensagem: 'Nenhuma unidade USB ou pendrive detectado.',
        };
      }
      destinoRaiz = unidades[0]; // Pega a primeira unidade removível detectada
    }

    const pastaBackups = path.join(destinoRaiz, 'ClickStorm_Backups', `backup_${timestamp}`);
    if (!fs.existsSync(pastaBackups)) {
      fs.mkdirSync(pastaBackups, { recursive: true });
    }

    const arquivosCopiados: string[] = [];

    // Copia todas as bases físicas de dados da pasta DATA_DIR
    if (fs.existsSync(DATA_DIR)) {
      const arquivosDb = fs.readdirSync(DATA_DIR);
      for (const f of arquivosDb) {
        if (f.endsWith('.sqlite') || f.endsWith('.db')) {
          const src = path.join(DATA_DIR, f);
          const dest = path.join(pastaBackups, f);
          fs.copyFileSync(src, dest);
          arquivosCopiados.push(f);
        }
      }
    }

    // Cria arquivo de manifesto com data e versão
    const manifestoPath = path.join(pastaBackups, 'manifesto_backup.json');
    fs.writeFileSync(
      manifestoPath,
      JSON.stringify(
        {
          timestamp: new Date().toISOString(),
          sistema: 'ClickStorm PDV/ERP',
          versao: '1.0.0',
          arquivos: arquivosCopiados,
        },
        null,
        2
      )
    );
    arquivosCopiados.push('manifesto_backup.json');

    return {
      sucesso: true,
      unidadeEncontrada: destinoRaiz,
      pastaDestino: pastaBackups,
      arquivosCopiados,
      timestamp,
      mensagem: `Backup salvo com sucesso em ${pastaBackups} (${arquivosCopiados.length} arquivos).`,
    };
  }
}
