/**
 * FormSense AI — Frontend Application
 * Connects to the FastAPI backend at /api/*
 */

const API_BASE = window.location.origin;

// ==========================================
// DOM ELEMENTS
// ==========================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const uploadZone = $('#upload-zone');
const fileInput = $('#file-input');
const browseBtn = $('#browse-btn');
const pipelineEl = $('#pipeline-tracker');
const connectorFill = $('#connector-fill');
const resultsPanel = $('#results-panel');
const historyList = $('#history-list');
const statsContent = $('#stats-content');
const toastEl = $('#toast');

// ==========================================
// TAB NAVIGATION
// ==========================================
$$('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        $$('.nav-tab').forEach(t => t.classList.remove('active'));
        $$('.section').forEach(s => s.classList.remove('active'));
        tab.classList.add('active');
        $(`#section-${tab.dataset.tab}`).classList.add('active');

        // Refresh data when switching tabs
        if (tab.dataset.tab === 'history') loadHistory();
        if (tab.dataset.tab === 'stats') loadStats();
    });
});

// ==========================================
// HEALTH CHECK
// ==========================================
async function checkHealth() {
    try {
        const res = await fetch(`${API_BASE}/api/health`);
        const data = await res.json();

        setChip('chip-api', data.services?.api === 'operational');
        setChip('chip-ocr',
            data.services?.ocr_easyocr === 'available' ||
            data.services?.ocr_tesseract === 'available'
        );
        setChip('chip-nlp', data.services?.nlp_spacy === 'available');
        setChip('chip-classifier', data.services?.classifier === 'operational');
    } catch {
        setChip('chip-api', false);
        setChip('chip-ocr', false);
        setChip('chip-nlp', false);
        setChip('chip-classifier', false);
    }
}

function setChip(id, ok) {
    const chip = $(`#${id}`);
    chip.classList.remove('ok', 'warn', 'err');
    chip.classList.add(ok ? 'ok' : 'err');
}

// Run on load
checkHealth();

// ==========================================
// DRAG & DROP + FILE INPUT
// ==========================================
uploadZone.addEventListener('click', (e) => {
    if (e.target !== browseBtn && !browseBtn.contains(e.target)) {
        fileInput.click();
    }
});

browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
        processFile(fileInput.files[0]);
    }
});

['dragenter', 'dragover'].forEach(evt => {
    uploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });
});

['dragleave', 'drop'].forEach(evt => {
    uploadZone.addEventListener(evt, (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
    });
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
        processFile(e.dataTransfer.files[0]);
    }
});

// ==========================================
// FILE PROCESSING
// ==========================================
async function processFile(file) {
    // Validate
    const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.tiff', '.bmp', '.webp'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowed.includes(ext)) {
        showToast(`Unsupported file type: ${ext}`, 'error');
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        showToast('File too large. Maximum size is 20 MB.', 'error');
        return;
    }

    // Show pipeline
    showPipeline();
    resultsPanel.classList.remove('active');
    resultsPanel.innerHTML = '';

    // Simulate pipeline steps with timing
    activateStep(0);      // Upload
    await sleep(400);
    markStepDone(0);
    activateStep(1);      // OCR
    await sleep(300);

    // Upload file
    const formData = new FormData();
    formData.append('file', file);

    try {
        // Simulate OCR step continuing
        markStepDone(1);
        activateStep(2);      // Classify
        await sleep(200);

        markStepDone(2);
        activateStep(3);      // NLP

        const res = await fetch(`${API_BASE}/api/upload`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Upload failed');
        }

        const data = await res.json();

        markStepDone(3);
        activateStep(4);      // Done
        await sleep(300);
        markStepDone(4);

        // Show results
        renderResults(data);
        showToast(`Document processed in ${data.processing_time}s!`, 'success');

    } catch (err) {
        showToast(err.message || 'Processing failed.', 'error');
        hidePipeline();
    }

    // Reset file input
    fileInput.value = '';
}

// ==========================================
// PIPELINE ANIMATION
// ==========================================
const stepsEls = $$('.pipeline-step');
const totalSteps = stepsEls.length;

function showPipeline() {
    pipelineEl.classList.add('active');
    stepsEls.forEach(s => {
        s.classList.remove('active', 'done');
    });
    connectorFill.style.width = '0%';
}

function hidePipeline() {
    pipelineEl.classList.remove('active');
}

function activateStep(index) {
    if (index < totalSteps) {
        stepsEls[index].classList.add('active');
        connectorFill.style.width = `${(index / (totalSteps - 1)) * 100}%`;
    }
}

function markStepDone(index) {
    if (index < totalSteps) {
        stepsEls[index].classList.remove('active');
        stepsEls[index].classList.add('done');
    }
}

// ==========================================
// RENDER RESULTS
// ==========================================
function renderResults(data) {
    resultsPanel.classList.add('active');

    const confidencePercent = Math.round((data.category_confidence || 0) * 100);
    const ocrConfPercent = Math.round((data.text_confidence || 0) * 100);
    const fileSizeKb = (data.file_size / 1024).toFixed(1);
    const textLen = data.extracted_text?.length || 0;

    // Build entities HTML
    const entitiesHtml = buildEntitiesHtml(data.entities);

    // Build key fields HTML
    const fieldsHtml = buildFieldsHtml(data.key_fields);

    // Build category scores HTML
    const scoresHtml = buildScoresHtml(data.all_category_scores, data.document_category);

    resultsPanel.innerHTML = `
        <!-- Header -->
        <div class="results-header">
            <h2>✨ Analysis Results</h2>
            <span class="results-badge">${data.status}</span>
        </div>

        <!-- Stat cards row -->
        <div class="stat-cards">
            <div class="stat-card">
                <div class="stat-icon">🏷️</div>
                <div class="stat-label">Category</div>
                <div class="stat-value">${escHtml(data.document_category)}</div>
                <div class="stat-sub">${confidencePercent}% confidence</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">👁️</div>
                <div class="stat-label">OCR Confidence</div>
                <div class="stat-value">${ocrConfPercent}%</div>
                <div class="stat-sub">${textLen.toLocaleString()} chars extracted</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📄</div>
                <div class="stat-label">File</div>
                <div class="stat-value">${escHtml(data.filename)}</div>
                <div class="stat-sub">${data.file_type} • ${fileSizeKb} KB</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⚡</div>
                <div class="stat-label">Processing Time</div>
                <div class="stat-value">${data.processing_time}s</div>
                <div class="stat-sub">ID: ${data.id}</div>
            </div>
        </div>

        <!-- Detail cards -->
        <div class="detail-grid">
            <!-- Summary -->
            <div class="detail-card">
                <div class="detail-card-title">📝 Summary</div>
                <div class="detail-card-content">${escHtml(data.summary || 'No summary available.')}</div>
            </div>

            <!-- Category Description -->
            <div class="detail-card">
                <div class="detail-card-title">📋 Category Description</div>
                <div class="detail-card-content">${escHtml(data.category_description || '')}</div>
                <div style="margin-top: 16px;">
                    ${scoresHtml}
                </div>
            </div>

            <!-- Entities -->
            <div class="detail-card">
                <div class="detail-card-title">🔍 Extracted Entities</div>
                <div class="detail-card-content">${entitiesHtml}</div>
            </div>

            <!-- Key Fields -->
            <div class="detail-card">
                <div class="detail-card-title">🔑 Key Fields</div>
                <div class="detail-card-content">${fieldsHtml}</div>
            </div>

            <!-- Extracted Text -->
            <div class="detail-card full-width">
                <div class="detail-card-title">📃 Extracted Text</div>
                <div class="detail-card-content">
                    <pre>${escHtml(data.extracted_text || 'No text extracted.')}</pre>
                </div>
            </div>
        </div>
    `;
}

function buildEntitiesHtml(entities) {
    if (!entities) return '<span class="no-entities">No entities detected.</span>';

    const groupMap = {
        names: { label: 'Names', cls: 'name' },
        organizations: { label: 'Organizations', cls: 'org' },
        locations: { label: 'Locations', cls: 'location' },
        dates: { label: 'Dates', cls: 'date' },
        amounts: { label: 'Amounts', cls: 'amount' },
        emails: { label: 'Emails', cls: 'email' },
        phones: { label: 'Phones', cls: 'phone' },
        ids: { label: 'IDs / References', cls: 'id' },
        other: { label: 'Other', cls: '' }
    };

    let html = '';
    let hasAny = false;

    for (const [key, meta] of Object.entries(groupMap)) {
        const items = entities[key];
        if (items && items.length > 0) {
            hasAny = true;
            html += `<div class="entity-group">
                <div class="entity-group-title">${meta.label}</div>
                <div class="entity-tags">
                    ${items.map(i => `<span class="entity-tag ${meta.cls}">${escHtml(i)}</span>`).join('')}
                </div>
            </div>`;
        }
    }

    return hasAny ? html : '<span class="no-entities">No entities detected.</span>';
}

function buildFieldsHtml(fields) {
    if (!fields || Object.keys(fields).length === 0) {
        return '<span class="no-entities">No key fields detected.</span>';
    }

    let html = '<table class="fields-table">';
    for (const [k, v] of Object.entries(fields)) {
        html += `<tr><td>${escHtml(k)}</td><td>${escHtml(v)}</td></tr>`;
    }
    html += '</table>';
    return html;
}

function buildScoresHtml(scores, topCategory) {
    if (!scores || Object.keys(scores).length === 0) return '';

    // Sort by score desc
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    return sorted.map(([cat, score]) => {
        const pct = Math.round(score * 100);
        const isTop = cat === topCategory;
        return `<div class="score-bar-group">
            <div class="score-bar-label">
                <span class="label-name">${escHtml(cat)}</span>
                <span class="label-value">${pct}%</span>
            </div>
            <div class="score-bar-track">
                <div class="score-bar-fill ${isTop ? 'top' : ''}" style="width: ${pct}%"></div>
            </div>
        </div>`;
    }).join('');
}

// ==========================================
// DOCUMENT HISTORY
// ==========================================
async function loadHistory() {
    try {
        const res = await fetch(`${API_BASE}/api/documents`);
        const data = await res.json();

        if (!data.documents || data.documents.length === 0) {
            historyList.innerHTML = `
                <div class="history-empty">
                    <span class="empty-icon">📂</span>
                    <p>No documents processed yet.</p>
                    <p style="margin-top:4px; font-size:13px;">Upload a document to get started!</p>
                </div>`;
            return;
        }

        historyList.innerHTML = data.documents.map(doc => {
            const icon = getFileIcon(doc.file_type);
            const time = new Date(doc.upload_time).toLocaleString();
            const confPct = Math.round((doc.category_confidence || 0) * 100);
            return `
                <div class="history-item" onclick="viewDocument('${doc.id}')">
                    <div class="file-icon">${icon}</div>
                    <div class="file-info">
                        <div class="file-name">${escHtml(doc.filename)}</div>
                        <div class="file-meta">
                            <span>${doc.file_type}</span>
                            <span>${time}</span>
                            <span>${confPct}% confidence</span>
                        </div>
                    </div>
                    <span class="file-category">${escHtml(doc.document_category)}</span>
                    <button class="file-delete" onclick="event.stopPropagation(); deleteDocument('${doc.id}')" title="Delete">🗑️</button>
                </div>`;
        }).join('');

    } catch {
        historyList.innerHTML = `
            <div class="history-empty">
                <span class="empty-icon">⚠️</span>
                <p>Could not load documents.</p>
                <p style="margin-top:4px; font-size:13px;">Make sure the backend is running.</p>
            </div>`;
    }
}

async function viewDocument(id) {
    try {
        const res = await fetch(`${API_BASE}/api/documents/${id}`);
        const data = await res.json();

        // Switch to upload tab and show results
        $$('.nav-tab').forEach(t => t.classList.remove('active'));
        $$('.section').forEach(s => s.classList.remove('active'));
        $('#tab-upload').classList.add('active');
        $('#section-upload').classList.add('active');

        hidePipeline();
        renderResults(data);

    } catch {
        showToast('Failed to load document details.', 'error');
    }
}

async function deleteDocument(id) {
    if (!confirm('Delete this document?')) return;

    try {
        const res = await fetch(`${API_BASE}/api/documents/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Document deleted.', 'info');
            loadHistory();
        } else {
            showToast('Failed to delete.', 'error');
        }
    } catch {
        showToast('Delete failed.', 'error');
    }
}

// ==========================================
// STATS
// ==========================================
async function loadStats() {
    try {
        const res = await fetch(`${API_BASE}/api/stats`);
        const data = await res.json();

        if (data.total_documents === 0) {
            statsContent.innerHTML = `
                <div class="history-empty">
                    <span class="empty-icon">📊</span>
                    <p>No statistics available yet.</p>
                    <p style="margin-top:4px; font-size:13px;">Process some documents to see analytics.</p>
                </div>`;
            return;
        }

        const avgTime = data.avg_processing_time || 0;
        const avgConf = Math.round((data.avg_confidence || 0) * 100);

        let catBreakdown = '';
        if (data.categories && Object.keys(data.categories).length > 0) {
            const total = data.total_documents;
            catBreakdown = Object.entries(data.categories)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => {
                    const pct = Math.round((count / total) * 100);
                    return `<div class="score-bar-group">
                        <div class="score-bar-label">
                            <span class="label-name">${escHtml(cat)}</span>
                            <span class="label-value">${count} docs (${pct}%)</span>
                        </div>
                        <div class="score-bar-track">
                            <div class="score-bar-fill top" style="width: ${pct}%"></div>
                        </div>
                    </div>`;
                }).join('');
        }

        statsContent.innerHTML = `
            <div class="stats-grid">
                <div class="stats-card">
                    <div class="stats-icon">📄</div>
                    <div class="stats-number">${data.total_documents}</div>
                    <div class="stats-label">Total Documents</div>
                </div>
                <div class="stats-card">
                    <div class="stats-icon">⚡</div>
                    <div class="stats-number">${avgTime}s</div>
                    <div class="stats-label">Avg Processing Time</div>
                </div>
                <div class="stats-card">
                    <div class="stats-icon">🎯</div>
                    <div class="stats-number">${avgConf}%</div>
                    <div class="stats-label">Avg Confidence</div>
                </div>
                <div class="stats-card">
                    <div class="stats-icon">🏷️</div>
                    <div class="stats-number">${Object.keys(data.categories || {}).length}</div>
                    <div class="stats-label">Categories Found</div>
                </div>
            </div>
            ${catBreakdown ? `
            <div class="category-breakdown">
                <h3>📊 Category Breakdown</h3>
                ${catBreakdown}
            </div>` : ''}
        `;

    } catch {
        statsContent.innerHTML = `
            <div class="history-empty">
                <span class="empty-icon">⚠️</span>
                <p>Could not load stats.</p>
                <p style="margin-top:4px; font-size:13px;">Make sure the backend is running.</p>
            </div>`;
    }
}

// ==========================================
// UTILITIES
// ==========================================
function escHtml(str) {
    if (typeof str !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function getFileIcon(type) {
    const map = {
        '.pdf': '📕',
        '.png': '🖼️',
        '.jpg': '🖼️',
        '.jpeg': '🖼️',
        '.tiff': '🖼️',
        '.bmp': '🖼️',
        '.webp': '🖼️'
    };
    return map[type] || '📄';
}

function showToast(message, type = 'info') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toastEl.className = `toast ${type}`;
    toastEl.innerHTML = `<span>${icons[type] || ''}</span> ${escHtml(message)}`;
    toastEl.classList.add('show');
    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => toastEl.classList.remove('show'), 4000);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
