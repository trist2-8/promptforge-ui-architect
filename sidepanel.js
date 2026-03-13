const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

const state = {
  activeTab: 'write',
  activeRefineAction: 'Clearer',
  profile: null,
  savedPrompts: [],
  promptHistory: [],
  workspaces: [],
  templateQuery: '',
  libraryQuery: '',
  libraryFilter: 'all',
  autosaveTimer: null,
  draftLoaded: false,
  lastFocusedField: null
};

const elements = {
  tabRow: $('#tabRow'),
  modeSelect: $('#modeSelect'),
  languageSelect: $('#languageSelect'),
  workspaceSelect: $('#workspaceSelect'),
  workspaceSelectWrap: $('#workspaceSelectWrap'),
  workspaceSelectMenu: $('#workspaceSelectMenu'),
  workspaceCountBadge: $('#workspaceCountBadge'),
  workspaceNameInput: $('#workspaceNameInput'),
  applyWorkspaceBtn: $('#applyWorkspaceBtn'),
  saveWorkspaceBtn: $('#saveWorkspaceBtn'),
  newWorkspaceBtn: $('#newWorkspaceBtn'),
  deleteWorkspaceBtn: $('#deleteWorkspaceBtn'),
  workspaceSummary: $('#workspaceSummary'),
  promptName: $('#promptName'),
  repoAreaInput: $('#repoAreaInput'),
  roleInput: $('#roleInput'),
  taskInput: $('#taskInput'),
  stackInput: $('#stackInput'),
  expectedInput: $('#expectedInput'),
  actualInput: $('#actualInput'),
  contextInput: $('#contextInput'),
  constraintsInput: $('#constraintsInput'),
  outputInput: $('#outputInput'),
  promptEditor: $('#promptEditor'),
  refineSource: $('#refineSource'),
  refinedOutput: $('#refinedOutput'),
  generateBtn: $('#generateBtn'),
  refineBtn: $('#refineBtn'),
  copyBtn: $('#copyBtn'),
  saveBtn: $('#saveBtn'),
  exportBtn: $('#exportBtn'),
  runRefineBtn: $('#runRefineBtn'),
  applyRefinedBtn: $('#applyRefinedBtn'),
  copyRefinedBtn: $('#copyRefinedBtn'),
  saveRefinedBtn: $('#saveRefinedBtn'),
  openOptionsBtn: $('#openOptionsBtn'),
  historyBtn: $('#historyBtn'),
  quickFieldRow: $('#quickFieldRow'),
  smartActionRow: $('#smartActionRow'),
  snippetRow: $('#snippetRow'),
  resolveVarsBtn: $('#resolveVarsBtn'),
  refineActionRow: $('#refineActionRow'),
  templateSearch: $('#templateSearch'),
  templateList: $('#templateList'),
  librarySearch: $('#librarySearch'),
  libraryFilterRow: $('#libraryFilterRow'),
  workspaceList: $('#workspaceList'),
  libraryList: $('#libraryList'),
  historyList: $('#historyList'),
  overallScore: $('#overallScore'),
  healthHint: $('#healthHint'),
  metricStack: $('#metricStack'),
  checkStack: $('#checkStack'),
  targetModelLabel: $('#targetModelLabel'),
  autosaveBadge: $('#autosaveBadge'),
  diffStats: $('#diffStats'),
  diffView: $('#diffView')
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function setButtonFeedback(button, label, resetLabel) {
  button.textContent = label;
  window.setTimeout(() => {
    button.textContent = resetLabel;
  }, 1200);
}

function setAutosaveBadge(text, tone = 'neutral') {
  elements.autosaveBadge.textContent = text;
  elements.autosaveBadge.className = `inline-badge ${tone}`;
}

function initCustomSelects(root = document) {
  const closeAll = except => {
    $$('.custom-select').forEach(select => {
      if (select !== except) select.classList.remove('open');
    });
  };

  root.querySelectorAll('.custom-select').forEach(select => {
    if (select.dataset.bound === 'true') return;
    select.dataset.bound = 'true';

    const trigger = select.querySelector('.custom-select-trigger');
    const label = select.querySelector('[data-label]');
    const input = document.getElementById(select.dataset.input);
    const options = () => Array.from(select.querySelectorAll('.custom-option'));

    const syncLabel = () => {
      const active = options().find(option => option.dataset.value === input.value);
      label.textContent = active ? active.textContent : (select.dataset.placeholder || 'Select');
      options().forEach(option => {
        option.classList.toggle('active', option.dataset.value === input.value);
      });
    };

    trigger.addEventListener('click', event => {
      event.preventDefault();
      const willOpen = !select.classList.contains('open');
      closeAll(select);
      select.classList.toggle('open', willOpen);
    });

    options().forEach(option => {
      option.addEventListener('click', () => {
        input.value = option.dataset.value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        syncLabel();
        select.classList.remove('open');
      });
    });

    input.addEventListener('change', syncLabel);
    syncLabel();
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.custom-select')) {
      $$('.custom-select').forEach(select => select.classList.remove('open'));
    }
  }, { once: true });
}

function refreshCustomSelect(wrapper) {
  if (!wrapper) return;
  wrapper.dataset.bound = 'false';
  initCustomSelects(wrapper.parentElement || document);
}

function getActiveWorkspace() {
  return window.PromptForgeEngine.getWorkspaceById(state.workspaces, elements.workspaceSelect.value);
}

function collectBuilderInput() {
  return {
    workspaceId: elements.workspaceSelect.value,
    workspaceName: elements.workspaceNameInput.value.trim(),
    productName: elements.promptName.value.trim(),
    repoArea: elements.repoAreaInput.value.trim(),
    mode: elements.modeSelect.value,
    language: elements.languageSelect.value,
    targetModel: state.profile?.targetModel,
    role: elements.roleInput.value.trim(),
    task: elements.taskInput.value.trim(),
    stack: elements.stackInput.value.trim(),
    expectedBehavior: elements.expectedInput.value.trim(),
    actualBehavior: elements.actualInput.value.trim(),
    context: elements.contextInput.value,
    constraints: elements.constraintsInput.value,
    output: elements.outputInput.value
  };
}

function collectDraft() {
  return {
    activeTab: state.activeTab,
    activeRefineAction: state.activeRefineAction,
    builder: collectBuilderInput(),
    promptEditor: elements.promptEditor.value,
    refineSource: elements.refineSource.value,
    refinedOutput: elements.refinedOutput.value
  };
}

function applyBuilderInput(data = {}) {
  elements.workspaceNameInput.value = data.workspaceName || '';
  elements.promptName.value = data.productName || '';
  elements.repoAreaInput.value = data.repoArea || '';
  elements.modeSelect.value = data.mode || state.profile?.defaultMode || 'Code Review';
  elements.languageSelect.value = data.language || state.profile?.defaultLanguage || 'English';
  elements.roleInput.value = data.role || 'Senior software engineer and code reviewer';
  elements.taskInput.value = data.task || 'Explain the root cause clearly, propose the smallest reliable fix, show patched code only where useful, and mention edge cases plus test ideas.';
  elements.stackInput.value = data.stack || state.profile?.preferredStack || '';
  elements.expectedInput.value = data.expectedBehavior || 'Describe the successful flow or expected result.';
  elements.actualInput.value = data.actualBehavior || 'Describe the bug, error, or unexpected output.';
  elements.contextInput.value = data.context || 'Relevant code path\nLogs or traces\nReproduction steps';
  elements.constraintsInput.value = data.constraints || state.profile?.reviewRules?.replace(/\. /g, '\n') || '';
  elements.outputInput.value = data.output || state.profile?.outputPreference?.replace(/, /g, '\n') || 'Root cause\nFix summary\nUpdated code\nTests';
  if (data.workspaceId) {
    elements.workspaceSelect.value = data.workspaceId;
  }
  elements.modeSelect.dispatchEvent(new Event('change'));
  elements.languageSelect.dispatchEvent(new Event('change'));
  elements.workspaceSelect.dispatchEvent(new Event('change'));
}

function renderTabs() {
  elements.tabRow.innerHTML = window.PromptForgeEngine.TABS.map(tab => `
    <button class="tab-btn ${state.activeTab === tab.key ? 'active' : ''}" data-tab="${tab.key}">${tab.label}</button>
  `).join('');

  $$('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      state.activeTab = button.dataset.tab;
      renderTabs();
      renderPanels();
      scheduleAutosave();
    });
  });
}

function renderPanels() {
  $$('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === state.activeTab);
  });
}

function syncMetrics(prompt) {
  const score = window.PromptForgeEngine.scorePrompt(prompt);
  elements.overallScore.textContent = String(score.overall);

  const metricItems = [
    { label: 'Clarity', value: score.clarity },
    { label: 'Specificity', value: score.specificity },
    { label: 'Output Fit', value: score.outputFit }
  ];

  elements.metricStack.innerHTML = metricItems.map(item => `
    <div class="metric-item">
      <div class="metric-top"><span>${item.label}</span><span>${item.value}</span></div>
      <div class="metric-bar"><span style="width:${item.value}%"></span></div>
    </div>
  `).join('');

  elements.checkStack.innerHTML = score.checks.map(item => `
    <div class="check-item ${item.pass ? 'pass' : 'warn'}">
      <span>${item.pass ? '✓' : '!'}</span>
      <div>${item.label}</div>
    </div>
  `).join('');

  elements.healthHint.textContent = score.diagnostics.length
    ? score.diagnostics[0]
    : 'Prompt đã có cấu trúc tốt. Hãy thêm logs hoặc expected vs actual behavior nếu cần đào sâu hơn.';
}

function renderQuickFields() {
  elements.quickFieldRow.innerHTML = window.PromptForgeEngine.QUICK_FIELDS.map(item => `
    <button class="chip-btn" data-field="${item}">+ ${item}</button>
  `).join('');

  $$('.chip-btn[data-field]').forEach(button => {
    button.addEventListener('click', () => {
      elements.promptEditor.value = window.PromptForgeEngine.applyQuickField(elements.promptEditor.value, button.dataset.field);
      elements.refineSource.value = elements.promptEditor.value;
      syncMetrics(elements.promptEditor.value);
      renderDiff();
      scheduleAutosave();
    });
  });
}

function renderSnippetRow() {
  elements.snippetRow.innerHTML = window.PromptForgeEngine.VARIABLE_TOKENS.map(token => `
    <button class="chip-badge" data-token="${token}">${token}</button>
  `).join('');

  $$('.chip-badge[data-token]').forEach(button => {
    button.addEventListener('click', () => {
      insertToken(button.dataset.token);
    });
  });
}

function insertToken(token) {
  const field = state.lastFocusedField && document.body.contains(state.lastFocusedField)
    ? state.lastFocusedField
    : elements.promptEditor;

  const start = typeof field.selectionStart === 'number' ? field.selectionStart : field.value.length;
  const end = typeof field.selectionEnd === 'number' ? field.selectionEnd : field.value.length;
  const before = field.value.slice(0, start);
  const after = field.value.slice(end);
  field.value = `${before}${token}${after}`;
  if (typeof field.setSelectionRange === 'function') {
    const nextPos = start + token.length;
    field.focus();
    field.setSelectionRange(nextPos, nextPos);
  }
  if (field === elements.promptEditor) {
    syncMetrics(field.value);
    elements.refineSource.value = field.value;
    renderDiff();
  }
  scheduleAutosave();
}

function renderSmartActions() {
  elements.smartActionRow.innerHTML = window.PromptForgeEngine.SMART_ACTIONS.map(item => `
    <button class="chip-badge" data-smart-action="${item}">${item}</button>
  `).join('');

  $$('.chip-badge[data-smart-action]').forEach(button => {
    button.addEventListener('click', () => {
      elements.refineSource.value = elements.promptEditor.value;
      elements.refinedOutput.value = window.PromptForgeEngine.applyRefine(elements.promptEditor.value, button.dataset.smartAction, state.profile);
      state.activeRefineAction = button.dataset.smartAction;
      renderRefineActions();
      renderDiff();
      state.activeTab = 'refine';
      renderTabs();
      renderPanels();
      scheduleAutosave();
    });
  });
}

function renderRefineActions() {
  elements.refineActionRow.innerHTML = window.PromptForgeEngine.REFINE_ACTIONS.map(item => `
    <button class="chip-badge ${state.activeRefineAction === item ? 'active' : ''}" data-refine-action="${item}">${item}</button>
  `).join('');

  $$('.chip-badge[data-refine-action]').forEach(button => {
    button.addEventListener('click', () => {
      state.activeRefineAction = button.dataset.refineAction;
      elements.refinedOutput.value = window.PromptForgeEngine.applyRefine(elements.refineSource.value, state.activeRefineAction, state.profile);
      renderRefineActions();
      renderDiff();
      scheduleAutosave();
    });
  });
}

function renderTemplates() {
  const query = state.templateQuery.trim().toLowerCase();
  const list = window.PromptForgeEngine.TEMPLATES.filter(item => {
    return !query || `${item.title} ${item.desc} ${item.tag} ${item.mode}`.toLowerCase().includes(query);
  });

  elements.templateList.innerHTML = list.map(item => `
    <article class="glass-card template-card">
      <div class="template-main">
        <div class="template-title">${item.title}</div>
        <p>${item.desc}</p>
        <span class="template-tag">${item.tag}</span>
      </div>
      <button class="secondary-btn template-use" data-template-id="${item.id}">Use</button>
    </article>
  `).join('');

  $$('.template-use').forEach(button => {
    button.addEventListener('click', () => {
      const template = window.PromptForgeEngine.getTemplateById(button.dataset.templateId);
      elements.promptName.value = template.title;
      elements.modeSelect.value = template.mode;
      elements.modeSelect.dispatchEvent(new Event('change'));
      elements.promptEditor.value = template.prompt;
      elements.refineSource.value = template.prompt;
      syncMetrics(template.prompt);
      renderDiff();
      state.activeTab = 'write';
      renderTabs();
      renderPanels();
      scheduleAutosave();
    });
  });
}

function renderLibraryFilters() {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'workspaces', label: 'Workspaces' },
    { key: 'saved', label: 'Saved' },
    { key: 'history', label: 'History' }
  ];

  elements.libraryFilterRow.innerHTML = filters.map(item => `
    <button class="chip-badge ${state.libraryFilter === item.key ? 'active' : ''}" data-library-filter="${item.key}">${item.label}</button>
  `).join('');

  $$('.chip-badge[data-library-filter]').forEach(button => {
    button.addEventListener('click', () => {
      state.libraryFilter = button.dataset.libraryFilter;
      renderWorkspaces();
      renderLibrary();
      renderHistory();
      renderLibraryFilters();
    });
  });
}

function filterEntries(list, fields) {
  const query = state.libraryQuery.trim().toLowerCase();
  if (!query) return list;
  return list.filter(item => fields.some(field => String(item[field] || '').toLowerCase().includes(query)));
}

function renderWorkspaceSelectOptions() {
  elements.workspaceSelectMenu.innerHTML = state.workspaces.map(item => `
    <button type="button" class="custom-option" data-value="${item.id}">${item.name}</button>
  `).join('');
  elements.workspaceCountBadge.textContent = `${state.workspaces.length} workspace${state.workspaces.length === 1 ? '' : 's'}`;
  refreshCustomSelect(elements.workspaceSelectWrap);
}

function renderWorkspaceSummary() {
  const workspace = getActiveWorkspace();
  if (!workspace) {
    elements.workspaceSummary.textContent = 'No workspace selected.';
    return;
  }
  elements.workspaceSummary.textContent = `${workspace.name} • ${workspace.mode} • ${workspace.stack || 'No stack'} • ${workspace.repoArea || 'No repo area'}`;
}

function renderWorkspaces() {
  renderWorkspaceSelectOptions();
  renderWorkspaceSummary();

  const shouldShow = state.libraryFilter === 'all' || state.libraryFilter === 'workspaces';
  const list = filterEntries(state.workspaces, ['name', 'stack', 'repoArea', 'notes']);
  elements.workspaceList.innerHTML = shouldShow ? list.map(item => `
    <article class="glass-card library-card">
      <div>
        <div class="library-top">
          <div class="template-title">${item.name}</div>
          <span class="template-tag">${item.mode}</span>
        </div>
        <p>${item.notes || item.stack || 'No notes yet.'}</p>
        <p class="muted-copy">${item.repoArea || 'No repo area'} • ${item.language || 'English'}</p>
      </div>
      <div class="library-actions">
        <button class="secondary-btn workspace-load" data-workspace-id="${item.id}">Apply</button>
      </div>
    </article>
  `).join('') : '';

  $$('.workspace-load').forEach(button => {
    button.addEventListener('click', () => {
      const workspace = window.PromptForgeEngine.getWorkspaceById(state.workspaces, button.dataset.workspaceId);
      if (!workspace) return;
      applyWorkspace(workspace);
      state.activeTab = 'write';
      renderTabs();
      renderPanels();
    });
  });
}

function renderLibrary() {
  const shouldShow = state.libraryFilter === 'all' || state.libraryFilter === 'saved';
  const list = filterEntries(state.savedPrompts, ['name', 'preview', 'tag']);
  elements.libraryList.innerHTML = shouldShow ? list.map(item => `
    <article class="glass-card library-card">
      <div>
        <div class="library-top">
          <div class="template-title">${item.name}</div>
          <span class="template-tag">${item.tag}</span>
        </div>
        <p>${escapeHtml(item.preview)}</p>
        <p class="muted-copy">${window.PromptForgeEngine.formatRelativeTime(item.updatedAt || new Date().toISOString())}</p>
      </div>
      <div class="library-actions">
        <button class="secondary-btn load-saved" data-saved-id="${item.id}">Load</button>
      </div>
    </article>
  `).join('') : '';

  $$('.load-saved').forEach(button => {
    button.addEventListener('click', () => {
      const item = state.savedPrompts.find(entry => entry.id === button.dataset.savedId);
      if (!item) return;
      elements.promptName.value = item.name;
      elements.promptEditor.value = item.prompt;
      elements.refineSource.value = item.prompt;
      syncMetrics(item.prompt);
      renderDiff();
      state.activeTab = 'write';
      renderTabs();
      renderPanels();
      scheduleAutosave();
    });
  });
}

function renderHistory() {
  const shouldShow = state.libraryFilter === 'all' || state.libraryFilter === 'history';
  const list = filterEntries(state.promptHistory, ['name', 'preview', 'action', 'tag']);
  elements.historyList.innerHTML = shouldShow ? list.map(item => `
    <article class="glass-card library-card">
      <div>
        <div class="library-top">
          <div class="template-title">${item.name}</div>
          <span class="template-tag">${item.action}</span>
        </div>
        <p>${escapeHtml(item.preview)}</p>
      </div>
      <div class="library-actions">
        <span class="time-label">${window.PromptForgeEngine.formatRelativeTime(item.createdAt || new Date().toISOString())}</span>
        <button class="secondary-btn load-history" data-history-id="${item.id}">Load</button>
      </div>
    </article>
  `).join('') : '';

  $$('.load-history').forEach(button => {
    button.addEventListener('click', () => {
      const item = state.promptHistory.find(entry => entry.id === button.dataset.historyId);
      if (!item) return;
      elements.promptName.value = item.name;
      elements.promptEditor.value = item.prompt;
      elements.refineSource.value = item.prompt;
      syncMetrics(item.prompt);
      renderDiff();
      state.activeTab = 'write';
      renderTabs();
      renderPanels();
      scheduleAutosave();
    });
  });
}

function buildLineDiff(oldText, newText) {
  const a = String(oldText || '').split('\n');
  const b = String(newText || '').split('\n');
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const rows = [];
  let i = 0;
  let j = 0;
  let added = 0;
  let removed = 0;

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      rows.push({ type: 'same', text: a[i] });
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'removed', text: a[i] });
      removed += 1;
      i += 1;
    } else {
      rows.push({ type: 'added', text: b[j] });
      added += 1;
      j += 1;
    }
  }

  while (i < a.length) {
    rows.push({ type: 'removed', text: a[i] });
    removed += 1;
    i += 1;
  }
  while (j < b.length) {
    rows.push({ type: 'added', text: b[j] });
    added += 1;
    j += 1;
  }

  return { rows, added, removed };
}

function renderDiff() {
  const diff = buildLineDiff(elements.refineSource.value, elements.refinedOutput.value);
  elements.diffStats.textContent = `${diff.added} added • ${diff.removed} removed`;
  elements.diffView.innerHTML = diff.rows.length ? diff.rows.map(row => `
    <div class="diff-line ${row.type}">
      <span class="diff-mark">${row.type === 'added' ? '+' : row.type === 'removed' ? '-' : '·'}</span>
      <code>${escapeHtml(row.text) || '&nbsp;'}</code>
    </div>
  `).join('') : '<div class="muted-copy">Diff will appear after you refine the prompt.</div>';
}

async function generatePrompt() {
  const workspace = getActiveWorkspace();
  const prompt = window.PromptForgeEngine.buildDeveloperPrompt(collectBuilderInput(), state.profile, workspace);
  elements.promptEditor.value = prompt;
  elements.refineSource.value = prompt;
  await window.PromptForgeEngine.saveRecentPrompt(prompt);
  state.promptHistory = await window.PromptForgeEngine.saveHistoryEntry({
    action: 'generated',
    name: elements.promptName.value.trim() || elements.modeSelect.value,
    tag: elements.modeSelect.value.toLowerCase().replace(/\s+/g, '-'),
    prompt,
    workspaceId: workspace?.id || ''
  });
  renderHistory();
  syncMetrics(prompt);
  renderDiff();
  await persistDraftNow();
}

async function copyPrompt() {
  const value = elements.promptEditor.value.trim();
  if (!value) return;
  await navigator.clipboard.writeText(value);
  setButtonFeedback(elements.copyBtn, '✓ Copied', '⧉ Copy');
  state.promptHistory = await window.PromptForgeEngine.saveHistoryEntry({
    action: 'copied',
    name: elements.promptName.value.trim() || elements.modeSelect.value,
    tag: elements.modeSelect.value.toLowerCase().replace(/\s+/g, '-'),
    prompt: value,
    workspaceId: elements.workspaceSelect.value
  });
  renderHistory();
}

async function saveCurrentPrompt(promptOverride) {
  const prompt = String(promptOverride || elements.promptEditor.value).trim();
  if (!prompt) return;
  const entryName = elements.promptName.value.trim() || elements.modeSelect.value;
  state.savedPrompts = await window.PromptForgeEngine.savePromptEntry({
    name: entryName,
    prompt,
    tag: elements.modeSelect.value.toLowerCase().replace(/\s+/g, '-'),
    workspaceId: elements.workspaceSelect.value,
    mode: elements.modeSelect.value
  });
  state.promptHistory = await window.PromptForgeEngine.saveHistoryEntry({
    action: 'saved',
    name: entryName,
    tag: elements.modeSelect.value.toLowerCase().replace(/\s+/g, '-'),
    prompt,
    workspaceId: elements.workspaceSelect.value
  });
  renderLibrary();
  renderHistory();
  setButtonFeedback(elements.saveBtn, '✓ Saved', '⌁ Save');
}

function exportPrompt() {
  const value = elements.promptEditor.value.trim();
  if (!value) return;
  const blob = new Blob([value], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const name = elements.promptName.value.trim() || `${elements.modeSelect.value}-prompt`;
  link.href = url;
  link.download = `${window.PromptForgeEngine.slugify(name)}.md`;
  link.click();
  URL.revokeObjectURL(url);
  setButtonFeedback(elements.exportBtn, '✓ Exported', '⇩ Export');
}

function runRefine() {
  elements.refinedOutput.value = window.PromptForgeEngine.applyRefine(elements.refineSource.value, state.activeRefineAction, state.profile);
  renderDiff();
  scheduleAutosave();
}

async function applyRefinedToEditor() {
  const value = elements.refinedOutput.value.trim();
  if (!value) return;
  elements.promptEditor.value = value;
  elements.refineSource.value = value;
  syncMetrics(value);
  renderDiff();
  state.promptHistory = await window.PromptForgeEngine.saveHistoryEntry({
    action: 'refined',
    name: elements.promptName.value.trim() || `${elements.modeSelect.value} refined`,
    tag: elements.modeSelect.value.toLowerCase().replace(/\s+/g, '-'),
    prompt: value,
    workspaceId: elements.workspaceSelect.value
  });
  renderHistory();
  state.activeTab = 'write';
  renderTabs();
  renderPanels();
  await persistDraftNow();
}

async function copyRefinedPrompt() {
  const value = elements.refinedOutput.value.trim();
  if (!value) return;
  await navigator.clipboard.writeText(value);
  setButtonFeedback(elements.copyRefinedBtn, '✓ Copied', '⧉ Copy refined');
}

async function saveRefinedPrompt() {
  const value = elements.refinedOutput.value.trim();
  if (!value) return;
  await saveCurrentPrompt(value);
  setButtonFeedback(elements.saveRefinedBtn, '✓ Saved', '⌁ Save refined');
}

function resolveVariablesInEditor() {
  const workspace = getActiveWorkspace();
  const variables = window.PromptForgeEngine.buildVariableMap(collectBuilderInput(), state.profile, workspace);
  elements.promptEditor.value = window.PromptForgeEngine.resolveVariables(elements.promptEditor.value, variables);
  elements.refineSource.value = elements.promptEditor.value;
  syncMetrics(elements.promptEditor.value);
  renderDiff();
  setButtonFeedback(elements.resolveVarsBtn, '✓ Resolved', '{} Resolve variables in editor');
  scheduleAutosave();
}

async function persistDraftNow() {
  const draft = await window.PromptForgeEngine.saveDraft(collectDraft());
  setAutosaveBadge(`Autosaved ${window.PromptForgeEngine.formatRelativeTime(draft.updatedAt)}`, 'good');
}

function scheduleAutosave() {
  if (!state.profile || state.profile.autosaveEnabled !== 'Enabled') return;
  const delay = Math.max(300, Number(state.profile.autosaveDelay || 900));
  setAutosaveBadge('Saving draft...', 'neutral');
  clearTimeout(state.autosaveTimer);
  state.autosaveTimer = window.setTimeout(() => {
    persistDraftNow().catch(error => {
      console.error('Autosave failed', error);
      setAutosaveBadge('Autosave failed', 'warn');
    });
  }, delay);
}

function workspaceFromBuilder(existingId = '') {
  return {
    id: existingId,
    name: elements.workspaceNameInput.value.trim() || elements.promptName.value.trim() || 'Untitled workspace',
    mode: elements.modeSelect.value,
    language: elements.languageSelect.value,
    repoArea: elements.repoAreaInput.value.trim(),
    role: elements.roleInput.value.trim(),
    stack: elements.stackInput.value.trim(),
    task: elements.taskInput.value.trim(),
    constraints: elements.constraintsInput.value.trim(),
    output: elements.outputInput.value.trim(),
    notes: `Preset based on ${elements.promptName.value.trim() || elements.modeSelect.value}`
  };
}

function applyWorkspace(workspace) {
  if (!workspace) return;
  elements.workspaceSelect.value = workspace.id;
  elements.workspaceNameInput.value = workspace.name || '';
  elements.modeSelect.value = workspace.mode || state.profile?.defaultMode || 'Code Review';
  elements.languageSelect.value = workspace.language || state.profile?.defaultLanguage || 'English';
  elements.repoAreaInput.value = workspace.repoArea || '';
  elements.roleInput.value = workspace.role || elements.roleInput.value;
  elements.stackInput.value = workspace.stack || elements.stackInput.value;
  elements.taskInput.value = workspace.task || elements.taskInput.value;
  elements.constraintsInput.value = workspace.constraints || elements.constraintsInput.value;
  elements.outputInput.value = workspace.output || elements.outputInput.value;
  elements.workspaceSelect.dispatchEvent(new Event('change'));
  elements.modeSelect.dispatchEvent(new Event('change'));
  elements.languageSelect.dispatchEvent(new Event('change'));
  renderWorkspaceSummary();
  scheduleAutosave();
}

async function saveWorkspace() {
  const currentId = elements.workspaceSelect.value;
  const entry = workspaceFromBuilder(currentId);
  state.workspaces = await window.PromptForgeEngine.saveWorkspaceEntry(entry);
  const saved = state.workspaces.find(item => item.name === entry.name) || state.workspaces[0];
  if (saved) {
    elements.workspaceSelect.value = saved.id;
    elements.workspaceNameInput.value = saved.name;
  }
  renderWorkspaces();
  setButtonFeedback(elements.saveWorkspaceBtn, '✓ Saved workspace', '⌁ Save current as workspace');
  scheduleAutosave();
}

function newWorkspace() {
  elements.workspaceSelect.value = '';
  elements.workspaceNameInput.value = '';
  renderWorkspaceSummary();
  setButtonFeedback(elements.newWorkspaceBtn, '✓ New workspace', '＋ New workspace');
  scheduleAutosave();
}

async function deleteWorkspace() {
  const workspaceId = elements.workspaceSelect.value;
  if (!workspaceId) return;
  state.workspaces = await window.PromptForgeEngine.deleteWorkspace(workspaceId);
  elements.workspaceSelect.value = '';
  elements.workspaceNameInput.value = '';
  renderWorkspaces();
  scheduleAutosave();
}

async function loadProfileAndSeed() {
  state.profile = await window.PromptForgeEngine.getProfile();
  state.savedPrompts = await window.PromptForgeEngine.getSavedPrompts();
  state.promptHistory = await window.PromptForgeEngine.getPromptHistory();
  state.workspaces = await window.PromptForgeEngine.getWorkspaces();
  const draft = await window.PromptForgeEngine.getDraft();
  const recent = await window.PromptForgeEngine.getRecentPrompt();

  elements.targetModelLabel.textContent = state.profile.targetModel || 'ChatGPT / Claude';
  renderWorkspaces();

  if (draft) {
    applyBuilderInput(draft.builder || {});
    elements.promptEditor.value = draft.promptEditor || recent || '';
    elements.refineSource.value = draft.refineSource || elements.promptEditor.value;
    elements.refinedOutput.value = draft.refinedOutput || '';
    state.activeTab = draft.activeTab || 'write';
    state.activeRefineAction = draft.activeRefineAction || 'Clearer';
    state.draftLoaded = true;
    setAutosaveBadge(`Restored ${window.PromptForgeEngine.formatRelativeTime(draft.updatedAt)}`, 'good');
  } else {
    applyBuilderInput();
    elements.promptEditor.value = recent || window.PromptForgeEngine.getTemplateById('code-review').prompt;
    elements.refineSource.value = elements.promptEditor.value;
    elements.refinedOutput.value = window.PromptForgeEngine.applyRefine(elements.refineSource.value, state.activeRefineAction, state.profile);
    setAutosaveBadge('Draft idle', 'neutral');
  }

  syncMetrics(elements.promptEditor.value);
  renderDiff();
}

function bindFocusTracking() {
  $$('input, textarea').forEach(field => {
    field.addEventListener('focus', () => {
      state.lastFocusedField = field;
    });
  });
}

function bindEvents() {
  elements.generateBtn.addEventListener('click', generatePrompt);
  elements.copyBtn.addEventListener('click', copyPrompt);
  elements.saveBtn.addEventListener('click', () => saveCurrentPrompt());
  elements.exportBtn.addEventListener('click', exportPrompt);
  elements.resolveVarsBtn.addEventListener('click', resolveVariablesInEditor);
  elements.refineBtn.addEventListener('click', () => {
    elements.refineSource.value = elements.promptEditor.value;
    runRefine();
    state.activeTab = 'refine';
    renderTabs();
    renderPanels();
  });
  elements.runRefineBtn.addEventListener('click', runRefine);
  elements.applyRefinedBtn.addEventListener('click', applyRefinedToEditor);
  elements.copyRefinedBtn.addEventListener('click', copyRefinedPrompt);
  elements.saveRefinedBtn.addEventListener('click', saveRefinedPrompt);
  elements.openOptionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
  elements.historyBtn.addEventListener('click', () => {
    state.activeTab = 'library';
    renderTabs();
    renderPanels();
  });
  elements.applyWorkspaceBtn.addEventListener('click', () => applyWorkspace(getActiveWorkspace()));
  elements.saveWorkspaceBtn.addEventListener('click', saveWorkspace);
  elements.newWorkspaceBtn.addEventListener('click', newWorkspace);
  elements.deleteWorkspaceBtn.addEventListener('click', deleteWorkspace);

  elements.templateSearch.addEventListener('input', event => {
    state.templateQuery = event.target.value;
    renderTemplates();
  });

  elements.librarySearch.addEventListener('input', event => {
    state.libraryQuery = event.target.value;
    renderWorkspaces();
    renderLibrary();
    renderHistory();
  });

  const draftFields = [
    elements.modeSelect,
    elements.languageSelect,
    elements.workspaceSelect,
    elements.workspaceNameInput,
    elements.promptName,
    elements.repoAreaInput,
    elements.roleInput,
    elements.taskInput,
    elements.stackInput,
    elements.expectedInput,
    elements.actualInput,
    elements.contextInput,
    elements.constraintsInput,
    elements.outputInput,
    elements.promptEditor,
    elements.refineSource,
    elements.refinedOutput
  ];

  draftFields.forEach(field => {
    field.addEventListener('input', () => {
      if (field === elements.promptEditor) {
        syncMetrics(elements.promptEditor.value);
        elements.refineSource.value = elements.promptEditor.value;
        renderDiff();
      }
      if (field === elements.refineSource || field === elements.refinedOutput) {
        renderDiff();
      }
      scheduleAutosave();
    });
  });

  elements.modeSelect.addEventListener('change', () => {
    const templateMap = {
      'Code Review': 'code-review',
      'Bug Investigation': 'bug-investigation',
      'Refactor Planner': 'refactor-planner',
      'API Design': 'api-design',
      'Test Generation': 'test-generation',
      'Architecture Breakdown': 'architecture-breakdown'
    };
    const template = window.PromptForgeEngine.getTemplateById(templateMap[elements.modeSelect.value] || 'code-review');
    if (!elements.promptEditor.value.trim() || confirm('Load the default template for this mode into the editor?')) {
      elements.promptEditor.value = template.prompt;
      elements.refineSource.value = template.prompt;
      syncMetrics(template.prompt);
      renderDiff();
      scheduleAutosave();
    }
  });

  elements.workspaceSelect.addEventListener('change', renderWorkspaceSummary);
}

(async function init() {
  renderTabs();
  renderPanels();
  renderQuickFields();
  renderSnippetRow();
  renderSmartActions();
  initCustomSelects();
  await loadProfileAndSeed();
  renderRefineActions();
  renderTemplates();
  renderLibraryFilters();
  renderLibrary();
  renderHistory();
  bindEvents();
  bindFocusTracking();
})();
