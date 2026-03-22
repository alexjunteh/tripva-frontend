const CACHE='triplive-v1';
const ASSETS=['/trip-planner/italy-test.html'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('fetch',e=>{
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
    if(res.ok){const cl=res.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}
    return res;
  }).catch(()=>caches.match('/trip-planner/italy-test.html'))));
});