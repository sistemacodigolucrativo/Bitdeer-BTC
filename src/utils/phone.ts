/** Format a Brazilian landline/mobile with DDD, also accepting pasted +55. */
export function formatBrazilianPhone(value: string): string {
  let digits=value.replace(/\D/g,'');
  if (digits.startsWith('55') && digits.length>=12) digits=digits.slice(2);
  digits=digits.slice(0,11);
  if (!digits) return '';
  if (digits.length<3) return '('+digits+(digits.length===2?') ':'');
  const area=digits.slice(0,2);
  const middle=digits.length===11?digits.slice(2,7):digits.slice(2,6);
  const last=digits.length===11?digits.slice(7):digits.slice(6);
  return '('+area+') '+middle+(last?'-'+last:'');
}
export function validBrazilianPhone(value: string): boolean {
  if (value.trim()==='') return true;
  const digits=value.replace(/\D/g,'');
  return (digits.length===10||digits.length===11) && /^[1-9][0-9]/.test(digits);
}
