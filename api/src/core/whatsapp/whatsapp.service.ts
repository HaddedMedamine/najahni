import { readFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  Injectable,
  Logger,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState,
} from 'baileys';
import { pino } from 'pino';
import QRCode from 'qrcode';

// Connexion WhatsApp NON OFFICIELLE (comme WhatsApp Web) avec le numero du centre.
// La session est gardee dans un dossier local : on ne scanne le QR code qu'une fois.
// Attention : WhatsApp peut bloquer un numero qui envoie trop de messages automatiques.

export type WhatsappState = 'DISCONNECTED' | 'CONNECTING' | 'QR' | 'CONNECTED';

type Socket = ReturnType<typeof makeWASocket>;

/** Erreur d'envoi definitive (inutile de reessayer : numero sans WhatsApp...). */
export class WhatsappRecipientError extends Error {}

/** "+216 95 123 456", "95123456" -> "21695123456" */
export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');
  return digits.length === 8 ? `216${digits}` : digits;
}

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly sessionDir: string;
  private socket: Socket | null = null;
  private state: WhatsappState = 'DISCONNECTED';
  private qr: string | null = null;
  private lastError: string | null = null;
  private stopping = false;

  constructor(config: ConfigService) {
    this.sessionDir = resolve(
      config.get('WHATSAPP_SESSION_DIR') ?? '.whatsapp-session',
    );
  }

  /** Reconnexion automatique au demarrage si un telephone a deja ete lie. */
  async onModuleInit() {
    const file = resolve(this.sessionDir, 'creds.json');
    if (!existsSync(file)) return;
    try {
      const creds = JSON.parse(await readFile(file, 'utf8')) as { me?: unknown };
      if (creds.me) await this.connect();
    } catch (e) {
      this.logger.warn(`Session WhatsApp illisible : ${(e as Error).message}`);
    }
  }

  async onModuleDestroy() {
    this.stopping = true;
    this.socket?.end(undefined);
  }

  async status() {
    const id = this.socket?.user?.id;
    return {
      state: this.state,
      /** QR code a scanner (image data:), seulement en etat QR */
      qr: this.state === 'QR' && this.qr ? await QRCode.toDataURL(this.qr, { margin: 1, width: 280 }) : null,
      phone: this.state === 'CONNECTED' && id ? `+${id.split(':')[0].split('@')[0]}` : null,
      name: this.state === 'CONNECTED' ? (this.socket?.user?.name ?? null) : null,
      lastError: this.lastError,
    };
  }

  get isConnected() {
    return this.state === 'CONNECTED';
  }

  /** Ouvre la connexion : affiche un QR code si aucun telephone n'est lie. */
  async connect() {
    if (this.state !== 'DISCONNECTED') return;
    this.stopping = false;
    this.state = 'CONNECTING';
    this.lastError = null;

    const { state: auth, saveCreds } = await useMultiFileAuthState(this.sessionDir);
    const socket = makeWASocket({
      auth,
      browser: Browsers.windows('Najahni'),
      logger: pino({ level: 'silent' }),
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });
    this.socket = socket;

    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', (update) => {
      if (this.socket !== socket) return;
      if (update.qr) {
        this.state = 'QR';
        this.qr = update.qr;
      }
      if (update.connection === 'open') {
        this.state = 'CONNECTED';
        this.qr = null;
        this.logger.log(`WhatsApp connecte (${socket.user?.id})`);
      }
      if (update.connection === 'close') {
        const code = (update.lastDisconnect?.error as { output?: { statusCode?: number } } | undefined)
          ?.output?.statusCode;
        this.socket = null;
        this.state = 'DISCONNECTED';
        this.qr = null;
        if (this.stopping) return;
        if (code === DisconnectReason.loggedOut) {
          // Deconnecte depuis le telephone : il faudra rescanner
          this.lastError = 'Le telephone a ete deconnecte. Scannez de nouveau le QR code.';
          this.logger.warn(this.lastError);
          void rm(this.sessionDir, { recursive: true, force: true });
          return;
        }
        // Jamais lie (QR code non scanne a temps) : on s'arrete, l'admin relancera
        if (!auth.creds.me && code !== DisconnectReason.restartRequired) {
          this.lastError = 'Le QR code a expiré. Cliquez de nouveau sur « Lier mon téléphone ».';
          return;
        }
        // Coupure reseau, redemarrage demande par WhatsApp... : on se reconnecte
        this.logger.warn(`WhatsApp deconnecte (code ${code ?? '?'}), reconnexion...`);
        setTimeout(() => void this.connect(), code === DisconnectReason.restartRequired ? 0 : 5_000);
      }
    });
  }

  /** Deconnecte le telephone et oublie la session. */
  async logout() {
    this.stopping = true;
    const socket = this.socket;
    this.socket = null;
    try {
      await socket?.logout();
    } catch {
      socket?.end(undefined);
    }
    await rm(this.sessionDir, { recursive: true, force: true });
    this.state = 'DISCONNECTED';
    this.qr = null;
    this.lastError = null;
  }

  /** Envoie un message texte. Leve WhatsappRecipientError si le numero n'a pas WhatsApp. */
  async sendText(phone: string, text: string) {
    const socket = this.socket;
    if (!socket || this.state !== 'CONNECTED') {
      throw new Error("WhatsApp n'est pas connecte");
    }
    const number = normalizePhone(phone);
    if (number.length < 10) {
      throw new WhatsappRecipientError(`Numero invalide : ${phone}`);
    }
    const [found] = (await socket.onWhatsApp(number)) ?? [];
    if (!found?.exists) {
      throw new WhatsappRecipientError(`Ce numero n'a pas WhatsApp : ${phone}`);
    }
    await socket.sendMessage(found.jid, { text });
  }
}
