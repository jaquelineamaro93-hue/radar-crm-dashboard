// Shared canonicalization for public directory contacts and authenticated edits.
export function linkedinLink(value:unknown):string {
 const s=String(value??'').trim();if(!s)return '';
 try {const u=new URL(/^https?:\/\//i.test(s)?s:'https://'+s);
  if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port)return '';
  if(!/^(?:(?:www|[a-z]{2})\.)?linkedin\.com(?:\.br)?$/i.test(u.hostname))return '';
  const match=u.pathname.match(/^\/in\/([A-Za-z0-9_%.-]+)\/?$/);if(!match)return '';
  const url='https://www.linkedin.com/in/'+match[1]+'/';return url.length<=500?url:'';
 }catch{return '';}
}
export function whatsappNumber(value:unknown):string {
 let s=String(value??'').trim();if(!s)return '';
 if(/^(?:https?:\/\/)?(?:www\.)?(?:wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\//i.test(s)){
  try{const u=new URL(/^https?:/i.test(s)?s:'https://'+s);if(u.username||u.password||u.port)return '';s=u.hostname.replace(/^www\./,'')==='wa.me'?u.pathname.slice(1):u.searchParams.get('phone')||'';}catch{return '';}
 }
 if(!/^[+\d\s().-]+$/.test(s))return '';
 let digits=s.replace(/\D/g,'');if(digits.startsWith('00'))digits=digits.slice(2);
 if(digits.length===10||digits.length===11)digits='55'+digits;
 return /^[1-9]\d{9,14}$/.test(digits)?digits:'';
}
