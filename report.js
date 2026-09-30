const root = document.getElementById('reportRoot');
const id = new URLSearchParams(location.search).get('id');

if (!id) {
  renderError('Missing investigation ID.');
} else {
  poll(id, 0);
}

async function poll(id, attempt) {
  try {
    const r = await fetch(`/api/status?id=${encodeURIComponent(id)}`);
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || 'Unable to retrieve investigation.');
    if (data.status === 'COMPLETED' || data.status === 'PARTIAL') return render(data);
    if (data.status === 'FAILED') return renderError(data.lastError || 'The investigation failed.');
    renderLoading(data);
    const delay = Math.min(10000, 1800 + attempt * 900);
    setTimeout(() => poll(id, Math.min(attempt + 1, 8)), delay);
  } catch (e) {
    renderError(e.message);
  }
}

function renderLoading(d) {
  root.innerHTML = `<div class="loading-card">
    <div class="spinner"></div>
    <div class="eyebrow">IMAGE INVESTIGATION</div>
    <h2>Investigating image…</h2>
    <p>${escapeHtml(d.stage || 'Processing')} · ${Number(d.progress || 0)}%</p>
    <p class="report-id">This page will update automatically. Apps Script processing may take several minutes.</p>
  </div>`;
}

function render(d) {
  const r = d.result || {};
  const matches = Array.isArray(r.matches) ? r.matches : [];
  const events = Array.isArray(r.timeline) ? r.timeline : [];
  const counts = r.counts || {};

  root.innerHTML = `
  <div class="report-head">
    <div>
      <div class="eyebrow">IMAGE INVESTIGATION</div>
      <h1>Investigation report</h1>
      <div class="report-id">${escapeHtml(d.id)} · ${escapeHtml(d.createdAt || '')}</div>
    </div>
    <span class="status-pill">${escapeHtml(d.status || 'COMPLETED')}</span>
  </div>

  <div class="report-card">
    <div class="metric-grid">
      <div class="metric"><small>Earliest documented appearance found</small><strong>${escapeHtml(r.earliestDate || 'Not established')}</strong></div>
      <div class="metric"><small>Evidence strength</small><strong>${escapeHtml(r.evidenceStrength || 'INCONCLUSIVE')}</strong></div>
      <div class="metric"><small>Matching references</small><strong>${matches.length}</strong></div>
    </div>

    <section class="report-section">
      <h2>Evidence summary</h2>
      <p class="summary">${escapeHtml(r.summary || 'No summary was generated.')}</p>
      ${r.claimAnalysis ? `<div class="claim-box"><strong>Claim context</strong><p>${escapeHtml(r.claimAnalysis)}</p></div>` : ''}
    </section>

    <section class="report-section">
      <h2>Match breakdown</h2>
      <div class="counts">
        ${countBox('Exact / near-exact', counts.exact)}
        ${countBox('Partial', counts.partial)}
        ${countBox('Matching page', counts.pages)}
        ${countBox('Visually similar', counts.similar)}
      </div>
    </section>

    ${r.webContext ? `<section class="report-section">
      <h2>Search context</h2>
      <div class="notice">
        <strong>Best-guess labels</strong>
        <p>${(r.webContext.bestGuessLabels || []).map(escapeHtml).join(', ') || 'None returned.'}</p>
        <strong style="display:block;margin-top:10px">Related web entities</strong>
        <p>${(r.webContext.webEntities || []).map(x => escapeHtml(x.description)).join(', ') || 'None returned.'}</p>
      </div>
    </section>` : ''}

    <section class="report-section">
      <h2>Documented timeline</h2>
      ${events.length ? `<div class="timeline">${events.map(e => `
        <div class="timeline-item">
          <div class="timeline-date">${escapeHtml(e.date || 'Date unavailable')}</div>
          <div class="timeline-title">${escapeHtml(e.title || e.domain || 'Source')}</div>
          <div class="timeline-meta">${escapeHtml(e.domain || '')} · ${dateType(e.dateType)}</div>
        </div>`).join('')}</div>` : '<p class="report-id">No dated timeline events were established.</p>'}
    </section>

    <section class="report-section">
      <h2>Matching sources</h2>
      ${matches.length ? `<div class="source-list">${matches.map(m => `
        <article class="source-card">
          <div class="source-card-top"><span class="match-pill">${escapeHtml(m.matchType || 'match')}</span><span class="source-meta">${escapeHtml(m.date || 'Date unavailable')}</span></div>
          <h3>${escapeHtml(m.title || m.domain || 'Source')}</h3>
          <div class="source-meta">${escapeHtml(m.domain || '')}</div>
          <p><a class="source-link" href="${safeUrl(m.url)}" target="_blank" rel="noopener noreferrer">Open source ↗</a></p>
        </article>`).join('')}</div>` : '<p class="report-id">No matching sources were returned.</p>'}
    </section>

    ${r.fingerprint ? `<section class="report-section">
      <h2>Image fingerprint</h2>
      <div class="hash">${escapeHtml(r.fingerprint)}</div>
      <p class="report-id">SHA-256 identifies the uploaded file exactly. It does not prove who created the image.</p>
    </section>` : ''}

    <section class="report-section">
      <div class="notice">
        <strong>Important limitation</strong>
        <p>“Earliest documented online appearance” means the earliest evidence discovered by the configured search service and date analysis. It does not prove when the image was originally created, taken, or first published.</p>
      </div>
      ${r.methodology ? `<p class="report-id">${escapeHtml(r.methodology)}</p>` : ''}
    </section>

    <div class="report-actions">
      <button class="dark" type="button" onclick="copyReport()">Copy report link</button>
      <a href="index.html#checker">Check another photo</a>
    </div>
  </div>`;
}

function countBox(label, value) {
  return `<div class="count"><b>${Number(value || 0)}</b><span>${label}</span></div>`;
}
function dateType(v) {
  if (v === 'page-published-date') return 'page publication date';
  if (v === 'provider-supplied') return 'provider-supplied date';
  return 'date source unknown';
}
function copyReport() {
  navigator.clipboard?.writeText(location.href).then(() => {
    const button = document.querySelector('.report-actions .dark');
    if (button) { const old = button.textContent; button.textContent = 'Copied ✓'; setTimeout(() => button.textContent = old, 1600); }
  });
}
function renderError(msg) {
  root.innerHTML = `<div class="loading-card"><div class="eyebrow">INVESTIGATION</div><h2>We couldn't load this report.</h2><p>${escapeHtml(msg || 'Unknown error')}</p><div class="report-actions" style="justify-content:center"><a class="dark" href="index.html#checker">Try again</a></div></div>`;
}
function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function safeUrl(v) {
  try { const u = new URL(v); if (u.protocol === 'http:' || u.protocol === 'https:') return u.href; } catch {}
  return '#';
}