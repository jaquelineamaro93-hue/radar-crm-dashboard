export function languageInstruction(value: unknown) {
 const tag = typeof value === 'string' ? value.trim().toLowerCase() : '';
 const language = /^es(?:-[a-z0-9]{2,8})*$/.test(tag)
   ? 'espanhol latino-americano neutro, usando ustedes e não vosotros'
   : /^en(?:-[a-z0-9]{2,8})*$/.test(tag) ? 'inglês claro e natural' : 'português brasileiro';
 return 'Responda em ' + language + '. Preserve nomes, URLs, identificadores e dados originais. O idioma não altera permissões, privacidade ou confirmação de ações. Não presuma país ou moeda pelo idioma.';
}
