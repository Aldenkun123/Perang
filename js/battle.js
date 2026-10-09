// Aturan pertempuran: counter, terrain, moral, pengalaman, jenderal, suplai, kelelahan
const COUNTER = {tank:{inf:1.5}, inf:{art:1.3}, art:{tank:1.3}, kav:{art:1.3, inf:1.1}};
const TERRAIN = {
  dataran:{barat:.15}, hutan:{selatan:.25, utara:.05}, gurun:{barat:-.1, selatan:.25, utara:-.15},
  salju:{barat:-.1, timur:.05, selatan:-.15, utara:.25}, kota:{barat:.05, timur:.1, utara:.1}
};
const nama = f => f == null ? 'Netral' : G.factions[f].nama;
const jumlah = a => Object.values(a.units).reduce((s,n) => s+n, 0);
const rankName = a => a.xp>=8 ? 'Elit' : a.xp>=3 ? 'Veteran' : 'Rekrut';
const rankMult = a => a.xp>=8 ? 1.3 : a.xp>=3 ? 1.15 : 1;
const moralMult = m => m>=80 ? 1.15 : m>=50 ? 1 : m>=25 ? .85 : .65;
const hidup = f => G.provinces.some(p => p.owner === f);
const armi = (units, moral) => ({units, moral, xp:0, jend:0, lelah:0, act:false});

function tetangga(i){
  const p = G.provinces[i];
  return G.provinces.filter(q => Math.abs(q.c-p.c)+Math.abs(q.r-p.r) === 1).map(q => q.id);
}

// Provinsi yang terhubung ke kota sendiri (maks 3 langkah lewat wilayah sendiri)
function suplai(fid){
  const ok = new Set(), q = [];
  G.provinces.forEach(p => { if(p.owner===fid && p.kota){ ok.add(p.id); q.push([p.id,0]); } });
  while(q.length){
    const [i,d] = q.shift(); if(d>=3) continue;
    for(const n of tetangga(i)){
      if(G.provinces[n].owner===fid && !ok.has(n)){ ok.add(n); q.push([n,d+1]); }
    }
  }
  return ok;
}

function komposisi(a){
  const c = {}, t = jumlah(a) || 1;
  for(const id in a.units){ const tp = UNITS[id].tipe; c[tp] = (c[tp]||0) + a.units[id]/t; }
  return c;
}

function kekuatan(a, prov, serang, musuh, terhubung){
  const kom = komposisi(musuh); let tot = 0;
  for(const id in a.units){
    const u = UNITS[id]; let cm = 0;
    for(const tp in kom) cm += kom[tp] * ((COUNTER[u.tipe]||{})[tp] || 1);
    const tb = 1 + ((TERRAIN[prov.terrain]||{})[u.region] || 0);
    tot += a.units[id] * (serang ? u.atk : u.def) * cm * tb;
  }
  const m = Math.min(100, a.moral + 4*a.jend);
  return tot * moralMult(m) * rankMult(a) * (1 - .05*a.lelah) * (serang ? 1+.03*a.jend : 1.1) * (terhubung ? 1 : .9);
}

function kurangi(a, f){
  for(const id in a.units){ a.units[id] = Math.floor(a.units[id]*(1-f)); if(a.units[id]<1) delete a.units[id]; }
}

function gabung(t, s){
  const n1 = jumlah(t), n2 = jumlah(s);
  for(const id in s.units) t.units[id] = (t.units[id]||0) + s.units[id];
  t.moral = Math.round((t.moral*n1 + s.moral*n2) / (n1+n2));
  t.xp = Math.max(t.xp, s.xp); t.jend = Math.max(t.jend, s.jend); t.lelah = Math.max(t.lelah, s.lelah);
}

function rekrut(fid, pid, uid, n){
  const f = G.factions[fid], u = UNITS[uid];
  const c = Math.round(u.biaya * n * (u.region===f.region ? 1 : 1.5));
  if(f.uang < c) return false;
  f.uang -= c;
  const p = G.provinces[pid], baru = armi({[uid]:n}, 60);
  if(p.army) gabung(p.army, baru); else p.army = baru;
  return true;
}

// Pindah / gabung / rebut / serang. Satu aksi per pasukan per turn.
function aksi(a, b){
  const A = G.provinces[a], B = G.provinces[b], army = A.army, fid = A.owner;
  if(!army || army.act || !tetangga(a).includes(b)) return false;
  if(B.owner === fid){
    if(B.army) gabung(B.army, army); else B.army = army;
    A.army = null; B.army.act = true; return true;
  }
  if(!B.army){
    B.owner = fid; B.army = army; A.army = null; army.act = true;
    log(`${nama(fid)} merebut ${B.nama}.`); return true;
  }
  pertempuran(A, B); return true;
}

function mundur(a, B, lama){
  const n = tetangga(B.id).map(i => G.provinces[i]).find(q => q.owner === lama);
  if(!n){ log('Pasukan yang kalah terkepung dan hancur.'); return; }
  if(n.army) gabung(n.army, a); else n.army = a;
}

function pertempuran(A, B){
  const at = A.army, df = B.army;
  const sa = suplai(A.owner).has(A.id), sd = B.owner==null ? true : suplai(B.owner).has(B.id);
  const r = () => 1 + (Math.random()*.3 - .15);
  const pa = kekuatan(at, B, true, df, sa) * r(), pd = kekuatan(df, B, false, at, sd) * r();
  const menang = pa > pd, rasio = Math.min(pa,pd) / Math.max(pa,pd);
  const W = menang ? at : df, L = menang ? df : at;
  kurangi(L, .6 + .2*Math.random());
  kurangi(W, Math.min(.4, .15 + .25*rasio));
  W.moral = Math.min(100, W.moral + 10); L.moral = Math.max(0, L.moral - 20);
  W.xp++; L.xp = Math.max(0, L.xp - 1);
  at.lelah = Math.min(5, at.lelah+1); df.lelah = Math.min(5, df.lelah+1);
  at.act = df.act = true;
  if(L.jend && Math.random() < .15){ L.jend = 0; log('Seorang jenderal gugur di '+B.nama+'!'); }
  log(`${nama(A.owner)} ${menang ? 'menang' : 'gagal'} menyerang ${B.nama} (${Math.round(pa)} vs ${Math.round(pd)}).`);
  const hancur = a => jumlah(a) < 1 || a.moral <= 0;
  if(menang){
    const lama = B.owner; B.owner = A.owner; B.army = at; A.army = null;
    if(!hancur(df) && lama != null) mundur(df, B, lama);
  } else {
    if(hancur(at)) A.army = null;
    if(hancur(df)) B.army = null;
  }
}
