// lancé par le test « local » de NeoDex : un vrai PDF ouvert comme depuis Fichiers ou la Visionneuse (openWithPlugin), sa page doit être dessinée, sans erreur
module.exports = async ({ pj, js, sleep }) => {
  const fs = require('fs'), path = require('path'), os = require('os'), f = path.join(os.tmpdir(), 'essai-neopdf.pdf');
  const objs = ['<</Type/Catalog/Pages 2 0 R>>', '<</Type/Pages/Kids[3 0 R]/Count 1>>', '<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 200]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>', null, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>'];
  const stream = 'BT /F1 24 Tf 40 100 Td (Bonjour NeoPDF) Tj ET'; objs[3] = `<</Length ${stream.length}>>stream\n${stream}\nendstream`;
  let out = '%PDF-1.4\n', offs = []; objs.forEach((o, i) => { offs.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = out.length; out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n` + offs.map(o => String(o).padStart(10, '0') + ' 00000 n \n').join('') + `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${x}\n%%EOF\n`;
  fs.writeFileSync(f, out);
  const r1 = await js(`openWithPlugin([${JSON.stringify(f)}]).then(v => String(v), e => 'ERR ' + e.message)`); let state = 0;
  for (let i = 0; i < 30 && !state; i++) { await sleep(500); state = await pj(`[...document.querySelectorAll('#pdPages canvas')].filter(c => c.width > 50 && c.height > 50).length`); }  // le PDF se lit puis se dessine : jusqu'à 15 s
  const errs = await js(`[...(pluginErrors.get('neodex.pdf') || []).map(x => x.msg), ...__perr.splice(0)]`);
    if (errs.length) throw new Error(errs.join(' | '));
  if (r1 !== 'true') throw new Error("aucun plugin n'ouvre le PDF : " + r1);
  if (!state) throw new Error("le PDF s'ouvre mais sa page n'est pas dessinée : " + await pj(`(document.querySelector('#pdPages')?.innerHTML || 'pas de #pdPages').slice(0, 300) + ' | ' + [...document.querySelectorAll('.toast, [class*=toast]')].map(t => t.textContent).join(' / ') + ' | ' + document.body.innerText.slice(0, 200)`) + ' | page : ' + await js(`[...document.querySelectorAll('.toast, #toast, [class*=toast]')].map(t => t.textContent).join(' / ').slice(0, 300)`));
  fs.rmSync(f, { force: true });
  return 'PDF ouvert, ' + state + ' page(s) dessinée(s)';
};
