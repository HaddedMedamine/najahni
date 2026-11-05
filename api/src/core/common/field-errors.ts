import { HttpException, HttpStatus, type ValidationError } from '@nestjs/common';

/** Message par champ, affiche par le frontend sous le champ concerne. */
export type FieldErrors = Record<string, string>;

/**
 * Erreur liee a des champs : `{ statusCode, message, errors: { champ: message } }`.
 * `message` reste rempli pour les clients qui n'exploitent pas `errors`.
 */
export class FieldException extends HttpException {
  constructor(errors: FieldErrors, status = HttpStatus.BAD_REQUEST) {
    const messages = Object.values(errors);
    super(
      {
        statusCode: status,
        message: messages.length === 1 ? messages[0] : messages,
        errors,
      },
      status,
    );
  }
}

/** Messages des valeurs uniques deja prises. */
export const TAKEN_MESSAGES: Record<string, string> = {
  email: 'Cet email est deja utilise',
  phone: 'Ce numero est deja utilise',
  name: 'Ce nom est deja utilise',
};

export const fieldError = (
  field: string,
  message: string,
  status?: HttpStatus,
) => new FieldException({ [field]: message }, status);

/** `exceptionFactory` du ValidationPipe : premier message de chaque champ, chemins imbriques en `a.0.b`. */
export function validationExceptionFactory(errors: ValidationError[]) {
  const fields: FieldErrors = {};
  const walk = (list: ValidationError[], prefix: string) => {
    for (const error of list) {
      const path = prefix ? `${prefix}.${error.property}` : error.property;
      const first = error.constraints && Object.values(error.constraints)[0];
      if (first) fields[path] = first;
      if (error.children?.length) walk(error.children, path);
    }
  };
  walk(errors, '');
  return new FieldException(fields);
}
