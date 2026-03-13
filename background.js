async function enablePanel() {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (error) {
    console.error('Unable to enable side panel behavior', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  enablePanel();
});

chrome.runtime.onStartup.addListener(() => {
  enablePanel();
});

enablePanel();
