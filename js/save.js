// Variabel global bersama
let G, UNITS, FACS, PROVS;
const KEY = 'ww_save';
function simpan(){ try{ localStorage.setItem(KEY, JSON.stringify(G)); log('Game disimpan.'); render(); }catch(e){} }
function muat(){ try{ return JSON.parse(localStorage.getItem(KEY)); }catch(e){ return null; } }
