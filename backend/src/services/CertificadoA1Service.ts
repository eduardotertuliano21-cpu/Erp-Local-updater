import fs from 'fs';
import path from 'path';
import forge from 'node-forge';
import crypto from 'crypto';
import { CertificadoRepository, CertificadoDigital } from '../repositories/CertificadoRepository.js';
import { ConfigLojaRepository } from '../repositories/ConfigLojaRepository.js';
import { DATA_DIR } from '../config/database.js';

export interface InfoCertificadoParsed {
  id: string;
  nome_arquivo: string;
  razao_social: string;
  cnpj: string;
  valido_de: string;
  valido_ate: string;
  dias_restantes: number;
  expirado: boolean;
  alerta_vencimento: boolean;
  ativo: boolean;
}

export class CertificadoA1Service {
  private repo = new CertificadoRepository();
  private configRepo = new ConfigLojaRepository();
  private storageDir: string;

  constructor() {
    this.storageDir = path.join(DATA_DIR, 'certificados');
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
    } catch (err: any) {
      console.warn('[CertificadoA1Service] Falha ao criar pasta de certificados:', err?.message);
    }
  }

  public importarCertificado(
    nomeArquivo: string,
    conteudoBase64: string,
    senha: string
  ): InfoCertificadoParsed {
    try {
      const buffer = Buffer.from(conteudoBase64, 'base64');
      const p12Der = buffer.toString('binary');
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, senha);

      const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
      const bags = certBags[forge.pki.oids.certBag] || [];
      if (!bags.length || !bags[0].cert) {
        throw new Error('Nenhum certificado válido encontrado no arquivo PFX.');
      }

      const cert = bags[0].cert;
      let commonName = '';
      for (const attr of cert.subject.attributes) {
        if (attr.name === 'commonName' || attr.shortName === 'CN') {
          commonName = String(attr.value || '');
          break;
        }
      }

      // Extrai CNPJ (14 dígitos consecutivos no CN ou atributos)
      const cnpjMatch = commonName.match(/\b\d{14}\b/) || commonName.match(/:(\d{14})/);
      const cnpj = cnpjMatch ? cnpjMatch[1] || cnpjMatch[0] : '';
      const razaoSocial = commonName.split(':')[0]?.trim() || commonName;

      const validoDe = cert.validity.notBefore.toISOString();
      const validoAte = cert.validity.notAfter.toISOString();

      const id = crypto.randomUUID();
      const ext = path.extname(nomeArquivo) || '.pfx';
      const arquivoFinal = `${id}${ext}`;
      const caminhoFisico = path.join(this.storageDir, arquivoFinal);

      // Salva o arquivo localmente
      fs.writeFileSync(caminhoFisico, buffer);

      // Exporta chave privada e certificado público em PEM para assinatura digital NFC-e
      try {
        const keyBags = (p12 as any).getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[forge.pki.oids.pkcs8ShroudedKeyBag] ||
                        (p12 as any).getBags({ bagType: forge.pki.oids.keyBag })[forge.pki.oids.keyBag] || [];
        if (keyBags.length && keyBags[0].key) {
          fs.writeFileSync(path.join(this.storageDir, `${id}.key`), forge.pki.privateKeyToPem(keyBags[0].key), 'utf8');
          fs.writeFileSync(path.join(this.storageDir, `${id}.crt`), forge.pki.certificateToPem(cert), 'utf8');
        }
      } catch (keyErr: any) {
        console.warn('[CertificadoA1Service] Aviso ao exportar chave PEM:', keyErr?.message);
      }

      // Define se será ativo se for o primeiro
      const certificadosExistentes = this.repo.listar();
      const serAtivo = certificadosExistentes.length === 0 ? 1 : 0;

      const registro: CertificadoDigital = {
        id,
        nome_arquivo: nomeArquivo,
        caminho_arquivo: caminhoFisico,
        razao_social: razaoSocial,
        cnpj: cnpj || undefined,
        valido_de: validoDe,
        valido_ate: validoAte,
        ativo: serAtivo,
      };

      this.repo.salvar(registro);

      if (serAtivo) {
        this.configRepo.salvar({ certificado_ativo_id: id });
      }

      return this.formatarInfo(registro);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('password')) {
        throw new Error('Senha incorreta para o certificado digital A1.');
      }
      throw new Error(`Falha ao processar certificado: ${err.message}`);
    }
  }

  public listar(): InfoCertificadoParsed[] {
    const list = this.repo.listar();
    return list.map((c) => this.formatarInfo(c));
  }

  public definirAtivo(id: string): void {
    const cert = this.repo.buscarPorId(id);
    if (!cert) throw new Error('Certificado não encontrado.');
    this.repo.definirAtivo(id);
    this.configRepo.salvar({ certificado_ativo_id: id });
  }

  public obterAtivo(): InfoCertificadoParsed | null {
    const ativo = this.repo.obterAtivo();
    if (!ativo) return null;
    return this.formatarInfo(ativo);
  }

  public obterAlertaVencimento(): { alerta: boolean; dias_restantes?: number; mensagem?: string } {
    const ativo = this.repo.obterAtivo();
    if (!ativo || !ativo.valido_ate) {
      return { alerta: false };
    }
    const info = this.formatarInfo(ativo);
    if (info.expirado) {
      return {
        alerta: true,
        dias_restantes: 0,
        mensagem: 'O Certificado Digital A1 ativo está VENCIDO! Emissões de NFC-e serão rejeitadas.',
      };
    }
    if (info.dias_restantes <= 30) {
      return {
        alerta: true,
        dias_restantes: info.dias_restantes,
        mensagem: `Atenção: Seu Certificado Digital A1 vence em ${info.dias_restantes} dia(s). Renove-o para evitar paradas na emissão.`,
      };
    }
    return { alerta: false, dias_restantes: info.dias_restantes };
  }

  private formatarInfo(cert: CertificadoDigital): InfoCertificadoParsed {
    const dataVenc = cert.valido_ate ? new Date(cert.valido_ate) : new Date();
    const agora = new Date();
    const diffMs = dataVenc.getTime() - agora.getTime();
    const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const expirado = diasRestantes <= 0;
    const alertaVencimento = diasRestantes <= 30;

    return {
      id: cert.id,
      nome_arquivo: cert.nome_arquivo,
      razao_social: cert.razao_social || 'Desconhecido',
      cnpj: cert.cnpj || '',
      valido_de: cert.valido_de || '',
      valido_ate: cert.valido_ate || '',
      dias_restantes: diasRestantes,
      expirado,
      alerta_vencimento: alertaVencimento,
      ativo: Boolean(cert.ativo),
    };
  }
}
