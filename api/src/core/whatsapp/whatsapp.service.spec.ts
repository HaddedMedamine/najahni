import type { WAMessage } from 'baileys';
import { describe, expect, it } from 'vitest';
import { agentAllows, inboundText } from './whatsapp.service.js';

const message = (remoteJid: string, content: WAMessage['message'], fromMe = false) =>
  ({ key: { remoteJid, fromMe }, message: content }) as WAMessage;

describe('numeros autorises a parler a l\'agent', () => {
  it('ne laisse passer personne quand la liste est vide', () => {
    expect(agentAllows(undefined, '21695123456')).toBe(false);
    expect(agentAllows('', '21695123456')).toBe(false);
  });

  it('accepte les numeros de la liste, ecrits comme on veut', () => {
    expect(agentAllows('95 123 456, +21622333444', '21695123456')).toBe(true);
    expect(agentAllows('95123456', '21622333444')).toBe(false);
    expect(agentAllows('95123456', null)).toBe(false);
  });

  it('accepte tout le monde avec *', () => {
    expect(agentAllows('*', null)).toBe(true);
  });
});

describe("messages transmis a l'agent", () => {
  it('garde le texte recu d\'une personne', () => {
    expect(inboundText(message('21695123456@s.whatsapp.net', { conversation: ' 3aslema ' }))).toEqual({
      to: '21695123456@s.whatsapp.net',
      text: '3aslema',
    });
    expect(inboundText(message('123@lid', { extendedTextMessage: { text: 'soum?' } }))?.text).toBe('soum?');
  });

  it('lit le texte des messages ephemeres', () => {
    const ephemeral = { ephemeralMessage: { message: { conversation: '3aslema' } } };
    expect(inboundText(message('123@lid', ephemeral))?.text).toBe('3aslema');
  });

  it('ignore nos messages, les groupes, les statuts et les vocaux', () => {
    const text = { conversation: 'x' };
    expect(inboundText(message('21695123456@s.whatsapp.net', text, true))).toBeNull();
    expect(inboundText(message('123-456@g.us', text))).toBeNull();
    expect(inboundText(message('status@broadcast', text))).toBeNull();
    expect(inboundText(message('21695123456@s.whatsapp.net', { audioMessage: {} }))).toBeNull();
  });
});
