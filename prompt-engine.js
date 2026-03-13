const STORAGE_KEYS = {
  profile: 'pfd_profile',
  recentPrompt: 'pfd_recent_prompt',
  savedPrompts: 'pfd_saved_prompts'
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
  signatureInstructions: 'Be practical, senior-level, low fluff, implementation-aware, and explicit about trade-offs.'
};

const TABS = [
  { key: 'write', label: 'Write' },
  { key: 'templates', label: 'Templates' },
  { key: 'library', label: 'Library' },
  { key: 'refine', label: 'Refine' }
];

const QUICK_FIELDS = ['Role', 'Task', 'Stack', 'Context', 'Constraints', 'Output'];
const SMART_ACTIONS = ['Optimize', 'Shorten', 'Debug Tone', 'Add Examples', 'Safer', 'More Specific'];
const REFINE_ACTIONS = ['Clearer', 'Shorter', 'More Technical', 'Add Test Cases', 'Better for Claude', 'Safer Output'];

const TEMPLATES = [
  {
    id: 'code-review',
    title: 'Code Review Prompt',
    desc: 'Review code for readability, bugs, performance, architecture, and maintainability.',
    tag: 'review',
    prompt: `Act as a senior software engineer and code reviewer.\n\nI will give you code and supporting context.\n\nYour task:\n1. Explain the main issue or improvement opportunities\n2. Prioritize bugs, readability, performance, and architecture concerns\n3. Suggest the smallest practical fix first\n4. Show improved code only where useful\n5. Mention risks, edge cases, and tests\n\nConstraints:\n- Keep advice practical\n- Avoid unnecessary rewrites\n- Preserve existing style where possible\n\nOutput format:\n- Summary\n- Issues found\n- Recommended fix\n- Updated code\n- Test ideas`
  },
  {
    id: 'bug-investigation',
    title: 'Bug Investigation',
    desc: 'Explain root cause, reproduce steps, signals, and propose a minimal reliable fix.',
    tag: 'debug',
    prompt: `Act as a senior debugging engineer.\n\nI will provide bug symptoms, logs, code, and environment details.\n\nYour task:\n1. Infer the most likely root cause\n2. List reproduction steps\n3. Identify weak assumptions in the code path\n4. Propose the smallest safe fix\n5. Suggest validations and tests after the patch\n\nOutput format:\n- Root cause hypothesis\n- Evidence\n- Fix\n- Risks\n- Validation plan`
  },
  {
    id: 'refactor-planner',
    title: 'Refactor Planner',
    desc: 'Break a refactor into safe phases with risks, migration steps, and test strategy.',
    tag: 'refactor',
    prompt: `Act as a senior software architect.\n\nI need a refactor plan for an existing codebase.\n\nYour task:\n1. Assess the current structure\n2. Break the refactor into safe phases\n3. Define risks and rollback options\n4. Suggest test strategy and acceptance criteria\n5. Explain what should not be changed in early phases\n\nOutput format:\n- Current pain points\n- Refactor phases\n- Risk matrix\n- Tests\n- Rollout plan`
  },
  {
    id: 'api-design',
    title: 'API Design Prompt',
    desc: 'Design endpoints, schema validation, auth, rate limits, and error handling.',
    tag: 'api',
    prompt: `Act as a product-minded backend architect.\n\nDesign an API for the described feature.\n\nYour task:\n1. Define endpoints and payloads\n2. Recommend validation and auth rules\n3. Cover failure cases and error responses\n4. Mention observability and rate limiting\n5. Suggest database implications\n\nOutput format:\n- Endpoints\n- Request and response schema\n- Validation\n- Errors\n- Security\n- Notes for frontend integration`
  }
];

function normalizeList(value) {
  return String(value || '')
    .split(/\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
}

function getTemplateById(id) {
  return TEMPLATES.find(item => item.id === id) || TEMPLATES[0];
}

function scorePrompt(prompt) {
  const text = String(prompt || '').trim();
  const hasRole = /act as|you are/i.test(text);
  const hasTask = /task|your task|objective/i.test(text);
  const hasOutput = /output|format/i.test(text);
  const hasConstraints = /constraint|avoid|preserve|must|should/i.test(text);
  const hasContext = /context|code|bug|stack|environment|logs/i.test(text);

  const clarity = Math.min(100, 45 + (hasRole ? 12 : 0) + (hasTask ? 18 : 0) + (hasOutput ? 10 : 0) + Math.min(15, Math.floor(text.length / 80)));
  const specificity = Math.min(100, 35 + (hasConstraints ? 20 : 0) + (hasContext ? 20 : 0) + Math.min(25, Math.floor(text.length / 60)));
  const outputFit = Math.min(100, 40 + (hasOutput ? 24 : 0) + (hasTask ? 16 : 0) + (hasConstraints ? 12 : 0));

  return {
    clarity,
    specificity,
    outputFit,
    overall: Math.round((clarity + specificity + outputFit) / 3)
  };
}

function applyQuickField(prompt, field) {
  const fieldMap = {
    Role: '\n\nRole:\n- Act as a senior engineer specialized in [fill role]',
    Task: '\n\nTask:\n- [describe the concrete task]',
    Stack: '\n\nStack / Environment:\n- Framework:\n- Runtime:\n- Database:\n- Tooling:',
    Context: '\n\nContext:\n- Expected behavior:\n- Actual behavior:\n- Relevant code path:\n- Logs / evidence:',
    Constraints: '\n\nConstraints:\n- Avoid unnecessary rewrites\n- Preserve current style\n- Keep changes safe and minimal',
    Output: '\n\nOutput format:\n- Root cause\n- Fix summary\n- Updated code\n- Tests'
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
    More: 'Rewrite this prompt to be more detailed and technical.',
    'More Technical': 'Rewrite this prompt so it is more technical, implementation-aware, and precise for experienced developers.',
    'Add Test Cases': 'Rewrite this prompt so the answer must include edge cases, test scenarios, and regression coverage.',
    'Better for Claude': 'Rewrite this prompt so it works well for Claude: clear sections, explicit instructions, grounded reasoning, and careful output formatting.',
    'Safer Output': 'Rewrite this prompt to explicitly separate evidence, assumptions, risks, and recommendations.'
  };

  const instruction = rules[action] || `Refine this prompt: ${action}`;
  return [
    `Act as an expert prompt engineer for software development.`,
    `Profile context: ${profile.signatureInstructions}`,
    instruction,
    '',
    'Original prompt:',
    base,
    '',
    'Return only the improved prompt.'
  ].join('\n');
}

function buildDeveloperPrompt(input, profile = DEFAULT_PROFILE) {
  const sections = [];
  const role = input.role || 'Senior software engineer and code reviewer';
  const task = input.task || 'Analyze the provided code or issue and return a practical, implementation-ready answer';

  sections.push(`Act as a ${role}.`);
  sections.push('');
  sections.push('Project / prompt context:');
  sections.push(`- Target model: ${input.targetModel || profile.targetModel}`);
  sections.push(`- Mode: ${input.mode || profile.defaultMode}`);
  sections.push(`- Preferred answer language: ${input.language || profile.defaultLanguage}`);
  sections.push(`- Product or code area: ${input.productName || 'Not specified'}`);
  sections.push(`- Stack: ${input.stack || profile.preferredStack}`);
  sections.push('');
  sections.push('Your task:');
  sections.push(task);

  const contextLines = normalizeList(input.context);
  if (contextLines.length) {
    sections.push('');
    sections.push('Context:');
    contextLines.forEach(line => sections.push(`- ${line}`));
  }

  const constraintLines = normalizeList(input.constraints || profile.reviewRules);
  if (constraintLines.length) {
    sections.push('');
    sections.push('Constraints:');
    constraintLines.forEach(line => sections.push(`- ${line}`));
  }

  const outputLines = normalizeList(input.output || profile.outputPreference);
  if (outputLines.length) {
    sections.push('');
    sections.push('Output format:');
    outputLines.forEach(line => sections.push(`- ${line}`));
  }

  sections.push('');
  sections.push('Quality bar:');
  sections.push(`- Tone: ${profile.brandTone}`);
  sections.push(`- Follow this style: ${profile.signatureInstructions}`);
  sections.push('- Be practical and specific, not generic');
  sections.push('- Call out assumptions when evidence is weak');
  sections.push('- Prefer the smallest reliable fix before larger refactors');
  sections.push('- Mention edge cases, risks, and validation steps when relevant');

  return sections.join('\n').trim();
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
  const saved = result[STORAGE_KEYS.savedPrompts];
  if (Array.isArray(saved) && saved.length) return saved;
  return [
    {
      id: 'seed-1',
      name: 'Next.js auth review',
      preview: 'Act as a senior full-stack engineer. Review my auth flow...',
      updated: '2h ago',
      tag: 'security',
      prompt: 'Act as a senior full-stack engineer. Review my auth flow with focus on middleware, session expiry, and route protection.'
    },
    {
      id: 'seed-2',
      name: 'Python bug triage',
      preview: 'Analyze the traceback, isolate the failing branch...',
      updated: 'Today',
      tag: 'debug',
      prompt: 'Analyze the traceback, isolate the failing branch, infer the most likely root cause, and propose the smallest reliable patch.'
    },
    {
      id: 'seed-3',
      name: 'SQL optimization helper',
      preview: 'Find bottlenecks in this query and suggest indexes...',
      updated: 'Yesterday',
      tag: 'database',
      prompt: 'Find bottlenecks in this SQL query, suggest indexes, and explain trade-offs in cardinality and write cost.'
    }
  ];
}

async function savePromptEntry(entry) {
  const list = await getSavedPrompts();
  const now = new Date();
  const updated = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  const next = [
    {
      id: `${Date.now()}`,
      name: entry.name || 'Untitled prompt',
      preview: String(entry.prompt || '').trim().slice(0, 90) + (String(entry.prompt || '').trim().length > 90 ? '...' : ''),
      updated,
      tag: entry.tag || 'general',
      prompt: entry.prompt || ''
    },
    ...list.filter(item => item.prompt !== entry.prompt)
  ].slice(0, 20);

  await chrome.storage.local.set({ [STORAGE_KEYS.savedPrompts]: next });
  return next;
}

window.PromptForgeEngine = {
  STORAGE_KEYS,
  DEFAULT_PROFILE,
  TABS,
  QUICK_FIELDS,
  SMART_ACTIONS,
  REFINE_ACTIONS,
  TEMPLATES,
  getTemplateById,
  scorePrompt,
  applyQuickField,
  applyRefine,
  buildDeveloperPrompt,
  getProfile,
  saveProfile,
  saveRecentPrompt,
  getRecentPrompt,
  getSavedPrompts,
  savePromptEntry
};
