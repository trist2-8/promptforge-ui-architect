const STORAGE_KEYS = {
  profile: 'pfd_profile',
  recentPrompt: 'pfd_recent_prompt',
  savedPrompts: 'pfd_saved_prompts',
  promptHistory: 'pfd_prompt_history',
  draft: 'pfd_draft',
  workspaces: 'pfd_workspaces'
};

const DEFAULT_PROFILE = {
  ownerName: 'koiq Studio',
  brandTone: 'Dark, technical, focused, confident',
  defaultLanguage: 'English',
  defaultMode: 'Code Review',
  targetModel: 'ChatGPT / Claude',
  preferredStack: 'React, Next.js, TypeScript, Node.js, PostgreSQL',
  reviewRules: 'Explain root cause first. Prefer smallest reliable fix. Preserve coding style. Mention edge cases and test ideas.',
  outputPreference: 'Root cause, Fix summary, Updated code, Tests',
  signatureInstructions: 'Be practical, senior-level, low fluff, implementation-aware, and explicit about trade-offs.',
  autosaveEnabled: 'Enabled',
  autosaveDelay: '900'
};

const TABS = [
  { key: 'write', label: 'Write' },
  { key: 'templates', label: 'Templates' },
  { key: 'library', label: 'Library' },
  { key: 'refine', label: 'Refine' }
];

const QUICK_FIELDS = ['Role', 'Task', 'Stack', 'Context', 'Constraints', 'Output', 'Tests'];
const SMART_ACTIONS = ['Optimize', 'Shorten', 'Debug Tone', 'Add Examples', 'Safer', 'More Specific'];
const REFINE_ACTIONS = ['Clearer', 'Shorter', 'More Technical', 'Add Test Cases', 'Better for Claude', 'Safer Output'];
const VARIABLE_TOKENS = [
  '{{role}}',
  '{{task}}',
  '{{stack}}',
  '{{expected_behavior}}',
  '{{actual_behavior}}',
  '{{context}}',
  '{{constraints}}',
  '{{output}}',
  '{{workspace_name}}',
  '{{repo_area}}',
  '{{target_model}}'
];

const DEFAULT_WORKSPACES = [
  {
    id: 'workspace_frontend_next',
    name: 'Next.js Frontend',
    mode: 'Code Review',
    language: 'English',
    repoArea: 'apps/web',
    role: 'Senior frontend engineer and reviewer',
    stack: 'Next.js, React, TypeScript, Tailwind CSS',
    task: 'Review the implementation, diagnose issues, and recommend the smallest reliable fix with practical trade-offs.',
    constraints: 'Preserve component API\nAvoid unnecessary rewrites\nKeep accessibility intact\nMention visual regression risks',
    output: 'Summary\nRoot cause\nFix summary\nUpdated code\nTests',
    notes: 'Best for UI bugs, SSR issues, routing, auth UI, and component review.'
  },
  {
    id: 'workspace_backend_api',
    name: 'Backend API',
    mode: 'API Design',
    language: 'English',
    repoArea: 'services/api',
    role: 'Product-minded backend architect',
    stack: 'Node.js, Express, PostgreSQL, Redis',
    task: 'Design or debug API behavior with strong validation, observability, and safe rollout thinking.',
    constraints: 'Prefer backward-compatible changes\nMention auth and validation\nCover failure cases and logging',
    output: 'Scope summary\nEndpoints\nValidation\nErrors\nRisks\nRollout notes',
    notes: 'Good default for services, migrations, queue flows, and endpoint design.'
  }
];

const TEMPLATES = [
  {
    id: 'code-review',
    title: 'Code Review Prompt',
    desc: 'Review code for readability, bugs, performance, architecture, and maintainability.',
    tag: 'review',
    mode: 'Code Review',
    prompt: `Act as a senior software engineer and code reviewer.\n\nI will give you code and supporting context.\n\nYour task:\n1. Explain the main issue or improvement opportunities\n2. Prioritize bugs, readability, performance, and architecture concerns\n3. Suggest the smallest practical fix first\n4. Show improved code only where useful\n5. Mention risks, edge cases, and tests\n\nConstraints:\n- Keep advice practical\n- Avoid unnecessary rewrites\n- Preserve existing style where possible\n\nOutput format:\n- Summary\n- Issues found\n- Recommended fix\n- Updated code\n- Test ideas`
  },
  {
    id: 'bug-investigation',
    title: 'Bug Investigation',
    desc: 'Explain root cause, reproduce steps, signals, and propose a minimal reliable fix.',
    tag: 'debug',
    mode: 'Bug Investigation',
    prompt: `Act as a senior debugging engineer.\n\nI will provide bug symptoms, logs, code, and environment details.\n\nYour task:\n1. Infer the most likely root cause\n2. List reproduction steps\n3. Identify weak assumptions in the code path\n4. Propose the smallest safe fix\n5. Suggest validations and tests after the patch\n\nOutput format:\n- Root cause hypothesis\n- Evidence\n- Fix\n- Risks\n- Validation plan`
  },
  {
    id: 'refactor-planner',
    title: 'Refactor Planner',
    desc: 'Break a refactor into safe phases with risks, migration steps, and test strategy.',
    tag: 'refactor',
    mode: 'Refactor Planner',
    prompt: `Act as a senior software architect.\n\nI need a refactor plan for an existing codebase.\n\nYour task:\n1. Assess the current structure\n2. Break the refactor into safe phases\n3. Define risks and rollback options\n4. Suggest test strategy and acceptance criteria\n5. Explain what should not be changed in early phases\n\nOutput format:\n- Current pain points\n- Refactor phases\n- Risk matrix\n- Tests\n- Rollout plan`
  },
  {
    id: 'api-design',
    title: 'API Design Prompt',
    desc: 'Design endpoints, schema validation, auth, rate limits, and error handling.',
    tag: 'api',
    mode: 'API Design',
    prompt: `Act as a product-minded backend architect.\n\nDesign an API for the described feature.\n\nYour task:\n1. Define endpoints and payloads\n2. Recommend validation and auth rules\n3. Cover failure cases and error responses\n4. Mention observability and rate limiting\n5. Suggest database implications\n\nOutput format:\n- Endpoints\n- Request and response schema\n- Validation\n- Errors\n- Security\n- Notes for frontend integration`
  },
  {
    id: 'test-generation',
    title: 'Test Generation',
    desc: 'Generate unit, integration, and edge-case tests from a bug report or component.',
    tag: 'tests',
    mode: 'Test Generation',
    prompt: `Act as a senior QA-minded developer.\n\nI will give you code, expected behavior, and failure conditions.\n\nYour task:\n1. Identify critical branches and edge cases\n2. Propose a compact but high-value test plan\n3. Generate practical tests in the requested framework\n4. Mention missing mocks, fixtures, or setup needs\n\nOutput format:\n- Coverage strategy\n- Test cases\n- Sample test code\n- Gaps or risks`
  },
  {
    id: 'architecture-breakdown',
    title: 'Architecture Breakdown',
    desc: 'Turn a feature request into modules, responsibilities, risks, and implementation phases.',
    tag: 'architecture',
    mode: 'Architecture Breakdown',
    prompt: `Act as a senior full-stack architect.\n\nBreak down the requested feature into an implementation-ready technical plan.\n\nYour task:\n1. Identify modules and responsibilities\n2. Explain data flow and integration points\n3. Call out technical risks and unknowns\n4. Suggest implementation phases and handoff notes\n\nOutput format:\n- Scope summary\n- Architecture\n- Dependencies\n- Risks\n- Phased plan`
  }
];

function normalizeList(value) {
  return String(value || '')
    .split(/\n|,/) 
    .map(item => item.trim())
    .filter(Boolean);
}

function slugify(value) {
  return String(value || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

function buildSection(title, lines) {
  if (!lines.length) return '';
  return `${title}:\n${lines.map(line => `- ${line}`).join('\n')}`;
}

function getTemplateById(id) {
  return TEMPLATES.find(item => item.id === id) || TEMPLATES[0];
}

function getWorkspaceById(list, id) {
  return list.find(item => item.id === id) || null;
}

function scorePrompt(prompt) {
  const text = String(prompt || '').trim();
  const checks = [
    { key: 'role', label: 'Role', pass: /act as|you are|behave as/i.test(text), hint: 'Add a clear role so the model knows its expertise level.' },
    { key: 'task', label: 'Task', pass: /task|objective|your task|goal/i.test(text), hint: 'Describe the main task explicitly.' },
    { key: 'stack', label: 'Stack', pass: /react|next|node|typescript|python|postgres|framework|runtime|stack/i.test(text), hint: 'Mention framework, runtime, or stack details.' },
    { key: 'context', label: 'Context', pass: /context|expected|actual|logs|environment|reproduce|code path|bug/i.test(text), hint: 'Include expected vs actual behavior, evidence, or logs.' },
    { key: 'constraints', label: 'Constraints', pass: /constraint|avoid|must|should|preserve|limit|do not/i.test(text), hint: 'Set boundaries for allowed changes and answer style.' },
    { key: 'output', label: 'Output', pass: /output|format|return only|structure|sections/i.test(text), hint: 'Specify the desired output format.' },
    { key: 'tests', label: 'Tests', pass: /test|edge case|validation|regression/i.test(text), hint: 'Ask for tests or validation ideas when appropriate.' }
  ];

  const textLength = text.length;
  const clarity = Math.min(100, 42 + (checks[0].pass ? 12 : 0) + (checks[1].pass ? 18 : 0) + (checks[5].pass ? 16 : 0) + Math.min(12, Math.floor(textLength / 140)));
  const specificity = Math.min(100, 32 + (checks[2].pass ? 18 : 0) + (checks[3].pass ? 22 : 0) + (checks[4].pass ? 16 : 0) + (checks[6].pass ? 10 : 0) + Math.min(10, Math.floor(textLength / 220)));
  const outputFit = Math.min(100, 38 + (checks[5].pass ? 26 : 0) + (checks[4].pass ? 12 : 0) + (checks[6].pass ? 12 : 0) + (checks[1].pass ? 10 : 0));

  const diagnostics = checks.filter(item => !item.pass).map(item => item.hint);
  if (textLength > 2800) diagnostics.push('The prompt is getting long. Remove repeated instructions to keep answers sharper.');
  if (textLength < 280) diagnostics.push('The prompt is very short. Add more context and output expectations for better answers.');

  return {
    clarity,
    specificity,
    outputFit,
    overall: Math.round((clarity + specificity + outputFit) / 3),
    checks,
    diagnostics
  };
}

function applyQuickField(prompt, field) {
  const fieldMap = {
    Role: '\n\nRole:\n- Act as a senior engineer specialized in [fill role]',
    Task: '\n\nTask:\n- [describe the concrete task]',
    Stack: '\n\nStack / Environment:\n- Framework:\n- Runtime:\n- Database:\n- Tooling:',
    Context: '\n\nContext:\n- Expected behavior:\n- Actual behavior:\n- Relevant code path:\n- Logs / evidence:',
    Constraints: '\n\nConstraints:\n- Avoid unnecessary rewrites\n- Preserve current style\n- Keep changes safe and minimal',
    Output: '\n\nOutput format:\n- Root cause\n- Fix summary\n- Updated code\n- Tests',
    Tests: '\n\nTesting expectations:\n- Mention edge cases\n- Suggest regression coverage\n- Note any mocks or fixtures needed'
  };

  const addition = fieldMap[field] || '';
  if (!addition) return prompt;
  return `${String(prompt || '').trim()}${addition}`.trim();
}

function applyRefine(prompt, action, profile = DEFAULT_PROFILE) {
  const base = String(prompt || '').trim();
  if (!base) return '';

  const rules = {
    Optimize: 'Optimize this prompt for better answer quality while keeping its original intent. Tighten wording, remove redundancy, and improve structure.',
    Shorten: 'Rewrite this prompt to be shorter and more token-efficient without losing important requirements.',
    'Debug Tone': 'Rewrite this prompt so it sounds more technical, direct, and senior-level for developer workflows.',
    'Add Examples': 'Improve this prompt by adding concise examples of good output sections when useful.',
    Safer: 'Rewrite this prompt to reduce risky assumptions, ask for evidence, and avoid overconfident conclusions.',
    'More Specific': 'Rewrite this prompt to be more specific by clarifying expected behavior, actual behavior, environment, constraints, and output format.',
    Clearer: 'Rewrite this prompt to improve clarity and reduce ambiguity.',
    Shorter: 'Rewrite this prompt so it is shorter, sharper, and easier for an LLM to follow.',
    'More Technical': 'Rewrite this prompt so it is more technical, implementation-aware, and precise for experienced developers.',
    'Add Test Cases': 'Rewrite this prompt so the answer must include edge cases, test scenarios, and regression coverage.',
    'Better for Claude': 'Rewrite this prompt so it works well for Claude: clear sections, explicit instructions, grounded reasoning, and careful output formatting.',
    'Safer Output': 'Rewrite this prompt to explicitly separate evidence, assumptions, risks, and recommendations.'
  };

  const instruction = rules[action] || `Refine this prompt: ${action}`;
  return [
    'Act as an expert prompt engineer for software development.',
    `Profile context: ${profile.signatureInstructions}`,
    instruction,
    '',
    'Original prompt:',
    base,
    '',
    'Return only the improved prompt.'
  ].join('\n');
}

function buildVariableMap(input = {}, profile = DEFAULT_PROFILE, workspace = null) {
  return {
    role: input.role || workspace?.role || '',
    task: input.task || workspace?.task || '',
    stack: input.stack || workspace?.stack || profile.preferredStack || '',
    expected_behavior: input.expectedBehavior || '',
    actual_behavior: input.actualBehavior || '',
    context: normalizeList(input.context).join('\n') || '',
    constraints: normalizeList(input.constraints || workspace?.constraints || profile.reviewRules).join('\n') || '',
    output: normalizeList(input.output || workspace?.output || profile.outputPreference).join('\n') || '',
    workspace_name: workspace?.name || input.workspaceName || '',
    repo_area: input.repoArea || workspace?.repoArea || '',
    target_model: input.targetModel || profile.targetModel || ''
  };
}

function resolveVariables(text, variables) {
  let next = String(text || '');
  Object.entries(variables || {}).forEach(([key, value]) => {
    const safeValue = String(value || '');
    const token = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    next = next.replace(token, safeValue);
  });
  return next;
}

function buildDeveloperPrompt(input, profile = DEFAULT_PROFILE, workspace = null) {
  const role = input.role || workspace?.role || 'Senior software engineer and code reviewer';
  const task = input.task || workspace?.task || 'Analyze the provided code or issue and return a practical, implementation-ready answer.';
  const contextLines = [];

  if (input.expectedBehavior) contextLines.push(`Expected behavior: ${input.expectedBehavior}`);
  if (input.actualBehavior) contextLines.push(`Actual behavior: ${input.actualBehavior}`);
  normalizeList(input.context).forEach(item => contextLines.push(item));

  const sections = [
    `Act as a ${role}.`,
    '',
    'Project / prompt context:',
    `- Target model: ${input.targetModel || profile.targetModel}`,
    `- Mode: ${input.mode || workspace?.mode || profile.defaultMode}`,
    `- Preferred answer language: ${input.language || workspace?.language || profile.defaultLanguage}`,
    `- Product or project: ${input.productName || 'Not specified'}`,
    `- Repository or surface area: ${input.repoArea || workspace?.repoArea || 'Not specified'}`,
    `- Stack: ${input.stack || workspace?.stack || profile.preferredStack}`
  ];

  if (workspace?.name) {
    sections.push(`- Workspace preset: ${workspace.name}`);
    if (workspace.notes) {
      sections.push(`- Workspace notes: ${workspace.notes}`);
    }
  }

  sections.push('', 'Your task:', task);

  const contextSection = buildSection('Context', contextLines);
  if (contextSection) {
    sections.push('', contextSection);
  }

  const constraintLines = normalizeList(input.constraints || workspace?.constraints || profile.reviewRules);
  const constraintSection = buildSection('Constraints', constraintLines);
  if (constraintSection) {
    sections.push('', constraintSection);
  }

  const outputLines = normalizeList(input.output || workspace?.output || profile.outputPreference);
  const outputSection = buildSection('Output format', outputLines);
  if (outputSection) {
    sections.push('', outputSection);
  }

  sections.push('', 'Quality bar:');
  sections.push(`- Tone: ${profile.brandTone}`);
  sections.push(`- Follow this style: ${profile.signatureInstructions}`);
  sections.push('- Be practical and specific, not generic.');
  sections.push('- Call out assumptions, risks, and missing evidence.');
  sections.push('- Prefer the smallest reliable change before suggesting larger rewrites.');
  sections.push('- Mention validation steps, edge cases, and test coverage when useful.');

  return resolveVariables(sections.join('\n'), buildVariableMap(input, profile, workspace));
}

async function getProfile() {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.profile);
  return { ...DEFAULT_PROFILE, ...(result[STORAGE_KEYS.profile] || {}) };
}

async function saveProfile(profile) {
  await chrome.storage.sync.set({ [STORAGE_KEYS.profile]: profile });
}

async function saveRecentPrompt(prompt) {
  await chrome.storage.local.set({ [STORAGE_KEYS.recentPrompt]: prompt });
}

async function getRecentPrompt() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.recentPrompt);
  return result[STORAGE_KEYS.recentPrompt] || '';
}

async function getSavedPrompts() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.savedPrompts);
  return result[STORAGE_KEYS.savedPrompts] || [];
}

async function savePromptEntry(entry) {
  const list = await getSavedPrompts();
  const now = new Date().toISOString();
  const id = entry.id || `saved_${Date.now()}`;
  const next = [
    {
      id,
      name: entry.name || 'Untitled prompt',
      preview: entry.preview || String(entry.prompt || '').slice(0, 160),
      updatedAt: now,
      updated: formatRelativeTime(now),
      tag: entry.tag || 'general',
      prompt: entry.prompt || '',
      workspaceId: entry.workspaceId || '',
      mode: entry.mode || ''
    },
    ...list.filter(item => item.id !== id && item.prompt !== entry.prompt)
  ].slice(0, 60);

  await chrome.storage.local.set({ [STORAGE_KEYS.savedPrompts]: next });
  return next;
}

async function getPromptHistory() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.promptHistory);
  return result[STORAGE_KEYS.promptHistory] || [];
}

async function saveHistoryEntry(entry) {
  const list = await getPromptHistory();
  const now = new Date().toISOString();
  const next = [
    {
      id: entry.id || `history_${Date.now()}`,
      action: entry.action || 'updated',
      name: entry.name || 'Untitled prompt',
      tag: entry.tag || 'general',
      preview: String(entry.prompt || '').slice(0, 180),
      prompt: entry.prompt || '',
      workspaceId: entry.workspaceId || '',
      createdAt: now,
      created: formatRelativeTime(now)
    },
    ...list
  ].slice(0, 100);

  await chrome.storage.local.set({ [STORAGE_KEYS.promptHistory]: next });
  return next;
}

async function saveDraft(draft) {
  const payload = {
    ...draft,
    updatedAt: new Date().toISOString()
  };
  await chrome.storage.local.set({ [STORAGE_KEYS.draft]: payload });
  return payload;
}

async function getDraft() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.draft);
  return result[STORAGE_KEYS.draft] || null;
}

async function clearDraft() {
  await chrome.storage.local.remove(STORAGE_KEYS.draft);
}

async function getWorkspaces() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.workspaces);
  const stored = result[STORAGE_KEYS.workspaces];
  if (stored && stored.length) return stored;
  await chrome.storage.local.set({ [STORAGE_KEYS.workspaces]: DEFAULT_WORKSPACES });
  return DEFAULT_WORKSPACES;
}

async function saveWorkspaceEntry(entry) {
  const list = await getWorkspaces();
  const now = new Date().toISOString();
  const id = entry.id || `workspace_${Date.now()}`;
  const next = [
    {
      id,
      name: entry.name || 'Untitled workspace',
      mode: entry.mode || DEFAULT_PROFILE.defaultMode,
      language: entry.language || DEFAULT_PROFILE.defaultLanguage,
      repoArea: entry.repoArea || '',
      role: entry.role || '',
      stack: entry.stack || '',
      task: entry.task || '',
      constraints: entry.constraints || '',
      output: entry.output || '',
      notes: entry.notes || '',
      updatedAt: now
    },
    ...list.filter(item => item.id !== id)
  ].slice(0, 30);

  await chrome.storage.local.set({ [STORAGE_KEYS.workspaces]: next });
  return next;
}

async function deleteWorkspace(id) {
  const list = await getWorkspaces();
  const next = list.filter(item => item.id !== id);
  await chrome.storage.local.set({ [STORAGE_KEYS.workspaces]: next });
  return next;
}

window.PromptForgeEngine = {
  STORAGE_KEYS,
  DEFAULT_PROFILE,
  TABS,
  QUICK_FIELDS,
  SMART_ACTIONS,
  REFINE_ACTIONS,
  VARIABLE_TOKENS,
  DEFAULT_WORKSPACES,
  TEMPLATES,
  normalizeList,
  slugify,
  formatRelativeTime,
  getTemplateById,
  getWorkspaceById,
  scorePrompt,
  applyQuickField,
  applyRefine,
  buildVariableMap,
  resolveVariables,
  buildDeveloperPrompt,
  getProfile,
  saveProfile,
  saveRecentPrompt,
  getRecentPrompt,
  getSavedPrompts,
  savePromptEntry,
  getPromptHistory,
  saveHistoryEntry,
  saveDraft,
  getDraft,
  clearDraft,
  getWorkspaces,
  saveWorkspaceEntry,
  deleteWorkspace
};
