const $ = selector => document.querySelector(selector);
const $$ = selector => Array.from(document.querySelectorAll(selector));

const state = {
  activeTab: 'write',
  activeRefineAction: 'Clearer',
  profile: null,
  savedPrompts: [],
  templateQuery: ''
};

const elements = {
  tabRow: $('#tabRow'),
  modeSelect: $('#modeSelect'),
  languageSelect: $('#languageSelect'),
  promptName: $('#promptName'),
  roleInput: $('#roleInput'),
  taskInput: $('#taskInput'),
  stackInput: $('#stackInput'),
  contextInput: $('#contextInput'),
  constraintsInput: $('#constraintsInput'),
  promptEditor: $('#promptEditor'),
  refineSource: $('#refineSource'),
  refinedOutput: $('#refinedOutput'),
  generateBtn: $('#generateBtn'),
  refineBtn: $('#refineBtn'),
  copyBtn: $('#copyBtn'),
  saveBtn: $('#saveBtn'),
  openOptionsBtn: $('#openOptionsBtn'),
  historyBtn: $('#historyBtn'),
  quickFieldRow: $('#quickFieldRow'),
  smartActionRow: $('#smartActionRow'),
  refineActionRow: $('#refineActionRow'),
  templateSearch: $('#templateSearch'),
  templateList: $('#templateList'),
  libraryList: $('#libraryList'),
  overallScore: $('#overallScore'),
  healthHint: $('#healthHint'),
  metricStack: $('#metricStack'),
  targetModelLabel: $('#targetModelLabel')
};

function renderTabs() {
  elements.tabRow.innerHTML = window.PromptForgeEngine.TABS.map(tab => `
    <button class="tab-btn ${state.activeTab === tab.key ? 'active' : ''}" data-tab="${tab.key}">${tab.label}</button>
  `).join('');

  $$('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      state.activeTab = button.dataset.tab;
      renderTabs();
      renderPanels();
    });
  });
}

function renderPanels() {
  $$('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === state.activeTab);
  });
}

function collectBuilderInput() {
  return {
    productName: elements.promptName.value.trim(),
    mode: elements.modeSelect.value,
    language: elements.languageSelect.value,
    targetModel: state.profile?.targetModel,
    role: elements.roleInput.value.trim(),
    task: elements.taskInput.value.trim(),
    stack: elements.stackInput.value.trim(),
    context: elements.contextInput.value,
    constraints: elements.constraintsInput.value,
    output: state.profile?.outputPreference || 'Root cause, Fix summary, Updated code, Tests'
  };
}

function syncMetrics(prompt) {
  const score = window.PromptForgeEngine.scorePrompt(prompt);
  elements.overallScore.textContent = String(score.overall);
  const hint = [];
  if (score.clarity < 85) hint.push('thêm role và task rõ hơn');
  if (score.specificity < 85) hint.push('bổ sung context, stack và constraints');
  if (score.outputFit < 85) hint.push('siết output format và acceptance criteria');
  elements.healthHint.textContent = hint.length
    ? `Có thể tốt hơn nếu bạn ${hint.join(', ')}.`
    : 'Prompt đã có cấu trúc tốt. Hãy thêm log hoặc expected vs actual behavior nếu cần đào sâu.';

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
    });
  });
}

function renderSmartActions() {
  elements.smartActionRow.innerHTML = window.PromptForgeEngine.SMART_ACTIONS.map(item => `
    <button class="chip-badge" data-smart-action="${item}">${item}</button>
  `).join('');

  $$('.chip-badge[data-smart-action]').forEach(button => {
    button.addEventListener('click', () => {
      const refined = window.PromptForgeEngine.applyRefine(elements.promptEditor.value, button.dataset.smartAction, state.profile);
      elements.refineSource.value = elements.promptEditor.value;
      elements.refinedOutput.value = refined;
      state.activeTab = 'refine';
      renderTabs();
      renderPanels();
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
    });
  });
}

function renderTemplates() {
  const query = state.templateQuery.trim().toLowerCase();
  const list = window.PromptForgeEngine.TEMPLATES.filter(item => {
    return !query || `${item.title} ${item.desc} ${item.tag}`.toLowerCase().includes(query);
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
      elements.promptEditor.value = template.prompt;
      elements.refineSource.value = template.prompt;
      state.activeTab = 'write';
      renderTabs();
      renderPanels();
      syncMetrics(template.prompt);
    });
  });
}

function renderLibrary() {
  if (!state.savedPrompts.length) {
    elements.libraryList.innerHTML = '<div class="glass-card"><p class="muted-copy">Chưa có prompt nào được lưu.</p></div>';
    return;
  }

  elements.libraryList.innerHTML = state.savedPrompts.map(item => `
    <article class="glass-card library-card">
      <div>
        <div class="library-top">
          <div class="template-title">${item.name}</div>
          <span class="template-tag">${item.tag}</span>
        </div>
        <p>${item.preview}</p>
      </div>
      <div class="library-actions">
        <span class="time-label">${item.updated}</span>
        <button class="secondary-btn load-saved" data-saved-id="${item.id}">Load</button>
      </div>
    </article>
  `).join('');

  $$('.load-saved').forEach(button => {
    button.addEventListener('click', () => {
      const item = state.savedPrompts.find(entry => entry.id === button.dataset.savedId);
      if (!item) return;
      elements.promptName.value = item.name;
      elements.promptEditor.value = item.prompt;
      elements.refineSource.value = item.prompt;
      state.activeTab = 'write';
      renderTabs();
      renderPanels();
      syncMetrics(item.prompt);
    });
  });
}

async function generatePrompt() {
  const prompt = window.PromptForgeEngine.buildDeveloperPrompt(collectBuilderInput(), state.profile);
  elements.promptEditor.value = prompt;
  elements.refineSource.value = prompt;
  await window.PromptForgeEngine.saveRecentPrompt(prompt);
  syncMetrics(prompt);
}

async function copyPrompt() {
  const value = elements.promptEditor.value.trim();
  if (!value) return;
  await navigator.clipboard.writeText(value);
  elements.copyBtn.textContent = '✓ Copied';
  setTimeout(() => {
    elements.copyBtn.textContent = '⧉ Copy';
  }, 1200);
}

async function saveCurrentPrompt() {
  const prompt = elements.promptEditor.value.trim();
  if (!prompt) return;
  state.savedPrompts = await window.PromptForgeEngine.savePromptEntry({
    name: elements.promptName.value.trim() || elements.modeSelect.value,
    prompt,
    tag: elements.modeSelect.value.toLowerCase().replace(/\s+/g, '-')
  });
  renderLibrary();
  elements.saveBtn.textContent = '✓ Saved';
  setTimeout(() => {
    elements.saveBtn.textContent = '⌁ Save';
  }, 1200);
}

async function loadProfileAndSeed() {
  state.profile = await window.PromptForgeEngine.getProfile();
  state.savedPrompts = await window.PromptForgeEngine.getSavedPrompts();
  const recent = await window.PromptForgeEngine.getRecentPrompt();
  elements.roleInput.value = 'Senior software engineer and code reviewer';
  elements.taskInput.value = 'Explain the root cause clearly, propose the smallest reliable fix, show patched code only where useful, and mention edge cases plus test ideas.';
  elements.stackInput.value = state.profile.preferredStack;
  elements.contextInput.value = 'Expected behavior\nActual behavior\nRelevant logs or code path';
  elements.constraintsInput.value = state.profile.reviewRules.replace(/\. /g, '\n');
  elements.languageSelect.value = state.profile.defaultLanguage || 'English';
  elements.modeSelect.value = state.profile.defaultMode || 'Code Review';
  elements.targetModelLabel.textContent = state.profile.targetModel || 'ChatGPT / Claude';
  elements.promptEditor.value = recent || `Act as a senior software engineer and code reviewer.\n\nI will give you a React component and a bug description.\n\nYour task:\n1. Explain the root cause clearly\n2. Propose the smallest reliable fix\n3. Show the patched code\n4. Mention edge cases and test ideas\n\nConstraints:\n- Keep the explanation practical\n- Avoid unnecessary rewrites\n- Preserve current coding style\n\nOutput format:\n- Root cause\n- Fix summary\n- Updated code\n- Tests`;
  elements.refineSource.value = elements.promptEditor.value;
  syncMetrics(elements.promptEditor.value);
}

function bindEvents() {
  elements.generateBtn.addEventListener('click', generatePrompt);
  elements.copyBtn.addEventListener('click', copyPrompt);
  elements.saveBtn.addEventListener('click', saveCurrentPrompt);
  elements.refineBtn.addEventListener('click', () => {
    elements.refinedOutput.value = window.PromptForgeEngine.applyRefine(elements.promptEditor.value, state.activeRefineAction, state.profile);
    elements.refineSource.value = elements.promptEditor.value;
    state.activeTab = 'refine';
    renderTabs();
    renderPanels();
  });
  elements.openOptionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
  elements.historyBtn.addEventListener('click', () => {
    state.activeTab = 'library';
    renderTabs();
    renderPanels();
  });
  elements.templateSearch.addEventListener('input', event => {
    state.templateQuery = event.target.value;
    renderTemplates();
  });
  elements.promptEditor.addEventListener('input', event => {
    syncMetrics(event.target.value);
    elements.refineSource.value = event.target.value;
  });
  elements.refineSource.addEventListener('input', event => {
    elements.refinedOutput.value = window.PromptForgeEngine.applyRefine(event.target.value, state.activeRefineAction, state.profile);
  });
  elements.modeSelect.addEventListener('change', () => {
    const templateMap = {
      'Code Review': 'code-review',
      'Bug Investigation': 'bug-investigation',
      'Refactor Planner': 'refactor-planner',
      'API Design': 'api-design'
    };
    const template = window.PromptForgeEngine.getTemplateById(templateMap[elements.modeSelect.value] || 'code-review');
    elements.promptEditor.value = template.prompt;
    elements.refineSource.value = template.prompt;
    syncMetrics(template.prompt);
  });
}

(async function init() {
  renderTabs();
  renderPanels();
  renderQuickFields();
  renderSmartActions();
  renderRefineActions();
  bindEvents();
  await loadProfileAndSeed();
  renderTemplates();
  renderLibrary();
  elements.refinedOutput.value = window.PromptForgeEngine.applyRefine(elements.refineSource.value, state.activeRefineAction, state.profile);
})();
