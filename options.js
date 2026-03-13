const fields = [
  'ownerName',
  'brandTone',
  'defaultLanguage',
  'defaultMode',
  'targetModel',
  'preferredStack',
  'reviewRules',
  'outputPreference',
  'signatureInstructions',
  'autosaveEnabled',
  'autosaveDelay'
];

const statusEl = document.getElementById('saveStatus');

function initCustomSelects(root = document) {
  root.querySelectorAll('.custom-select').forEach(select => {
    if (select.dataset.bound === 'true') return;
    select.dataset.bound = 'true';
    const trigger = select.querySelector('.custom-select-trigger');
    const label = select.querySelector('[data-label]');
    const input = document.getElementById(select.dataset.input);
    const options = Array.from(select.querySelectorAll('.custom-option'));

    const sync = () => {
      const active = options.find(option => option.dataset.value === input.value);
      label.textContent = active ? active.textContent : 'Select';
      options.forEach(option => option.classList.toggle('active', option.dataset.value === input.value));
    };

    trigger.addEventListener('click', event => {
      event.preventDefault();
      document.querySelectorAll('.custom-select').forEach(item => {
        if (item !== select) item.classList.remove('open');
      });
      select.classList.toggle('open');
    });

    options.forEach(option => {
      option.addEventListener('click', () => {
        input.value = option.dataset.value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        select.classList.remove('open');
      });
    });

    input.addEventListener('change', sync);
    sync();
  });

  document.addEventListener('click', event => {
    if (!event.target.closest('.custom-select')) {
      document.querySelectorAll('.custom-select').forEach(item => item.classList.remove('open'));
    }
  });
}

function getFormData() {
  return fields.reduce((acc, key) => {
    acc[key] = document.getElementById(key).value.trim();
    return acc;
  }, {});
}

function setFormData(profile) {
  fields.forEach(key => {
    const element = document.getElementById(key);
    if (element) {
      element.value = profile[key] || '';
      element.dispatchEvent(new Event('change'));
    }
  });
}

async function loadProfile() {
  const profile = await window.PromptForgeEngine.getProfile();
  setFormData(profile);
}

async function saveProfile() {
  const profile = getFormData();
  if (!profile.autosaveDelay || Number(profile.autosaveDelay) < 300) {
    profile.autosaveDelay = '900';
  }
  await window.PromptForgeEngine.saveProfile(profile);
  statusEl.textContent = 'Đã lưu cấu hình thành công';
}

async function resetProfile() {
  setFormData(window.PromptForgeEngine.DEFAULT_PROFILE);
  await window.PromptForgeEngine.saveProfile(window.PromptForgeEngine.DEFAULT_PROFILE);
  statusEl.textContent = 'Đã khôi phục mặc định';
}

document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
document.getElementById('resetProfileBtn').addEventListener('click', resetProfile);

initCustomSelects();
loadProfile();
