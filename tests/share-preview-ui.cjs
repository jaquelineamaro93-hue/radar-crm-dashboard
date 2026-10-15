const assert=require('node:assert/strict');
const fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
const html=read('index.html');
const fallback=read('404.html');
const script=read('assets/share-everything.js');
const style=read('assets/share-everything.css');
const landing=read('compartilhar/index.html');

assert.equal(html,fallback,'Deep-link fallback must equal index for GitHub Pages');
new Function(script);
assert(/\/assets\/share-everything\.js\?v=[\w-]+/.test(html),'Share actions must be loaded with a cache version');
assert(html.includes('/assets/share-everything.css?v=20261015-og1'),'Share CSS must be loaded');
assert(script.includes("route:'search',pages:['pageSearch'],selectors:['#searchResults .p-card']"),
  'Only public Open to Work directory cards may receive individual share actions');
assert(script.includes("kind==='pagina'?url.href:shareUrl.href"),
  'Individual items must use the dedicated share landing for social preview');
assert(script.includes("https://www.linkedin.com/sharing/share-offsite/?url=") && script.includes("encodeURIComponent(info.previewUrl||info.url)"),
  'LinkedIn must use the public OG landing, not the heavy client app URL');
assert(script.includes("makeAction('Copiar texto da publicação'"),
  'Users must be able to paste title and link if social site cannot prefill post');
assert(!script.includes('observe(document.body'),
  'Sharing must never install a page-wide DOM observer');
assert(script.includes("observe(list,{childList:true,subtree:false})"),
  'Sharing can listen only to collection-level card updates');
assert(script.includes('cx-share-talent') && style.includes('#pageSearch #searchResults .cx-share-talent'),
  'Open to Work share control must be discreet');
assert(!/Candidatar\s*<span aria-hidden="true">↗<\/span>/.test(html),
  'Candidatar should not contain iOS emoji arrow glyph');
assert(!/Cadastrar meu perfil gratuitamente ↗/.test(html),
  'Open to Work CTA should not contain emoji arrow glyph');
assert(html.includes('Candidatar <svg viewBox="0 0 24 24"'),
  'Candidatar should use an accessible vector icon');
assert(html.includes('Cadastrar meu perfil gratuitamente <svg viewBox="0 0 24 24"'),
  'Open to Work signup should use an accessible vector icon');
assert(!html.includes('Faça parte da nossa vitrine de talentos!'),
  'Avoid excessive exclamation in Open to Work');
assert(landing.includes('property="og:title"') && landing.includes('property="og:description"') &&
       landing.includes('property="og:image"') && landing.includes('https://conexaocrm.com/og-image.png'),
  'Lightweight landing must expose Open Graph for LinkedIn');
assert(landing.length < 20000,'LinkedIn preview page should be lightweight');
assert(landing.includes("dest.searchParams.set('cx_share',title)"),
  'Share link must resolve back to public vacancy or profile card');
assert(!landing.includes('og:url'),'Do not canonicalize away the share query parameters');
console.log('PASS sharing: lightweight OG preview, Open to Work item sharing, icon-only vector CTA and no DOM-wide observer');
