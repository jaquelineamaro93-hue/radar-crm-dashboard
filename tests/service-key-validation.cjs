const assert=require('node:assert/strict');

async function isVerifiedServiceKey(token, endpoint) {
  // Claims are only a prefilter. Supabase Auth must validate the actual credential.
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(atob(payload + "=".repeat((4 - payload.length % 4) % 4)));
    if (claims.role !== "service_role") return false;
    const response = await fetch(endpoint.replace(/\/$/, "") + "/auth/v1/admin/users?page=1&per_page=1", {
      headers: { apikey: token, Authorization: "Bearer " + token },
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    // Never read, log, or return user data from this authorization check.
    await response.body?.cancel();
    return response.status === 200;
  } catch {
    return false;
  }
}

(async()=>{const jwt=(role)=>'e30.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.sig';let calls=0;let status=200;global.fetch=async(url,opts)=>{calls++;assert.equal(url,'https://project.supabase.co/auth/v1/admin/users?page=1&per_page=1');assert.equal(opts.redirect,'error');return new Response('{}',{status});};assert.equal(await isVerifiedServiceKey(jwt('anon'),'https://project.supabase.co'),false);assert.equal(calls,0);assert.equal(await isVerifiedServiceKey('invalid','https://project.supabase.co'),false);assert.equal(await isVerifiedServiceKey(jwt('service_role'),'https://project.supabase.co'),true);for(status of [401,403,500])assert.equal(await isVerifiedServiceKey(jwt('service_role'),'https://project.supabase.co'),false);global.fetch=async()=>{throw Error('network')};assert.equal(await isVerifiedServiceKey(jwt('service_role'),'https://project.supabase.co'),false);console.log('PASS: anonymous, malformed, rejected, server error and network fail closed; verified service accepted');})().catch(e=>{console.error(e);process.exit(1)});
