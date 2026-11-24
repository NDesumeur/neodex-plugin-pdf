// lancé par le test « local » de NeoDex : un vrai PDF ouvert comme depuis Fichiers ou la Visionneuse (openWithPlugin), sa page doit être dessinée, sans erreur
module.exports = async ({ pj, js, sleep }) => {
  const fs = require('fs'), path = require('path'), os = require('os'), f = path.join(os.tmpdir(), 'essai-neopdf.pdf');
  const objs = ['<</Type/Catalog/Pages 2 0 R>>', '<</Type/Pages/Kids[3 0 R]/Count 1>>', '<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>', null, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>'];
  const stream = 'BT /F1 24 Tf 40 100 Td (Bonjour NeoPDF) Tj ET'; objs[3] = `<</Length ${stream.length}>>stream\n${stream}\nendstream`;
  let out = '%PDF-1.4\n', offs = []; objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF\n`;
  fs.writeFileSync(f, out);
  const make = text => {  // the same PDF with another text (another file for NeoPDF)
    const st = `BT /F1 24 Tf 40 100 Td (${text}) Tj ET`, o2 = [...objs]; o2[3] = `<</Length ${st.length}>>stream\n${st}\nendstream`;
    let s = '%PDF-1.4\n'; const of = []; o2.forEach((o, i) => { of.push(s.length); s += `${i + 1} 0 obj\n${o}\nendobj\n`; });
    const xx = s.length; return s + `xref\n0 ${o2.length + 1}\n0000000000 65535 f \n` + of.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<</Size ${o2.length + 1}/Root 1 0 R>>\nstartxref\n${xx}\n%%EOF\n`;
  };
  const r1 = await js(`openWithPlugin([${JSON.stringify(f)}]).then(v => String(v), e => 'ERR ' + e.message)`); let state = 0;
  for (let i = 0; i < 30 && !state; i++) { await sleep(500); state = await pj(`[...document.querySelectorAll('#pdPages canvas')].filter(c => c.width > 50 && c.height > 50).length`); }  // le PDF se lit puis se dessine : jusqu'à 15 s
  const errs = await js(`[...(pluginErrors.get('neodex.pdf') || []).map(x => x.msg), ...__perr.splice(0)]`);
    if (errs.length) throw new Error(errs.join(' | '));
  if (r1 !== 'true') throw new Error("aucun plugin n'ouvre le PDF : " + r1);
  if (!state) throw new Error("le PDF s'ouvre mais sa page n'est pas dessinée : " + await pj(`(document.querySelector('#pdPages')?.innerHTML || 'pas de #pdPages').slice(0, 300) + ' | ' + [...document.querySelectorAll('.toast, [class*=toast]')].map(t => t.textContent).join(' / ') + ' | ' + document.body.innerText.slice(0, 200)`) + ' | page : ' + await js(`[...document.querySelectorAll('.toast, #toast, [class*=toast]')].map(t => t.textContent).join(' / ').slice(0, 300)`));
  const lay = await pj(`(() => { const p = document.querySelector('.pdPage').getBoundingClientRect(), w = document.getElementById('pdPages').getBoundingClientRect(), bar = document.getElementById('pdBar').getBoundingClientRect();
    return { fits: p.right <= w.right + 1 && p.left >= w.left - 1, bar: Math.round(bar.height), over: [...document.querySelectorAll('.appWrap *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1).length }; })()`);
  if (!lay.fits || lay.over) throw new Error('mise en page : ' + JSON.stringify(lay));
  if (lay.bar > 120) throw new Error('la barre d’outils prend ' + lay.bar + ' px de haut');
  // a second PDF: a second tab, the first one stays open; a click on a tab shows it, × closes it
  const f2 = path.join(os.tmpdir(), 'essai-neopdf-2.pdf'); fs.writeFileSync(f2, make('Second PDF'));
  await js(`openWithPlugin([${JSON.stringify(f2)}])`);
  let tabs = ''; for (let i = 0; i < 20 && !tabs.startsWith('2'); i++) { await sleep(400); tabs = await pj(`document.querySelectorAll('.pdDoc').length + '|' + document.querySelector('.pdDoc.on span')?.textContent`); }
  if (tabs !== '2|essai-neopdf-2.pdf') throw new Error('deux PDF ouverts : ' + tabs);
  await pj(`document.querySelector('.pdDoc:not(.on)').click()`); await sleep(800);
  const back = await pj(`document.querySelector('.pdDoc.on span').textContent + '|' + document.getElementById('pdInfo').textContent`);
  if (!back.startsWith('essai-neopdf.pdf|essai-neopdf.pdf')) throw new Error('retour au premier PDF : ' + back);
  await pj(`document.querySelector('.pdDoc.on b').click()`); await sleep(800);
  const left = await pj(`document.querySelectorAll('.pdDoc').length + '|' + document.querySelector('.pdDoc.on span')?.textContent + '|' + !!document.getElementById('pdFull')`);
  if (left !== '1|essai-neopdf-2.pdf|true') throw new Error('après fermeture : ' + left);
  // remplir et signer : la signature dessinée dans sa fenêtre, puis un texte et la signature posés sur la page, gardés dans l'export
  const sg = await pj(`(async () => { try {
    const v = document.querySelector('.pdWrap').parentNode, P = v.__pd; const st = P.store(); delete st.sig;
    const pr = P.sigPad(); await new Promise(r => setTimeout(r, 100)); const c = document.querySelector('.pdSigPad canvas'), r = c.getBoundingClientRect();
    const ev = (t, x, y) => c.dispatchEvent(new PointerEvent(t, {clientX: r.left + x * r.width, clientY: r.top + y * r.height, pointerId: 7, bubbles: true}));
    ev('pointerdown', .1, .6); for (let k = 1; k <= 10; k++) ev('pointermove', .1 + k * .07, .6 - Math.sin(k) * .3); ev('pointerup', .8, .5);
    [...document.querySelectorAll('.pdSigPad button')].find(b => b.textContent === 'GARDER').click(); const ok = await Promise.race([pr, new Promise(r => setTimeout(() => r('délai'), 3000))]);
    if (!ok || !st.sig?.length || st.sig[0].length < 20 || st.sig[0].some(x => x < 0 || x > 1)) return {err: 'signature : ' + JSON.stringify(st.sig).slice(0, 120)};
    const pd = P.pd, d = st.docs[pd.hash]; d.marks.push({p: 0, t: 'text', c: '#130a20', s: .05, text: 'Jean Martin', pts: [.1, .1]}, {p: 0, t: 'sign', c: '#14205a', w: .3, sig: st.sig, pts: [.5, .55]});
    const g = document.createElement('canvas'); g.width = 300; g.height = 200; P.paint(g.getContext('2d'), 300, 200, d.marks, 1);
    const px = g.getContext('2d').getImageData(0, 0, 300, 200).data; let ink = 0; for (let k = 3; k < px.length; k += 4) if (px[k]) ink++;
    const m = await P.marks(); if (!m[0]?.startsWith('data:image/png') || ink < 100) return {err: 'export : ' + Object.keys(m) + ' ' + ink};
    document.querySelector('#pdPages')?.dispatchEvent(new Event('scroll'));
    return {ink};
  } catch (e) { return {err: e.message}; } })()`);
  if (sg.err) throw new Error(sg.err);
  fs.rmSync(f, { force: true }); fs.rmSync(f2, { force: true });
  return 'remplir et signer ok (' + sg.ink + ' pixels) · PDF ouvert, ' + state + ' page(s) dessinée(s) · 2 PDF en onglets, fermeture d\'un onglet · bouton plein écran';
};
