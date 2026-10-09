// AI sederhana: rekrut di garis depan, serang jika rasio kekuatan cukup (tergantung kepribadian)
function aiTurn(fid){
  const f = G.factions[fid];
  const th = {agresif:.8, defensif:1.3, ekonomi:1.1}[f.ai] || 1;
  const reg = Object.values(UNITS).filter(u => u.region === f.region);
  const milik = G.provinces.filter(p => p.owner === fid);
  const depan = milik.filter(p => tetangga(p.id).some(n => G.provinces[n].owner !== fid));
  for(let g=0; g<6 && f.uang>35 && milik.length; g++){
    const u = reg[Math.floor(Math.random()*reg.length)];
    if(u.biaya*5 > f.uang-10) continue;
    const t = depan.length ? depan : milik;
    rekrut(fid, t[Math.floor(Math.random()*t.length)].id, u.id, 5);
  }
  milik.forEach(p => {
    if(!p.army || p.army.act) return;
    const nb = tetangga(p.id).map(i => G.provinces[i]);
    const musuh = nb.filter(q => q.owner !== fid);
    let best = null, br = 0;
    musuh.forEach(q => {
      if(!q.army){ best = q; br = 99; return; }
      const rs = kekuatan(p.army, q, true, q.army, true) / kekuatan(q.army, q, false, p.army, true);
      if(rs > br){ br = rs; best = q; }
    });
    if(best && br >= th) aksi(p.id, best.id);
    else if(!musuh.length){
      const fr = nb.find(q => q.owner === fid && tetangga(q.id).some(n => G.provinces[n].owner !== fid));
      if(fr) aksi(p.id, fr.id);
    }
  });
}
