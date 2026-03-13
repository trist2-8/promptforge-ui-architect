const fields = [
  'ownerName',
  'brandTone',
  'defaultLanguage',
  'defaultMode',
  'targetModel',
  'preferredStack',
  'reviewRules',
  'outputPreference',
  'signatureInstructions'
];

const statusEl = document.getElementById('saveStatus');

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
    }
  });
}

async function loadProfile() {
  const profile = await window.PromptForgeEngine.getProfile();
  setFormData(profile);
}

async function saveProfile() {
  const profile = getFormData();
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

loadProfile();
