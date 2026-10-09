function log(m){ G.logs.push(m); if(G.logs.length > 60) G.logs.shift(); }
function menu(h){ document.getElementById('menu').innerHTML = `<div class="box">${h}</div>`; }
function tutup(){ document.getElementById('menu').innerHTML = ''; }

async function init(){
  const [f,p,u] = await Promise.all(['factions','provinces','units'].map(n => fetch('data/'+n+'.json').then(r => r.json())));
  FACS = f; PROVS = p; UNITS = Object.fromEntries(u.map(x => [x.id, x]));
  document.getElementById('map').addEventListener('click', e => {
    const g = e.target.closest('[data-id]'); if(g && G && !G.over) klik(+g.dataset.id);
  });
  document.getElementById('endBtn').onclick = akhiriTurn;
  menuAwal();
}

function menuAwal(){
  menu('<h2>Pilih faksi</h2><p class="dim">Tambah faksi dan provinsi lewat file JSON di folder data.</p>'
    + FACS.map((f,i) => `<button onclick="mulai(${i})" style="border-left:8px solid ${f.warna}">${f.nama} <small>(${f.region})</small></button>`).join('')
    + (muat() ? '<button class="alt" onclick="lanjut()">Lanjutkan game tersimpan</button>' : ''));
}
function lanjut(){ G = muat(); tutup(); render(); }

function mulai(player){
  G = {turn:1, player, sel:null, over:false, logs:['Perang dimulai.'],
    factions: FACS.map((f,i) => ({...f, id:i, uang:100})),
    provinces: PROVS.map((p,i) => ({...p, id:i, army:null}))};
  const us = Object.values(UNITS);
  G.provinces.forEach(p => {
    if(p.owner == null){ p.army = armi({milisi: 10 + Math.floor(Math.random()*6)}, 50); return; }
    const reg = G.factions[p.owner].region;
    p.army = armi({[us.find(u => u.region===reg && u.tipe==='inf').id]: 12}, 70);
    if(p.kota) p.army.units[us.find(u => u.region===reg && u.tipe!=='inf').id] = 4;
  });
  tutup(); render();
}

function klik(id){
  const s = G.sel != null ? G.provinces[G.sel] : null;
  if(s && s.owner===G.player && s.army && !s.army.act && tetangga(s.id).includes(id)){
    aksi(s.id, id); G.sel = id; cekAkhir();
  } else G.sel = id;
  render();
}

function beli(uid){ if(G.sel != null && rekrut(G.player, G.sel, uid, 5)) render(); }
function jenderal(){
  const p = G.provinces[G.sel], f = G.factions[G.player], c = 30*(p.army.jend+1);
  if(f.uang >= c){ f.uang -= c; p.army.jend++; render(); }
}

function event(){
  const v = G.factions.map((f,i) => i).filter(hidup);
  const i = v[Math.floor(Math.random()*v.length)], f = G.factions[i], r = Math.random();
  const mine = G.provinces.filter(p => p.owner===i && p.army);
  if(r < .34){ f.uang += 25; log(`Panen raya di ${f.nama}: +25 uang.`); }
  else if(r < .67){ mine.forEach(p => p.army.moral = Math.min(100, p.army.moral+10)); log(`Propaganda menguatkan moral pasukan ${f.nama}.`); }
  else { mine.forEach(p => { kurangi(p.army, .1); if(jumlah(p.army) < 1) p.army = null; }); log(`Wabah melanda pasukan ${f.nama} (-10%).`); }
}

function akhiriTurn(){
  if(G.over) return;
  G.factions.forEach((f,i) => { if(i !== G.player && hidup(i)) aiTurn(i); });
  G.factions.forEach((f,i) => {
    if(!hidup(i)) return;
    const sup = suplai(i); let inc = 0, up = 0;
    G.provinces.forEach(p => {
      if(p.owner !== i) return;
      inc += p.kota ? 10 : 4;
      if(p.army) up += Object.entries(p.army.units).reduce((s,[id,n]) => s + n*UNITS[id].biaya, 0) * .03;
    });
    f.uang = Math.round(f.uang + inc - up);
    const bangkrut = f.uang < 0; if(bangkrut){ f.uang = 0; if(i===G.player) log('Uang habis, gaji pasukan tertunda: moral turun.'); }
    G.provinces.forEach(p => {
      if(p.owner !== i || !p.army) return;
      const a = p.army;
      a.moral += sup.has(p.id) ? (a.moral < 70 ? 2 : 0) : -5;
      if(bangkrut) a.moral -= 10;
      a.moral = Math.min(100, a.moral);
      if(a.moral <= 0){ p.army = null; log(`Pasukan di ${p.nama} membelot dan bubar.`); return; }
      if(!a.act) a.lelah = Math.max(0, a.lelah-1);
      a.act = false;
    });
  });
  if(Math.random() < .25) event();
  G.turn++; log(`--- Turn ${G.turn} ---`);
  cekAkhir();
  if(!G.over) simpan(); else render();
}

function cekAkhir(){
  if(!hidup(G.player)){ G.over = true; menu('<h2>Kalah</h2><p>Semua provinsimu direbut.</p><button onclick="menuAwal()">Main lagi</button>'); }
  else if(G.factions.every((f,i) => i===G.player || !hidup(i))){ G.over = true; menu('<h2>Menang</h2><p>Semua faksi lawan telah tersingkir.</p><button onclick="menuAwal()">Main lagi</button>'); }
}

init();
