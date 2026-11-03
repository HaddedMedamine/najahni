import type { Locale } from '../notifications/templates.js';

// Message "mot de passe oublie" (email ou WhatsApp), dans la langue de l'utilisateur.

export function resetMessage(locale: Locale, v: { firstName: string; link: string; minutes: number; center: string }) {
  if (locale === 'ar') {
    return {
      subject: `${v.center} : إعادة تعيين كلمة المرور`,
      text:
        `مرحبًا ${v.firstName}،\n` +
        `لتغيير كلمة المرور، افتح هذا الرابط (صالح لمدة ${v.minutes} دقيقة):\n${v.link}\n\n` +
        `إذا لم تطلب ذلك، تجاهل هذه الرسالة.\n— مركز ${v.center}`,
    };
  }
  return {
    subject: `${v.center} : réinitialisation du mot de passe`,
    text:
      `Bonjour ${v.firstName},\n` +
      `Pour choisir un nouveau mot de passe, ouvrez ce lien (valable ${v.minutes} minutes) :\n${v.link}\n\n` +
      `Si vous n'avez rien demandé, ignorez ce message.\n— Centre ${v.center}`,
  };
}

/** Version HTML de l'email (bouton). */
export function resetHtml(locale: Locale, v: { firstName: string; link: string; minutes: number; center: string }) {
  const ar = locale === 'ar';
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  return `<div dir="${ar ? 'rtl' : 'ltr'}" style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#10243e">
  <h2 style="color:#1565c0">${esc(v.center)}</h2>
  <p>${ar ? 'مرحبًا' : 'Bonjour'} ${esc(v.firstName)},</p>
  <p>${ar ? 'لتغيير كلمة المرور، اضغط على الزر:' : 'Pour choisir un nouveau mot de passe, cliquez sur le bouton :'}</p>
  <p><a href="${esc(v.link)}" style="display:inline-block;background:#1565c0;color:#fff;padding:12px 24px;border-radius:999px;text-decoration:none;font-weight:bold">
    ${ar ? 'تغيير كلمة المرور' : 'Changer mon mot de passe'}</a></p>
  <p style="color:#5b6b80;font-size:13px">${ar ? `الرابط صالح لمدة ${v.minutes} دقيقة. إذا لم تطلب ذلك، تجاهل هذه الرسالة.` : `Lien valable ${v.minutes} minutes. Si vous n'avez rien demandé, ignorez ce message.`}</p>
</div>`;
}
