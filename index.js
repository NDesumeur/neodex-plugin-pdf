// NeoPDF : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoDex sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoDex.
// Elle tourne dans le bac à sable de NeoDex, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "<div class=\"appWrap pdWrap\">\n      <div class=\"agHead\"><span class=\"label\">NeoPDF</span><span class=\"hint\" id=\"pdInfo\"></span><div class=\"agNav\"><button class=\"btn main px\" id=\"pdOpenBtn\">OUVRIR UN PDF</button></div></div>\n      <div id=\"pdBar\" class=\"pdBar\"><button class=\"btn px\" id=\"pdPrev\" title=\"Page précédente\">◀</button><input class=\"f\" id=\"pdPageNum\" type=\"number\" min=\"1\" value=\"1\"><span class=\"hint\" id=\"pdTotal\"></span><button class=\"btn px\" id=\"pdNext\" title=\"Page suivante\">▶</button>\n        <button class=\"btn px\" id=\"pdZoomOut\" title=\"Dézoomer\">−</button><span class=\"hint\" id=\"pdZoom\"></span><button class=\"btn px\" id=\"pdZoomIn\" title=\"Zoomer\">+</button><button class=\"btn px\" id=\"pdFit\" title=\"Toute la largeur\">LARGEUR</button>\n        <span id=\"pdTools\" class=\"pdTools\"></span><button class=\"btn px\" id=\"pdUndo\" title=\"Annuler le dernier tracé ou la dernière note\">ANNULER</button>\n        <button class=\"btn px\" id=\"pdCopy\" title=\"Une copie du PDF tel quel\">ENREGISTRER LE PDF</button><button class=\"btn main px\" id=\"pdExport\" title=\"Une copie du PDF avec tes tracés et tes notes\">ENREGISTRER ANNOTÉ</button></div>\n      <div id=\"pdRecentBox\" class=\"sysCard px\"></div>\n      <div id=\"pdPages\" class=\"pdPages\"></div>\n    </div>";
/*CSS-MOVED*/ const CSS = `html.pxc :is(input:not([type=checkbox]):not([type=range]):not([type=color]),textarea,[contenteditable=""],[contenteditable=true],.dcPage,.textLayer span){cursor:var(--ct,text) !important}
.appWrap.pdWrap{max-width:none;margin:0;height:100%;overflow:clip;gap:6px;padding:8px 10px}
.pdBar{display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.pdBar #pdPageNum{width:70px}
.pdTools{display:flex;gap:4px;align-items:center;margin:0 8px}
.pdColor{width:22px;height:22px;border:0;box-shadow:inset 0 0 0 2px #0006;cursor:var(--cp,pointer)}
.pdColor.on{box-shadow:0 0 0 3px #fff}
.pdPages{flex:1;min-height:0;overflow:auto;display:flex;flex-direction:column;align-items:center;gap:14px;padding:14px;background:#05010b;box-shadow:0 0 0 3px var(--line2)}
.pdPages:empty{display:none}
.pdPage{position:relative;flex:none;background:#fff;box-shadow:0 4px 0 #0008}
.pdPage canvas{position:absolute;inset:0;width:100%;height:100%}
.pdPages[data-tool=scroll] .pdInk{pointer-events:none}
.pdPages:not([data-tool=scroll]) .pdInk{cursor:crosshair;touch-action:none}
.pdNum{position:absolute;right:-30px;bottom:0;color:var(--muted);font:11px var(--title)}
.pdNotes{position:absolute;inset:0;pointer-events:none;z-index:3}
.textLayer{position:absolute;text-align:initial;inset:0;overflow:clip;opacity:1;line-height:1;text-size-adjust:none;forced-color-adjust:none;transform-origin:0 0;z-index:2;user-select:text}
.pdPages:not([data-tool=scroll]) .textLayer{pointer-events:none}
.textLayer :is(span,br){color:transparent;position:absolute;white-space:pre;transform-origin:0% 0%}
.textLayer span.markedContent{top:0;height:0}
.textLayer ::selection{background:rgba(180,76,255,.35)}
.pdNote{position:absolute;max-width:45%;padding:6px 10px;background:var(--nc);color:#130a20;font:14px var(--text);white-space:pre-wrap;pointer-events:auto;cursor:var(--cp,pointer);box-shadow:2px 2px 0 #0006}
`;  // le style de ce plugin (il utilise les variables du thème de NeoDex)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const host = ctx.host, { el, toast, sfx, ask, pixIcon, PIX, WX } = host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "pdfApp" ? view : (view.querySelector('#' + id) || document.getElementById(id));  // les identifiants de ta vue d'abord, puis ceux de la page (fenêtres, menus)
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const __icon = () => ctx.icon;  // l'icône de ce plugin
  const __asset = async (rel, type) => URL.createObjectURL(new Blob([Uint8Array.from(atob(await neo.pluginFileRead(ctx.id, rel)), c => c.charCodeAt(0))], { type }));  // un fichier livré avec le plugin
  const __picks = {  };
  const __storeGet = async n => {
    let d = await doc(n);
    if (d == null) { try { d = await neo.storeGet(n); } catch { d = null; } if (d && __picks[n]) d = __picks[n](d); if (d != null) await folder.write(n, d); }  // première ouverture : tu retrouves ce que tu avais
    return d;
  };
  const __storeSet = async (n, d) => { await folder.write(n, d); return true; };
  // ---- ton code d'origine ----
/* ---------- NeoPDF: reads PDFs with pdf.js (vendor/pdfjs, Mozilla, Apache 2.0) and lets you draw on them: pen, highlighter, notes, eraser.
   The annotations of each PDF (found again by its content, wherever the file is) are in the "pdf" store, synced; "Enregistrer annoté"
   writes a copy of the PDF with them (pdf-main.js). A PDF opened by a website opens here instead of downloading. ---------- */
const PD = {colors: ['#ff4f6d', '#ffd07a', '#5fd08a', '#4f9fe0', '#b46aee', '#130a20'], zooms: [.5, .75, 1, 1.25, 1.5, 2, 3], tools: {scroll: 'Défiler', pen: 'Stylo', hl: 'Surligneur', note: 'Note', erase: 'Gomme'}};
let pdLib = null, pdStore = null, pd = null;  // pd: {path, name, hash, url, doc, pages: [{w, h, el, img, ink, done}], zoom, tool, color, undo}
const pdData = async () => pdStore ??= (await __storeGet('pdf')) || {docs: {}};
const pdSave = () => { clearTimeout(pdSave.t); pdSave.t = setTimeout(() => __storeSet('pdf', pdStore), 400); };
const pdDoc = () => pdStore.docs[pd.hash] ??= {name: pd.name, marks: [], notes: [], page: 1};
async function pdOpenPath(p, url) {
  try {
    const f = await neo.pdfRead(p);
    pdLib ??= await import(await __asset('vendor/pdf.min.mjs', 'text/javascript'));
    // le bac à sable de NeoDex refuse de lancer un « worker » depuis un fichier du plugin : la partie qui lit le PDF tourne dans la page,
    // chargée d'avance (pdf.js la prend dans globalThis.pdfjsWorker au lieu de lancer son worker)
    globalThis.pdfjsWorker ??= await import(pdLib.GlobalWorkerOptions.workerSrc = await __asset('vendor/pdf.worker.min.mjs', 'text/javascript'));
    const doc = await pdLib.getDocument({data: f.data, isEvalSupported: false}).promise;  // no eval: a PDF's fonts can't run code
    await pdData();
    pd?.doc?.destroy();
    pd = {path: p, url, name: f.name, hash: f.hash, doc, pages: [], zoom: 1.25, tool: pd?.tool || 'scroll', color: pd?.color || PD.colors[0], undo: []};
    const d = pdDoc(); Object.assign(d, {name: f.name, path: url ? '' : p, url: url || '', at: Date.now(), count: doc.numPages});
    // the list of recent PDFs is kept short
    const old = Object.entries(pdStore.docs).sort((a, b) => b[1].at - a[1].at).slice(30); for (const [h] of old) if (!pdStore.docs[h].marks.length && !pdStore.docs[h].notes.length) delete pdStore.docs[h];
    pd.zoom = await pdFitZoom(); pdSave(); await pdLayout(); pdGo(d.page || 1);
  } catch (e) { toast('PDF illisible : ' + e.message.replace(/^.*Error: /, ''), true); }
}
// as wide as the window, like a browser's PDF viewer
async function pdFitZoom() {
  const w = (await pd.doc.getPage(1)).getViewport({scale: 1}).width, room = ($('pdPages')?.clientWidth || document.documentElement.clientWidth || 1200) - 70;  // la page du plugin (la liste des pages n'existe pas encore au premier PDF)
  return Math.min(4, Math.max(.5, room / w));
}
// the text of a page, invisible over its picture: it can be selected, copied and found with Ctrl+F
async function pdText(p) {
  if (p.text) return; p.text = el('div', 'textLayer'); p.text.style.setProperty('--scale-factor', pd.zoom); p.el.append(p.text);  // pdf.js sizes its text from that variable
  await new pdLib.TextLayer({textContentSource: await p.page.getTextContent(), container: p.text, viewport: p.page.getViewport({scale: pd.zoom})}).render();
}
async function pdTextAll() { if (pd) for (const p of pd.pages) await pdText(p); }
// the pages, as empty boxes of the right size; each one is drawn when it comes into view
async function pdLayout() {
  const box = $('pdPages'); box.replaceChildren(); pd.pages = [];
  pdObs?.disconnect();
  for (let i = 1; i <= pd.doc.numPages; i++) {
    const page = await pd.doc.getPage(i), vp = page.getViewport({scale: pd.zoom}), e = el('div', 'pdPage');
    e.style.width = Math.round(vp.width) + 'px'; e.style.height = Math.round(vp.height) + 'px'; e.dataset.i = i - 1;
    const img = el('canvas', 'pdImg'), ink = el('canvas', 'pdInk'), notes = el('div', 'pdNotes');
    e.append(img, ink, notes, el('span', 'pdNum', String(i)));
    box.append(e); pd.pages.push({page, w: vp.width, h: vp.height, el: e, img, ink, notes, done: false});
  }
  pdObs = new IntersectionObserver(es => { for (const x of es) if (x.isIntersecting) pdRender(+x.target.dataset.i); }, {root: box, rootMargin: '600px 0px'});
  pd.pages.forEach(p => pdObs.observe(p.el));
  pdUi();
}
let pdObs = null;
async function pdRender(i) {
  const p = pd.pages[i]; if (!p || p.done) return; p.done = true;
  const k = devicePixelRatio, vp = p.page.getViewport({scale: pd.zoom * k});
  p.img.width = p.ink.width = vp.width; p.img.height = p.ink.height = vp.height;
  await p.page.render({canvasContext: p.img.getContext('2d'), viewport: vp}).promise;
  pdInk(i); pdText(p).catch(() => {});
}
// the drawings and notes of one page; coordinates are kept as fractions of the page, so the zoom doesn't matter
function pdPaint(g, W, H, marks, scale) {
  for (const m of marks) {
    g.save(); g.lineCap = g.lineJoin = 'round'; g.strokeStyle = m.c;
    g.globalAlpha = m.t === 'hl' ? .35 : 1; g.lineWidth = m.w * scale * (m.t === 'hl' ? 6 : 1);
    g.beginPath(); for (let j = 0; j < m.pts.length; j += 2) (j ? g.lineTo : g.moveTo).call(g, m.pts[j] * W, m.pts[j + 1] * H); g.stroke(); g.restore();
  }
}
function pdInk(i) {
  const p = pd.pages[i]; if (!p?.done) return;
  const g = p.ink.getContext('2d'), d = pdDoc(); g.clearRect(0, 0, p.ink.width, p.ink.height);
  pdPaint(g, p.ink.width, p.ink.height, d.marks.filter(m => m.p === i), pd.zoom * devicePixelRatio);
  p.notes.replaceChildren(...d.notes.filter(n => n.p === i).map(n => {
    const e = el('div', 'pdNote', n.text); e.style.left = n.x * 100 + '%'; e.style.top = n.y * 100 + '%'; e.style.setProperty('--nc', n.c);
    e.title = 'Clic : modifier · vide : supprimer';
    e.onclick = async ev => { ev.stopPropagation(); const t = await ask('Note', n.text); if (t == null) return; if (t.trim()) n.text = t; else d.notes.splice(d.notes.indexOf(n), 1); pdSave(); pdInk(i); };
    return e;
  }));
}
function pdUi() {
  if (!pd) { $('pdInfo').textContent = 'Ouvre un PDF, glisse-en un ici, ou ouvre-en un sur un site.'; $('pdBar').style.display = 'none'; pdRecent(); return; }
  const d = pdDoc(); $('pdBar').style.display = ''; $('pdRecentBox').style.display = 'none';
  $('pdInfo').textContent = pd.name + ' · ' + pd.doc.numPages + ' page' + (pd.doc.numPages > 1 ? 's' : '') + ' · ' + d.marks.length + ' tracé' + (d.marks.length > 1 ? 's' : '') + ', ' + d.notes.length + ' note' + (d.notes.length > 1 ? 's' : '');
  $('pdZoom').textContent = Math.round(pd.zoom * 100) + ' %'; $('pdTotal').textContent = '/ ' + pd.doc.numPages;
  $('pdTools').replaceChildren(...Object.entries(PD.tools).map(([k, n]) => { const b = el('button', 'btn px' + (pd.tool === k ? ' main' : ''), n); b.onclick = () => { pd.tool = k; pdUi(); }; return b; }),
    ...PD.colors.map(c => { const b = el('button', 'pdColor' + (pd.color === c ? ' on' : '')); b.style.background = c; b.title = 'Couleur'; b.onclick = () => { pd.color = c; pdUi(); }; return b; }));
  $('pdPages').dataset.tool = pd.tool;
}
function pdRecent() {
  const box = $('pdRecentBox'); box.style.display = '';
  const list = Object.entries(pdStore?.docs || {}).sort((a, b) => b[1].at - a[1].at);
  box.replaceChildren(el('span', 'label', 'PDF récents'), ...(list.length ? list.map(([h, d]) => {
    const r = el('div', 'txRow vtRow'), n = el('div', 'tn'), acts = el('div', 'dlInfo'), b = el('button', '', d.path ? 'OUVRIR' : 'SUR LE SITE');
    n.append(d.name, el('small', '', (d.count ? d.count + ' pages · ' : '') + d.marks.length + ' tracés, ' + d.notes.length + ' notes · ' + new Date(d.at).toLocaleDateString('fr-FR')));
    b.onclick = () => d.path ? pdOpenPath(d.path) : d.url && host.newTab(d.url);
    acts.append(b); r.append(n, acts); return r;
  }) : [el('div', 'hint', 'Aucun PDF ouvert pour l\'instant.')]));
}
async function pdOpen() { await pdData(); if (pd) { pdUi(); return; } pdUi(); }
function pdGo(n) { const p = pd?.pages[Math.min(pd.pages.length, Math.max(1, n)) - 1]; if (!p) return; const box = $('pdPages'); box.scrollTop += p.el.getBoundingClientRect().top - box.getBoundingClientRect().top; $('pdPageNum').value = n; }
function pdSetZoom(z) { if (!pd) return; const cur = +$('pdPageNum').value || 1; pd.zoom = z; pdLayout().then(() => pdGo(cur)); }
// drawing with the mouse (or a pen): the point in page fractions
const pdAt = (p, e) => { const r = p.el.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]; };
$('pdPages').onpointerdown = e => {
  if (!pd || pd.tool === 'scroll' || e.button) return;
  const pe = e.target.closest('.pdPage'); if (!pe || e.target.closest('.pdNote')) return;
  const i = +pe.dataset.i, p = pd.pages[i], d = pdDoc(); e.preventDefault();
  if (pd.tool === 'note') { const [x, y] = pdAt(p, e); ask('Note', '', 'Elle reste sur la page, à cet endroit').then(t => { if (!t?.trim()) return; const n = {p: i, x, y, text: t, c: pd.color}; d.notes.push(n); pd.undo.push(['notes', n]); pdSave(); pdInk(i); pdUi(); }); return; }
  pe.setPointerCapture(e.pointerId);
  if (pd.tool === 'erase') {
    const rub = ev => { const [x, y] = pdAt(p, ev), r = 12 / p.el.clientWidth, before = d.marks.length;
      d.marks = d.marks.filter(m => m.p !== i || !m.pts.some((v, j) => j % 2 === 0 && Math.hypot(v - x, (m.pts[j + 1] - y) * p.h / p.w) < r));
      if (d.marks.length !== before) { pdInk(i); pdSave(); } };
    rub(e); pe.onpointermove = rub; pe.onpointerup = () => { pe.onpointermove = pe.onpointerup = null; pdUi(); }; return;
  }
  const m = {p: i, t: pd.tool, c: pd.color, w: 2.2, pts: pdAt(p, e)};
  d.marks.push(m); pd.undo.push(['marks', m]);
  pe.onpointermove = ev => { for (const c of ev.getCoalescedEvents?.() || [ev]) m.pts.push(...pdAt(p, c).map(v => Math.round(v * 1e4) / 1e4)); pdInk(i); };
  pe.onpointerup = () => { pe.onpointermove = pe.onpointerup = null; if (m.pts.length < 4) m.pts.push(m.pts[0] + .001, m.pts[1]); pdInk(i); pdSave(); pdUi(); };
};
$('pdPages').onscroll = () => { if (!pd) return; const box = $('pdPages'), mid = box.scrollTop + box.clientHeight / 3; const i = pd.pages.findIndex(p => p.el.offsetTop + p.el.offsetHeight > mid); if (i >= 0 && +$('pdPageNum').value !== i + 1) { $('pdPageNum').value = i + 1; pdDoc().page = i + 1; pdSave(); } };
$('pdPageNum').onchange = e => pdGo(+e.target.value);
$('pdPrev').onclick = () => pdGo((+$('pdPageNum').value || 1) - 1);
$('pdNext').onclick = () => pdGo((+$('pdPageNum').value || 1) + 1);
$('pdFit').onclick = async () => pd && pdSetZoom(await pdFitZoom());
$('pdZoomIn').onclick = () => pd && pdSetZoom(PD.zooms.find(z => z > pd.zoom) || pd.zoom);
$('pdZoomOut').onclick = () => pd && pdSetZoom([...PD.zooms].reverse().find(z => z < pd.zoom) || pd.zoom);
$('pdUndo').onclick = () => { const u = pd?.undo.pop(); if (!u) return; const d = pdDoc(), l = d[u[0]]; if (l.includes(u[1])) l.splice(l.indexOf(u[1]), 1); pdSave(); pdInk(u[1].p); pdUi(); };
$('pdOpenBtn').onclick = async () => { const p = await neo.pdfPick(); if (p) pdOpenPath(p); };
$('pdCopy').onclick = () => pd && neo.pdfSaveCopy(pd.path).then(p => p && toast('PDF enregistré : ' + p));
// the annotated copy: each page with something on it is drawn again on a big transparent canvas (2 pixels per PDF point)
async function pdMarks() {
  const d = pdDoc(), out = {};
  for (const i of new Set([...d.marks.map(m => m.p), ...d.notes.map(n => n.p)])) {
    const vp = pd.pages[i].page.getViewport({scale: 2}), c = el('canvas'); c.width = vp.width; c.height = vp.height;
    const g = c.getContext('2d'); pdPaint(g, c.width, c.height, d.marks.filter(m => m.p === i), 2);
    for (const n of d.notes.filter(n => n.p === i)) {  // a note: a small coloured card with its text
      g.font = '22px "Pixelify Sans", sans-serif'; const lines = n.text.split('\n'), w = Math.min(c.width * .45, Math.max(...lines.map(l => g.measureText(l).width)) + 24), h = lines.length * 26 + 18, x = n.x * c.width, y = n.y * c.height;
      g.fillStyle = n.c; g.globalAlpha = .92; g.fillRect(x, y, w, h); g.globalAlpha = 1; g.fillStyle = n.c === '#130a20' ? '#ffffff' : '#130a20';
      lines.forEach((l, j) => g.fillText(l, x + 12, y + 32 + j * 26, w - 24));
    }
    out[i] = c.toDataURL('image/png');
  }
  return out;
}
$('pdExport').onclick = async () => {
  if (!pd) return; const marks = await pdMarks(); if (!Object.keys(marks).length) return toast('Rien à enregistrer : dessine ou ajoute une note d\'abord', true);
  const out = await neo.pdfExport({src: pd.path, marks, name: pd.name}).catch(e => toast(e.message, true)); if (out) toast('PDF annoté enregistré : ' + out);
};
$('pdfApp').ondragover = e => e.preventDefault();
$('pdfApp').ondrop = e => { e.preventDefault(); const f = [...e.dataTransfer.files].find(f => /\.pdf$/i.test(f.name)); if (f) neo.pathOf(f).then(p => pdOpenPath(p)); };
neo.onPdfOpen(d => { host.newTab('neodex:pdf');  // un PDF du web, pris par NeoDex dans un onglet
  pdOpenPath(d.path, d.url); });
  // ---- fin ----
  ctx.onFiles(files => files[0] && pdOpenPath(files[0]));  // « ouvrir avec » : Fichiers, Visionneuse
  ctx.commands.on('find', () => pdTextAll());  // la recherche dans la page : le texte de chaque page d'abord
  ctx.onOpen(() => { pdOpen(); });
}
