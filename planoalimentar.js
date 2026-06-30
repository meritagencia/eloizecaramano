/* ==============================
   GERADOR DE PLANOS ALIMENTARES
   Application Logic
   ============================== */

// ── Section Templates ──
const SECTION_TEMPLATES = [
  { id: 'motivacoes', title: 'Motivações', icon: '🎯', color: '#B5697A', defaultTime: '', placeholder: 'Liste as motivações do paciente...\nEx: Emagrecimento, Melhorar composição corporal, Ganho de massa...' },
  { id: 'orientacoes_principais', title: 'Principais Orientações', icon: '📋', color: '#8B4A5F', defaultTime: '', placeholder: 'Orientações gerais sobre hidratação, alimentação, etc...' },
  { id: 'cafe_manha', title: 'Café da Manhã', icon: '☀️', color: '#C8D9A5', defaultTime: '~9h - 9h30', placeholder: 'Descreva as opções de café da manhã...' },
  { id: 'lanche_manha', title: 'Lanche da Manhã', icon: '🍎', color: '#8FA78A', defaultTime: '~10h30', placeholder: 'Opções de lanche da manhã...' },
  { id: 'almoco', title: 'Almoço', icon: '🍽️', color: '#ECC9B2', defaultTime: '~12h', placeholder: 'Descreva as opções de almoço...' },
  { id: 'doce_pos_almoco', title: 'Doce Pós Almoço', icon: '🍫', color: '#CC8999', defaultTime: '~13h30', placeholder: 'Opções de doces controlados pós almoço...' },
  { id: 'lanche_tarde', title: 'Lanche da Tarde', icon: '🥪', color: '#C8D9A5', defaultTime: '~16h - 17h', placeholder: 'Opções de lanche da tarde...' },
  { id: 'lanche_noite', title: 'Lanche da Noite', icon: '🌙', color: '#8B4A5F', defaultTime: '~19h - 19h30', placeholder: 'Opções de lanche da noite...' },
  { id: 'jantar', title: 'Jantar', icon: '🍲', color: '#ECC9B2', defaultTime: '~20h', placeholder: 'Descreva as opções de jantar...' },
  { id: 'substituicoes', title: 'Tabela de Substituições', icon: '🔄', color: '#8FA78A', defaultTime: '', placeholder: 'Fontes de Carboidratos e Proteínas para substituição...' },
  { id: 'orientacoes_gerais', title: 'Orientações Gerais', icon: '📝', color: '#B5697A', defaultTime: '', placeholder: 'Orientações detalhadas: higiene, preparo, dicas gerais...' },
  { id: 'refeicao_livre', title: 'Refeição Livre', icon: '🎉', color: '#C8D9A5', defaultTime: '', placeholder: 'Regras para refeição livre semanal...' },
  { id: 'custom', title: 'Seção Personalizada', icon: '✏️', color: '#6B5C61', defaultTime: '', placeholder: 'Conteúdo personalizado...' },
];

// ── App State ──
let state = {
  currentPlanId: null,
  patientName: '',
  planMonth: '',
  brandName: 'Nutricionista - Eloize Caramano',
  sections: [],
  activeSection: null,
  zoom: 100,
  currentPage: 0,
};

// ── Supabase Setup (lazy — CDN loads async) ──
const supabaseUrl = 'https://wwrfzytsbllfstkbxulm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3cmZ6eXRzYmxsZnN0a2J4dWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODgzMTMsImV4cCI6MjA5Nzg2NDMxM30.ZnmjICkBfUGF0z5p1HizkR99WNDjILb_Q00lkDu3Xbg';
let supabase = null;

function getSupabase() {
  if (supabase) return supabase;
  try {
    if (window.supabase && window.supabase.createClient) {
      supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    }
  } catch (e) {
    console.error("Failed to initialize Supabase:", e);
  }
  return supabase;
}

// ── Login Authentication ──
function checkLogin() {
  const isLogged = sessionStorage.getItem('planoAlimentar_auth') === 'true';
  const overlay = document.getElementById('loginOverlay');
  if (isLogged) {
    overlay.classList.remove('show');
    init(); // Start app
  } else {
    overlay.classList.add('show');
  }
}

function attemptLogin() {
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  const error = document.getElementById('loginError');
  
  if (user === 'eloizecaramano' && pass === '10203040') {
    sessionStorage.setItem('planoAlimentar_auth', 'true');
    document.getElementById('loginOverlay').classList.remove('show');
    error.textContent = '';
    init(); // Start app
  } else {
    error.textContent = 'Usuário ou senha incorretos.';
    document.getElementById('loginPass').value = '';
    document.getElementById('loginPass').focus();
  }
}

// ── Initialize ──
function init() {
  try {
    loadLocalState();
    if (!state.sections || state.sections.length === 0) {
      state.sections = [];
      addDefaultSections();
    }
    bindEvents();
    renderSections();
    renderPreview();
  } catch (e) {
    console.error('App initialization error:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnLogin = document.getElementById('btnLogin');
  const loginPass = document.getElementById('loginPass');
  const loginUser = document.getElementById('loginUser');
  
  if (btnLogin) {
    btnLogin.addEventListener('click', attemptLogin);
    loginPass.addEventListener('keypress', e => { if (e.key === 'Enter') attemptLogin(); });
    loginUser.addEventListener('keypress', e => { if (e.key === 'Enter') loginPass.focus(); });
  }
  
  checkLogin();
});

function addDefaultSections() {
  const defaults = ['motivacoes', 'orientacoes_principais', 'cafe_manha', 'almoco', 'lanche_tarde', 'jantar', 'orientacoes_gerais'];
  defaults.forEach(id => {
    const template = SECTION_TEMPLATES.find(t => t.id === id);
    if (template) {
      state.sections.push({
        uid: generateUID(),
        templateId: template.id,
        title: template.title,
        icon: template.icon,
        color: template.color,
        time: template.defaultTime,
        content: '',
      });
    }
  });
}

function generateUID() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ── Event Bindings ──
function bindEvents() {
  // Patient info
  document.getElementById('patientName').addEventListener('input', e => {
    state.patientName = e.target.value;
    renderPreview();
  });
  document.getElementById('planMonth').addEventListener('input', e => {
    state.planMonth = e.target.value;
    renderPreview();
  });
  document.getElementById('brandName').addEventListener('input', e => {
    state.brandName = e.target.value;
    renderPreview();
  });

  // Set initial values
  document.getElementById('patientName').value = state.patientName;
  document.getElementById('planMonth').value = state.planMonth;
  document.getElementById('brandName').value = state.brandName;

  // Top bar buttons
  document.getElementById('btnNew').addEventListener('click', newPlan);
  document.getElementById('btnSave').addEventListener('click', () => saveState(true));
  document.getElementById('btnExport').addEventListener('click', exportPDF);
  document.getElementById('btnMyPlans').addEventListener('click', openPlansModal);

  // Modals
  document.getElementById('modalPlansClose').addEventListener('click', closePlansModal);
  document.getElementById('plansModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closePlansModal();
  });

  // Add section modal
  document.getElementById('btnAddSection').addEventListener('click', openAddSectionModal);
  document.getElementById('modalCancel').addEventListener('click', closeAddSectionModal);
  document.getElementById('addSectionModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeAddSectionModal();
  });

  // Zoom controls
  
  

  // Page navigation
  document.getElementById('prevPage').addEventListener('click', () => navigatePage(-1));
  document.getElementById('nextPage').addEventListener('click', () => navigatePage(1));

  // Auto-save
  setInterval(() => saveState(false), 30000);
}

// ── Sections Rendering ──
function renderSections() {
  const list = document.getElementById('sectionsList');
  list.innerHTML = '';

  state.sections.forEach((section, index) => {
    const item = document.createElement('div');
    item.className = `section-item${state.activeSection === section.uid ? ' active' : ''}`;
    item.dataset.uid = section.uid;

    item.innerHTML = `
      <div class="section-header" data-uid="${section.uid}">
        <div class="section-drag-handle" title="Arrastar para reordenar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
        </div>
        <div class="section-icon" style="background: ${section.color}15; color: ${section.color};">${section.icon}</div>
        <span class="section-title-text">${section.title}</span>
        <div class="section-actions">
          <button class="section-action-btn" title="Mover para cima" onclick="moveSection('${section.uid}', -1); event.stopPropagation();">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button class="section-action-btn" title="Mover para baixo" onclick="moveSection('${section.uid}', 1); event.stopPropagation();">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button class="section-action-btn delete" title="Remover seção" onclick="removeSection('${section.uid}'); event.stopPropagation();">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="section-toggle">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>
      <div class="section-content">
        <input type="text" class="section-title-input" value="${section.title}" placeholder="Título da seção" data-uid="${section.uid}" data-field="title" />
        <div class="section-time-row">
          <label>Horário:</label>
          <input type="text" value="${section.time || ''}" placeholder="Ex: ~12h - 12h30" data-uid="${section.uid}" data-field="time" />
        </div>
        <div class="editor-toolbar" id="toolbar-${section.uid}">
          <button class="toolbar-btn" data-cmd="bold" title="Negrito (Ctrl+B)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg></button>
          <button class="toolbar-btn" data-cmd="italic" title="Itálico (Ctrl+I)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg></button>
          <button class="toolbar-btn" data-cmd="underline" title="Sublinhado (Ctrl+U)"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg></button>
          <span class="toolbar-separator"></span>
          <button class="toolbar-btn" data-cmd="insertUnorderedList" title="Lista com marcadores"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor"/><circle cx="4" cy="12" r="1.5" fill="currentColor"/><circle cx="4" cy="18" r="1.5" fill="currentColor"/></svg></button>
          <button class="toolbar-btn" data-cmd="insertOrderedList" title="Lista numerada"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><text x="3" y="8" font-size="7" fill="currentColor" font-weight="bold">1</text><text x="3" y="14" font-size="7" fill="currentColor" font-weight="bold">2</text><text x="3" y="20" font-size="7" fill="currentColor" font-weight="bold">3</text></svg></button>
          <span class="toolbar-separator"></span>
          <button class="toolbar-btn" data-cmd="removeFormat" title="Remover formatação"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 10L3 10M21 6L3 6"/><line x1="21" y1="3" x2="3" y2="21" stroke-width="2.5"/></svg></button>
        </div>
        <div class="rich-editor ${section.templateId === 'motivacoes' ? 'motivacoes-editor' : ''}" contenteditable="true" id="editor-${section.uid}" data-uid="${section.uid}" data-placeholder="${getPlaceholder(section.templateId)}">${section.content}</div>
        <div class="block-inserter">
          <button class="block-insert-btn atencao" onclick="insertBlock('${section.uid}', 'atencao')" title="Inserir bloco de atenção">
            ⚠️ Atenção
          </button>
          <button class="block-insert-btn obs" onclick="insertBlock('${section.uid}', 'obs')" title="Inserir bloco de observação">
            💡 Obs
          </button>
          <button class="block-insert-btn opcao" onclick="insertBlock('${section.uid}', 'opcao')" title="Inserir bloco de opção">
            ✅ Opção
          </button>
          <button class="block-insert-btn divisor" onclick="insertBlock('${section.uid}', 'divisor')" title="Inserir linha divisória">
            ─ Divisor
          </button>
        </div>
      </div>
    `;

    list.appendChild(item);

    // Bind section header click
    item.querySelector('.section-header').addEventListener('click', () => {
      toggleSection(section.uid);
    });

    // Bind section title input
    const titleInput = item.querySelector('.section-title-input');
    titleInput.addEventListener('input', e => {
      section.title = e.target.value;
      item.querySelector('.section-title-text').textContent = e.target.value;
      debounceRenderPreview();
    });

    // Bind time input
    const timeInput = item.querySelector('[data-field="time"]');
    timeInput.addEventListener('input', e => {
      section.time = e.target.value;
      debounceRenderPreview();
    });

    // Bind rich editor
    const editor = item.querySelector('.rich-editor');
    editor.addEventListener('input', () => {
      section.content = editor.innerHTML;
      debounceRenderPreview();
    });

    // Bind toolbar buttons
    const toolbar = item.querySelector('.editor-toolbar');
    toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        document.execCommand(cmd, false, null);
        updateToolbarState(toolbar);
      });
    });

    // Track selection for toolbar state
    editor.addEventListener('keyup', () => updateToolbarState(toolbar));
    editor.addEventListener('mouseup', () => updateToolbarState(toolbar));
  });
}

function getPlaceholder(templateId) {
  const tmpl = SECTION_TEMPLATES.find(t => t.id === templateId);
  return tmpl ? tmpl.placeholder : 'Digite o conteúdo da seção...';
}

function updateToolbarState(toolbar) {
  toolbar.querySelectorAll('.toolbar-btn[data-cmd]').forEach(btn => {
    const cmd = btn.dataset.cmd;
    if (['bold', 'italic', 'underline'].includes(cmd)) {
      btn.classList.toggle('active', document.queryCommandState(cmd));
    }
  });
}

// ── Section Management ──
function toggleSection(uid) {
  state.activeSection = state.activeSection === uid ? null : uid;
  renderSections();
}

function moveSection(uid, direction) {
  const idx = state.sections.findIndex(s => s.uid === uid);
  const newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= state.sections.length) return;
  const temp = state.sections[idx];
  state.sections[idx] = state.sections[newIdx];
  state.sections[newIdx] = temp;
  renderSections();
  renderPreview();
}

function removeSection(uid) {
  if (!confirm('Remover esta seção?')) return;
  state.sections = state.sections.filter(s => s.uid !== uid);
  if (state.activeSection === uid) state.activeSection = null;
  renderSections();
  renderPreview();
}

// ── Add Section Modal ──
function openAddSectionModal() {
  const grid = document.getElementById('modalSectionsGrid');
  grid.innerHTML = '';

  SECTION_TEMPLATES.forEach(tmpl => {
    const btn = document.createElement('button');
    btn.className = 'modal-section-option';
    btn.innerHTML = `<span class="opt-icon">${tmpl.icon}</span> ${tmpl.title}`;
    btn.addEventListener('click', () => {
      addSection(tmpl.id);
      closeAddSectionModal();
    });
    grid.appendChild(btn);
  });

  document.getElementById('addSectionModal').classList.add('show');
}

function closeAddSectionModal() {
  document.getElementById('addSectionModal').classList.remove('show');
}

function addSection(templateId) {
  const template = SECTION_TEMPLATES.find(t => t.id === templateId);
  if (!template) return;

  const section = {
    uid: generateUID(),
    templateId: template.id,
    title: template.title,
    icon: template.icon,
    color: template.color,
    time: template.defaultTime,
    content: '',
  };

  state.sections.push(section);
  state.activeSection = section.uid;
  renderSections();
  renderPreview();

  // Scroll to new section
  setTimeout(() => {
    const el = document.querySelector(`[data-uid="${section.uid}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);

  showToast('Seção adicionada!');
}

// ── Insert Special Blocks ──
function insertBlock(uid, type) {
  const editor = document.getElementById(`editor-${uid}`);
  if (!editor) return;

  editor.focus();
  let html = '';

  switch (type) {
    case 'atencao':
      html = '<div style="margin:8px 0;padding:10px 14px;background:#F3F8EA;border-left:3px solid #C8D9A5;border-radius:0 6px 6px 0;"><strong style="color:#879766;font-size:0.85em;letter-spacing:0.05em;">⚠️ ATENÇÃO:</strong><br>Insira sua observação aqui...</div><p><br></p>';
      break;
    case 'obs':
      html = '<div style="margin:8px 0;padding:10px 14px;background:#FDF8F5;border-left:3px solid #ECC9B2;border-radius:0 6px 6px 0;"><strong style="color:#879766;font-size:0.85em;letter-spacing:0.05em;">💡 OBS:</strong><br>Insira a observação aqui...</div><p><br></p>';
      break;
    case 'opcao':
      html = '<div style="margin:10px 0;"><strong style="color:#5B6743;">Opção 1:</strong><br>Descreva os alimentos e quantidades...</div><p><br></p>';
      break;
    case 'divisor':
      html = '<hr style="border:none;height:1px;background:linear-gradient(90deg,#C8D9A5,transparent);margin:12px 0;"><p><br></p>';
      break;
  }

  document.execCommand('insertHTML', false, html);
  const section = state.sections.find(s => s.uid === uid);
  if (section) {
    section.content = editor.innerHTML;
    debounceRenderPreview();
  }
}

// ── Preview Rendering ──
let previewTimeout;
function debounceRenderPreview() {
  clearTimeout(previewTimeout);
  previewTimeout = setTimeout(renderPreview, 300);
}

function renderPreview() {
  const container = document.getElementById('pdfContainer');
  container.innerHTML = '';

  // Cover page
  container.appendChild(createCoverPage());

  // Content pages for each section (with auto-splitting)
  state.sections.forEach(section => {
    if (section.content || section.title) {
      const pages = createContentPages(section);
      pages.forEach(p => container.appendChild(p));
    }
  });

  // Update page count
  const pages = container.querySelectorAll('.pdf-page');
  const total = pages.length;
  state.currentPage = Math.min(state.currentPage, total - 1);
  updatePageIndicator(total);

  // Apply zoom
  applyZoom();
}

function createCoverPage() {
  const page = document.createElement('div');
  page.className = 'pdf-page pdf-cover';
  page.innerHTML = `
    <img src="images/logoelo.png" alt="Eloize Caramano" style="width: 160px; height: auto; margin-bottom: 2rem; position: relative; z-index: 2;" />
    <div class="cover-accent-line"></div>
    <div class="cover-title">Plano<br>Alimentar</div>
    <div class="cover-subtitle">Personalizado para você</div>
    <div style="width:40px;height:1px;background:rgba(255,255,255,0.2);margin-bottom:2.5rem;position:relative;z-index:2;"></div>
    <div class="cover-patient-name">${state.patientName || 'Nome do Paciente'}</div>
    <div class="cover-date">${state.planMonth || 'Mês — Ano'}</div>
    <div class="cover-brand">${state.brandName || ''}</div>
    <div class="cover-bottom-line"></div>
  `;
  return page;
}

// Maximum height for the body content area (842 total - header ~60 - footer ~50 - title area ~80 - padding ~60)
const MAX_BODY_HEIGHT = 590;

function createContentPages(section) {
  const processedContent = processContentForPDF(section.content, section.templateId);
  if (!processedContent) {
    return [buildSinglePage(section, '<span style="color:#C4B4BA;font-style:italic;">Conteúdo vazio — edite a seção ao lado</span>', false)];
  }

  // Create a temporary hidden container to measure content height
  const measurer = document.createElement('div');
  measurer.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:545px;visibility:hidden;';
  measurer.className = 'pdf-content-page';
  measurer.innerHTML = `
    <div class="pdf-body" style="padding:0;">
      <div class="pdf-text" style="margin:0;">${processedContent}</div>
    </div>
  `;
  document.body.appendChild(measurer);

  const textContainer = measurer.querySelector('.pdf-text');
  const totalHeight = textContainer.scrollHeight;

  if (totalHeight <= MAX_BODY_HEIGHT) {
    // Content fits in one page
    document.body.removeChild(measurer);
    return [buildSinglePage(section, processedContent, false)];
  }

  // Content needs multiple pages — split at block boundaries
  const pages = [];
  const contentChunks = splitContentIntoChunks(processedContent, measurer);
  document.body.removeChild(measurer);

  contentChunks.forEach((chunk, index) => {
    pages.push(buildSinglePage(section, chunk, index > 0));
  });

  return pages;
}

function splitContentIntoChunks(html, measurer) {
  const textContainer = measurer.querySelector('.pdf-text');
  const chunks = [];

  // Parse HTML into block-level elements
  const wrapper = document.createElement('div');
  wrapper.innerHTML = html;

  // Collect all top-level nodes
  const nodes = Array.from(wrapper.childNodes);
  if (nodes.length === 0) return [html];

  let currentChunkNodes = [];
  let currentHeight = 0;

  // Title area takes ~80px on first page, ~65px on continuation
  const firstPageMax = MAX_BODY_HEIGHT - 80;
  const contPageMax = MAX_BODY_HEIGHT - 40;
  let isFirstPage = true;
  let maxH = firstPageMax;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    // Measure this node's height
    const tempDiv = document.createElement('div');
    tempDiv.className = 'pdf-text';
    tempDiv.style.cssText = 'margin:0;padding:0;width:545px;';
    if (node.nodeType === Node.TEXT_NODE) {
      tempDiv.textContent = node.textContent;
    } else {
      tempDiv.appendChild(node.cloneNode(true));
    }

    textContainer.innerHTML = '';
    textContainer.appendChild(tempDiv);
    const nodeHeight = tempDiv.scrollHeight;

    if (currentHeight + nodeHeight > maxH && currentChunkNodes.length > 0) {
      // Save current chunk and start a new page
      chunks.push(nodesToHTML(currentChunkNodes));
      currentChunkNodes = [];
      currentHeight = 0;
      isFirstPage = false;
      maxH = contPageMax;
    }

    currentChunkNodes.push(node.cloneNode(true));
    currentHeight += nodeHeight;
  }

  // Push remaining content
  if (currentChunkNodes.length > 0) {
    chunks.push(nodesToHTML(currentChunkNodes));
  }

  return chunks.length > 0 ? chunks : [html];
}

function nodesToHTML(nodes) {
  const div = document.createElement('div');
  nodes.forEach(n => div.appendChild(n));
  return div.innerHTML;
}

function buildSinglePage(section, contentHTML, isContinuation) {
  const page = document.createElement('div');
  page.className = 'pdf-page pdf-content-page';

  const continuationBadge = isContinuation
    ? '<span class="pdf-page-continuation">continuação</span>'
    : '';

  const timeHTML = (!isContinuation && section.time)
    ? `<div class="pdf-page-time">${section.time}</div>`
    : '<div style="margin-bottom:1rem;"></div>';

  page.innerHTML = `
    <div class="pdf-header">
      <div class="pdf-header-brand">${state.brandName || 'Nutricionista'}</div>
      <div class="pdf-header-patient">${state.patientName || ''} ${state.planMonth ? '· ' + state.planMonth : ''}</div>
    </div>
    <div class="pdf-body" data-template="${section.templateId}">
      <div class="pdf-page-title">${section.icon} ${section.title}${continuationBadge}</div>
      ${timeHTML}
      <div class="pdf-text">${contentHTML}</div>
    </div>
    <div class="pdf-footer-line"></div>
    <div class="pdf-footer">
      <span>${state.brandName || ''}</span>
      <span>Plano Alimentar — ${state.patientName || ''}</span>
    </div>
  `;

  return page;
}

function processContentForPDF(html, templateId) {
  if (!html) return '';

  let processed = html;

  if (templateId === 'motivacoes') {
    // Wrap plain text in divs so it can be styled as cards
    const temp = document.createElement('div');
    temp.innerHTML = processed;
    let newHtml = '';
    temp.childNodes.forEach(node => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        newHtml += `<div>${node.textContent}</div>`;
      } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'BR') {
        newHtml += node.outerHTML;
      }
    });
    processed = newHtml || processed;
  }

  // Strip any color:white or color:rgb(255,255,255) inline styles
  processed = processed.replace(/color\s*:\s*(white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))\s*;?/gi, '');

  // Convert attention blocks
  processed = processed.replace(
    /<div[^>]*background:\s*#F3F8EA[^>]*>([\s\S]*?)<\/div>/gi,
    '<div class="pdf-attention">$1</div>'
  );

  // Convert obs blocks
  processed = processed.replace(
    /<div[^>]*background:\s*#FDF8F5[^>]*>([\s\S]*?)<\/div>/gi,
    '<div class="pdf-obs">$1</div>'
  );

  // Convert option headers
  processed = processed.replace(
    /<strong[^>]*color:\s*#5B6743[^>]*>(Opção\s*(\d+):)<\/strong>/gi,
    (match, text, num) => {
      return `<div class="pdf-option-header"><span class="pdf-option-number">${num}</span><span class="pdf-option-label">Opção ${num}</span></div>`;
    }
  );

  // Convert hr dividers
  processed = processed.replace(
    /<hr[^>]*>/gi,
    '<div class="pdf-divider"></div>'
  );

  // Remove any remaining color:white from inline styles
  processed = processed.replace(/style="[^"]*"/gi, (match) => {
    return match.replace(/color\s*:\s*(white|#fff(?:fff)?|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))\s*;?/gi, '');
  });

  return processed;
}

// ── Zoom ──
function setZoom(value) {
  state.zoom = Math.max(50, Math.min(150, value));
  document.getElementById('zoomLevel').textContent = state.zoom + '%';
  applyZoom();
}

function applyZoom() {}

// ── Page Navigation ──
function navigatePage(direction) {
  const pages = document.querySelectorAll('.pdf-page');
  const total = pages.length;
  if (total === 0) return;

  state.currentPage = Math.max(0, Math.min(total - 1, state.currentPage + direction));

  pages[state.currentPage].scrollIntoView({ behavior: 'smooth', block: 'start' });
  updatePageIndicator(total);
}

function updatePageIndicator(total) {
  document.getElementById('pageIndicator').textContent = `Página ${state.currentPage + 1} de ${total || 1}`;
  document.getElementById('prevPage').disabled = state.currentPage <= 0;
  document.getElementById('nextPage').disabled = state.currentPage >= total - 1;
}

// ── Save / Load State ──
async function saveState(isManual = false) {
  // Local backup
  try {
    const localData = {
      currentPlanId: state.currentPlanId,
      patientName: state.patientName,
      planMonth: state.planMonth,
      brandName: state.brandName,
      sections: state.sections,
    };
    localStorage.setItem('planoAlimentar_state', JSON.stringify(localData));
  } catch(e) {}

  // If auto-save and no plan id, just skip supabase save to avoid creating empty plans
  if (!isManual && !state.currentPlanId) return;

  const btnSave = document.getElementById('btnSave');
  if (isManual) btnSave.innerHTML = 'Salvando...';

  if (!getSupabase()) {
    if (isManual) showToast('Rascunho salvo localmente!', 'success');
    if (isManual) btnSave.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar`;
    return;
  }
  
  try {
    const data = {
      patient_name: state.patientName,
      plan_month: state.planMonth,
      brand_name: state.brandName,
      sections: state.sections,
      updated_at: new Date().toISOString()
    };

    const sb = getSupabase();
    if (state.currentPlanId) {
      const { error } = await sb.from('plans').update(data).eq('id', state.currentPlanId);
      if (error) throw error;
      if (isManual) showToast('Plano atualizado na nuvem!', 'success');
    } else if (isManual) {
      const { data: newPlan, error } = await sb.from('plans').insert([data]).select().single();
      if (error) throw error;
      state.currentPlanId = newPlan.id;
      showToast('Plano salvo na nuvem!', 'success');
    }
  } catch (e) {
    console.error('Save error:', e);
    if (isManual) showToast('Erro ao salvar na nuvem');
  } finally {
    if (isManual) btnSave.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar`;
  }
}

function loadLocalState() {
  try {
    const saved = localStorage.getItem('planoAlimentar_state');
    if (saved) {
      const data = JSON.parse(saved);
      state.currentPlanId = data.currentPlanId || null;
      state.patientName = data.patientName || '';
      state.planMonth = data.planMonth || '';
      state.brandName = data.brandName || 'Nutricionista - Eloize Caramano';
      state.sections = data.sections || [];
    }
  } catch (e) {
    console.error('Load error:', e);
  }
}

function newPlan() {
  if (!confirm('Criar um novo plano? O progresso não salvo será perdido.')) return;
  localStorage.removeItem('planoAlimentar_state');
  state.currentPlanId = null;
  state.patientName = '';
  state.planMonth = '';
  state.brandName = 'Nutricionista - Eloize Caramano';
  state.sections = [];
  state.activeSection = null;
  addDefaultSections();

  document.getElementById('patientName').value = '';
  document.getElementById('planMonth').value = '';
  document.getElementById('brandName').value = 'Nutricionista - Eloize Caramano';

  renderSections();
  renderPreview();
  showToast('Novo plano criado!');
}

// ── Export PDF (Identical to GeradorApresentacao) ──
async function exportPDF() {
  const overlay = document.getElementById('exportOverlay');
  const btnExport = document.getElementById('btnExport');
  
  if (overlay) overlay.classList.add('show');
  if (btnExport) {
    btnExport.disabled = true;
    btnExport.innerHTML = '<div class="spinner"></div> GERANDO...';
  }

  try {
    saveState();
    
    const container = document.getElementById('pdfContainer');
    const pages = container.querySelectorAll('.pdf-page');

    if (!pages.length) {
      showToast('Nenhuma página para exportar');
      return;
    }

    const W = 108; // Largura base proporcional do Gerador
    const jsPDFLib = window.jspdf || window.jsPDF;
    if (!jsPDFLib) throw new Error('jsPDF não carregou. Recarregue a página.');
    const JsPDF = jsPDFLib.jsPDF || jsPDFLib;
    
    let pdf;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const isCover = page.classList.contains('pdf-cover');

      // Sem firulas: captura a página renderizada, assumindo que não tem escala
      const c = await html2canvas(page, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: isCover ? '#5B6743' : '#ffffff', 
        logging: false 
      });

      const H = (c.height * W) / c.width;
      const imgData = c.toDataURL('image/jpeg', 0.95);

      if (i === 0) {
        pdf = new JsPDF({ orientation: 'portrait', unit: 'mm', format: [W, H] });
        pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
      } else {
        pdf.addPage([W, H], 'portrait');
        pdf.addImage(imgData, 'JPEG', 0, 0, W, H);
      }
    }

    pdf.save(`Plano Alimentar - ${state.patientName || 'Paciente'}.pdf`);
    showToast('PDF exportado com sucesso!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Erro: ' + err.message);
  } finally {
    if (overlay) overlay.classList.remove('show');
    if (btnExport) {
      btnExport.disabled = false;
      btnExport.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Baixar PDF`;
    }
  }
}

// ── Toast ──
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}
// ── Supabase Plans Modal ──
async function openPlansModal() {
  if (!getSupabase()) {
    showToast('A conexão com o banco de dados ainda não está pronta. Aguarde um instante e tente novamente.');
    return;
  }

  document.getElementById('plansModal').classList.add('show');
  const list = document.getElementById('plansList');
  list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--gray-500);">Carregando planos...</div>';

  try {
    const sb = getSupabase();
    const { data: plans, error } = await sb
      .from('plans')
      .select('id, patient_name, plan_month, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (plans.length === 0) {
      list.innerHTML = '<div style="padding: 2rem; text-align: center; color: var(--gray-500);">Nenhum plano salvo ainda.</div>';
      return;
    }

    list.innerHTML = '';
    plans.forEach(plan => {
      const date = new Date(plan.created_at).toLocaleDateString('pt-BR');
      const item = document.createElement('div');
      item.className = 'plan-item';
      item.innerHTML = `
        <div class="plan-info">
          <h4>${plan.patient_name || 'Sem nome'}</h4>
          <p>${plan.plan_month || 'Sem mês'} • Criado em ${date}</p>
        </div>
        <div class="plan-actions">
          <button class="btn-open" onclick="loadPlanFromDb('${plan.id}')">Abrir</button>
          <button class="btn-duplicate" onclick="duplicatePlanFromDb('${plan.id}')">Duplicar</button>
          <button class="btn-delete-plan" onclick="deletePlan('${plan.id}')" title="Excluir">×</button>
        </div>
      `;
      list.appendChild(item);
    });
  } catch (e) {
    console.error(e);
    list.innerHTML = '<div style="padding: 2rem; text-align: center; color: #c53030;">Erro ao carregar planos.</div>';
  }
}

function closePlansModal() {
  document.getElementById('plansModal').classList.remove('show');
}

async function loadPlanFromDb(id) {
  try {
    const sb = getSupabase();
    if (!sb) { showToast('Banco de dados não conectado'); return; }
    const { data, error } = await sb.from('plans').select('*').eq('id', id).single();
    if (error) throw error;

    state.currentPlanId = data.id;
    state.patientName = data.patient_name || '';
    state.planMonth = data.plan_month || '';
    state.brandName = data.brand_name || 'Nutricionista - Eloize Caramano';
    state.sections = data.sections || [];
    state.activeSection = null;

    updateUIWithState();
    closePlansModal();
    showToast('Plano carregado!', 'success');
  } catch (e) {
    console.error(e);
    showToast('Erro ao carregar plano');
  }
}

async function duplicatePlanFromDb(id) {
  try {
    const sb = getSupabase();
    if (!sb) { showToast('Banco de dados não conectado'); return; }
    const { data, error } = await sb.from('plans').select('*').eq('id', id).single();
    if (error) throw error;

    state.currentPlanId = null; // Forces insert on save
    state.patientName = (data.patient_name || 'Paciente') + ' (Cópia)';
    state.planMonth = data.plan_month || '';
    state.brandName = data.brand_name || 'Nutricionista - Eloize Caramano';
    state.sections = data.sections || [];
    state.activeSection = null;

    updateUIWithState();
    closePlansModal();
    showToast('Plano duplicado! Clique em Salvar para criar no banco.', 'success');
  } catch (e) {
    console.error(e);
    showToast('Erro ao duplicar plano');
  }
}

async function deletePlan(id) {
  if (!confirm('Tem certeza que deseja excluir este plano permanentemente?')) return;
  try {
    const sb = getSupabase();
    if (!sb) { showToast('Banco de dados não conectado'); return; }
    const { error } = await sb.from('plans').delete().eq('id', id);
    if (error) throw error;
    
    if (state.currentPlanId === id) {
      state.currentPlanId = null;
    }
    showToast('Plano excluído', 'success');
    openPlansModal(); // refresh list
  } catch (e) {
    console.error(e);
    showToast('Erro ao excluir');
  }
}

function updateUIWithState() {
  document.getElementById('patientName').value = state.patientName;
  document.getElementById('planMonth').value = state.planMonth;
  document.getElementById('brandName').value = state.brandName;
  renderSections();
  renderPreview();
}
