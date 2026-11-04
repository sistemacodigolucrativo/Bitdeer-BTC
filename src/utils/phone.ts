import { AsYouType, parsePhoneNumberFromString } from 'libphonenumber-js';

/** Keeps existing Brazilian local numbers compatible while preferring E.164/DDI input. */
function internationalInput(value:string):string {
  const trimmed=value.trim();
  if(!trimmed) return '';
  if(trimmed.startsWith('+')) return '+'+trimmed.slice(1).replace(/\D/g,'').slice(0,15);
  const digits=trimmed.replace(/\D/g,'');
  if(digits.startsWith('55') && digits.length>=12) return '+'+digits.slice(0,15);
  return digits.length ? '+55'+digits.slice(0,11) : '';
}

export function formatInternationalPhone(value:string):string {
  const input=internationalInput(value);
  if(!input) return '';
  return new AsYouType().input(input);
}

export function validInternationalPhone(value:string):boolean {
  if(value.trim()==='') return true;
  const phone=parsePhoneNumberFromString(internationalInput(value));
  return Boolean(phone?.isValid());
}

/** Stored as an international display value; the backend repeats validation. */
export function normalizeInternationalPhone(value:string):string {
  const phone=parsePhoneNumberFromString(internationalInput(value));
  return phone?.isValid() ? phone.formatInternational() : formatInternationalPhone(value);
}

// Compatibility aliases retained for legacy components.
export const formatBrazilianPhone=formatInternationalPhone;
export const validBrazilianPhone=validInternationalPhone;
