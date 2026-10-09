const IKON = {dataran:'🌾', hutan:'🌲', gurun:'🏜️', salju:'❄️', kota:'🏙️'};

function render(){
  const sel = G.sel != null ? G.provinces[G.sel] : null;
  const tg = sel && sel.owner===G.player && sel.army && !sel.army.act ? tetangga(sel.id) : [];
  let h = '';
  for(const p of G.provinces){
    const x = p.c*154+2, y = p.r*124+4, a = p.army;
    const col = p.owner==null ? '#4a5260' : G.factions[p.owner].warna;
    const st = p.id===G.sel ? '#f2d27a' : tg.includes(p.id) ? (p.owner===G.player ? '#9fe39f' : '#ff7b6b') : '#0a0f14';
    h += `<g data-id="${p.id}" style="cursor:pointer"><rect x="${x}" y="${y}" width="150" height="120" rx="8" fill="${col}" fill-opacity=".5" stroke="${st}" stroke-width="${st==='#0a0f14'?1:3}"/>`
      + `<text x="${x+10}" y="${y+22}" fill="#fff" font-size="14" font-weight="700">${p.kota?'★ ':''}${p.nama}</text>`
      + `<text x="${x+10}" y="${y+42}" fill="#ddd" font-size="12">${IKON[p.terrain]} ${p.terrain}</text>`;
    if(a){
      const m = a.moral;
      h += `<text x="${x+10}" y="${y+78}" fill="#fff" font-size="18" font-weight="700">⚔ ${jumlah(a)}${a.jend ? ' '+'★'.repeat(a.jend) : ''}</text>`
        + `<rect x="${x+10}" y="${y+92}" width="130" height="8" rx="4" fill="#0007"/>`
        + `<rect x="${x+10}" y="${y+92}" width="${m*1.3}" height="8" rx="4" fill="${m>=50?'#6fcf6f':m>=25?'#e6c34a':'#e0594a'}"/>`
        + (a.act && p.owner===G.player ? `<text x="${x+128}" y="${y+42}" fill="#fff" font-size="12">✓</text>` : '');
    }
    h += '</g>';
  }
  document.getElementById('map').innerHTML = h;
  const f = G.factions[G.player];
  document.getElementById('bar').innerHTML =
    `<span>Turn <b>${G.turn}</b></span><span style="color:${f.warna}"><b>${f.nama}</b></span><span>💰 ${f.uang}</span>`
    + G.factions.map((x,i) => hidup(i) ? `<span class="chip" style="border-color:${x.warna}">${x.nama} ${G.provinces.filter(p=>p.owner===i).length}</span>` : '').join('')
    + `<button class="alt" onclick="simpan()">Simpan</button>`;
  document.getElementById('panel').innerHTML = panelHtml();
  document.getElementById('log').innerHTML = G.logs.slice().reverse().map(m => `<div>${m}</div>`).join('');
}

function panelHtml(){
  if(G.sel == null) return '<p class="dim">Klik provinsi untuk melihat info. Pilih provinsimu yang punya pasukan, lalu klik provinsi tetangga untuk bergerak atau menyerang.</p>';
  const p = G.provinces[G.sel], own = p.owner === G.player, a = p.army, f = G.factions[G.player];
  let h = `<h2>${p.nama}</h2><p class="dim">${nama(p.owner)} · ${p.terrain} · +${p.kota?10:4} uang/turn</p>`;
  if(a){
    const sup = p.owner==null || suplai(p.owner).has(p.id);
    h += `<ul>${Object.entries(a.units).map(([id,n]) => `<li>${UNITS[id].nama} × ${n}</li>`).join('')}</ul>`
      + `<p>Moral <b>${a.moral}</b> · ${rankName(a)} (XP ${a.xp})<br>Jenderal ${'★'.repeat(a.jend) || '-'} · Lelah ${a.lelah}/5<br>Suplai: ${sup ? 'terhubung' : '<span class="bad">terputus</span>'}</p>`;
  } else h += '<p class="dim">Tidak ada pasukan.</p>';
  if(own){
    const btn = u => { const c = Math.round(u.biaya*5*(u.region===f.region?1:1.5));
      return `<button ${f.uang<c?'disabled':''} title="ATK ${u.atk} · DEF ${u.def} · ${u.tipe}" onclick="beli('${u.id}')">${u.nama} ×5 - ${c}</button>`; };
    const all = Object.values(UNITS).filter(u => u.region !== 'netral');
    h += `<h3>Rekrut</h3>${all.filter(u=>u.region===f.region).map(btn).join('')}`
      + `<details><summary>Unit region lain (biaya ×1,5)</summary>${all.filter(u=>u.region!==f.region).map(btn).join('')}</details>`;
    if(a && a.jend < 5){ const c = 30*(a.jend+1); h += `<button class="alt" ${f.uang<c?'disabled':''} onclick="jenderal()">Rekrut jenderal ★ - ${c}</button>`; }
  }
  return h;
}
