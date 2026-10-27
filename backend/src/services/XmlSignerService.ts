import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { CertificadoRepository } from '../repositories/CertificadoRepository.js';
import { DATA_DIR } from '../config/database.js';

export class XmlSignerService {
  private repo = new CertificadoRepository();
  private storageDir = path.join(DATA_DIR, 'certificados');

  public assinarNfceXml(xml: string, chave: string): string {
    try {
      const ativo = this.repo.obterAtivo();
      if (!ativo) return xml;

      const keyPath = path.join(this.storageDir, `${ativo.id}.key`);
      const crtPath = path.join(this.storageDir, `${ativo.id}.crt`);

      if (!fs.existsSync(keyPath) || !fs.existsSync(crtPath)) {
        return xml;
      }

      const keyPem = fs.readFileSync(keyPath, 'utf8');
      const certPem = fs.readFileSync(crtPath, 'utf8');

      // Canonicaliza o nó <infNFe ...>...</infNFe>
      const matchInf = xml.match(/<infNFe[\s\S]*?<\/infNFe>/);
      if (!matchInf) return xml;

      const infNFeCanonical = this.canonicalizeXml(matchInf[0]);
      const digestValue = crypto.createHash('sha1').update(infNFeCanonical, 'utf8').digest('base64');

      // Monta nó SignedInfo
      const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">` +
        `<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
        `<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>` +
        `<Reference URI="#NFe${chave}">` +
        `<Transforms>` +
        `<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>` +
        `<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>` +
        `</Transforms>` +
        `<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>` +
        `<DigestValue>${digestValue}</DigestValue>` +
        `</Reference>` +
        `</SignedInfo>`;

      const signedInfoCanonical = this.canonicalizeXml(signedInfo);

      // Assina SignedInfo com RSA-SHA1
      const sign = crypto.createSign('RSA-SHA1');
      sign.update(signedInfoCanonical);
      sign.end();
      const signatureValue = sign.sign(keyPem, 'base64');

      // Limpa delimitadores do certificado X509
      const x509Clean = certPem
        .replace(/-----BEGIN CERTIFICATE-----/g, '')
        .replace(/-----END CERTIFICATE-----/g, '')
        .replace(/\r|\n/g, '');

      const signatureXml = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">` +
        `${signedInfo}` +
        `<SignatureValue>${signatureValue}</SignatureValue>` +
        `<KeyInfo>` +
        `<X509Data>` +
        `<X509Certificate>${x509Clean}</X509Certificate>` +
        `</X509Data>` +
        `</KeyInfo>` +
        `</Signature>`;

      // Insere a assinatura antes de </NFe> ou antes de <infNFeSupl>
      if (xml.includes('</infNFe>')) {
        return xml.replace('</infNFe>', `</infNFe>${signatureXml}`);
      }
      return xml.replace('</NFe>', `${signatureXml}</NFe>`);
    } catch (err: any) {
      console.warn('[XmlSignerService] Falha na assinatura digital (mantendo XML original):', err?.message);
      return xml;
    }
  }

  private canonicalizeXml(xmlSnippet: string): string {
    return xmlSnippet
      .replace(/>\s+</g, '><')
      .replace(/\r\n/g, '\n')
      .trim();
  }
}
