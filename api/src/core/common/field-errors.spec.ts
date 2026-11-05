import { describe, expect, it } from 'vitest';
import { uniqueField } from '../prisma/prisma-exception.filter.js';
import { validationExceptionFactory } from './field-errors.js';

describe('erreurs par champ', () => {
  it('regroupe les erreurs de validation par champ, y compris imbriquees', () => {
    const error = validationExceptionFactory([
      { property: 'phone', constraints: { matches: 'Numero de telephone invalide' } },
      {
        property: 'questions',
        children: [
          { property: '0', children: [{ property: 'text', constraints: { isNotEmpty: 'vide' } }] },
        ],
      },
    ]);
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toMatchObject({
      errors: { phone: 'Numero de telephone invalide', 'questions.0.text': 'vide' },
    });
  });

  it('retrouve le champ unique en conflit', () => {
    const cause = (constraint: object) => ({ driverAdapterError: { cause: { constraint } } });
    expect(uniqueField(cause({ index: 'User_email_key' }))).toBe('email');
    expect(uniqueField(cause({ fields: ['"phone"'] }))).toBe('phone');
    expect(uniqueField({ target: ['name'] })).toBe('name');
    expect(uniqueField(cause({ index: 'Attendance_sessionId_studentId_key' }))).toBeUndefined();
    expect(uniqueField(undefined)).toBeUndefined();
  });
});
