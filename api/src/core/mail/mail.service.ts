import { Global, Injectable, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

// Envoi d'emails par SMTP (ex. Gmail avec un "mot de passe d'application", gratuit).
// Sans SMTP_USER / SMTP_PASS, rien n'est envoye : le message est seulement ecrit dans les logs.

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(config: ConfigService) {
    const user = config.get<string>('SMTP_USER');
    const pass = config.get<string>('SMTP_PASS');
    const port = Number(config.get('SMTP_PORT') ?? 465);
    this.from = config.get('MAIL_FROM') ?? `Najahni <${user ?? 'no-reply@najahni.tn'}>`;
    this.transporter =
      user && pass
        ? nodemailer.createTransport({
            host: config.get('SMTP_HOST') ?? 'smtp.gmail.com',
            port,
            secure: port === 465,
            auth: { user, pass },
          })
        : null;
    if (!this.transporter) {
      this.logger.warn('SMTP non configure : les emails seront seulement affiches dans les logs');
    }
  }

  get isConfigured() {
    return this.transporter !== null;
  }

  async send(to: string, subject: string, text: string, html?: string) {
    if (!this.transporter) {
      this.logger.warn(`[email non envoye] a ${to} : ${subject}\n${text}`);
      return false;
    }
    await this.transporter.sendMail({ from: this.from, to, subject, text, html });
    return true;
  }
}

@Global()
@Module({ providers: [MailService], exports: [MailService] })
export class MailModule {}
