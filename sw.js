/* Emergency self-destruct worker: removes the previous external Web Push worker. */
self.addEventListener('install', function(){ self.skipWaiting(); });
self.addEventListener('activate', function(event){
  event.waitUntil((async function(){
    try { await self.registration.unregister(); } catch(e) {}
    try {
      const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
      clients.forEach(function(client){ try { client.navigate(client.url); } catch(e) {} });
    } catch(e) {}
  })());
});
