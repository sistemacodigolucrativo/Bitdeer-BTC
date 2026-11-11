import { AsYouType, CountryCode, getCountries, getCountryCallingCode, parsePhoneNumberFromString } from 'libphonenumber-js';

export const phoneCountries=getCountries();
export type PhoneCountryCode=CountryCode;
export const callingCodeForCountry=(country:PhoneCountryCode)=>getCountryCallingCode(country);

export function countryForPhone(value:string):PhoneCountryCode {
  return parsePhoneNumberFromString(value)?.country??'BR';
}

export function nationalPhoneValue(value:string,country:PhoneCountryCode):string {
  if(!value.trim())return '';
  const parsed=parsePhoneNumberFromString(value);
  if(parsed?.country===country)return parsed.formatNational();
  return new AsYouType(country).input(value.replace(/\D/g,''));
}

export function formatNationalPhone(value:string,country:PhoneCountryCode):string {
  if(!value.trim())return '';
  let digits=value.replace(/\D/g,'');
  const callingCode=getCountryCallingCode(country);
  if(digits.startsWith(callingCode)&&digits.length>callingCode.length)digits=digits.slice(callingCode.length);
  return new AsYouType(country).input(digits);
}

export function validPhoneForCountry(value:string,country:PhoneCountryCode):boolean {
  if(!value.trim())return true;
  return Boolean(parsePhoneNumberFromString(value,country)?.isValid());
}

export function normalizePhoneForCountry(value:string,country:PhoneCountryCode):string {
  if(!value.trim())return '';
  const parsed=parsePhoneNumberFromString(value,country);
  return parsed?.isValid()?parsed.formatInternational():'';
}

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
