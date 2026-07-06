import os

html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

target = '<input type="password" id="setting-ai-key" class="editor-input"'
replacement = '''<input type="password" id="setting-ai-key" class="editor-input" style="flex: 1; height:32px; font-size:13px; border: 1px solid var(--border-color); background-color: var(--bg-primary); border-radius: 4px; padding: 4px 8px; font-family: inherit; color: var(--text-primary);" placeholder="AI Studio에서 발급받은 API 키를 입력하세요">
              <button id="btn-save-ai-key" class="btn-primary" style="height: 32px; padding: 0 16px; font-size: 13px; font-weight: 600; border-radius: 4px; display: flex; align-items: center; gap: 6px; cursor: pointer; border: none; background-color: var(--color-primary); color: white;">
                <i data-lucide="save" style="width: 14px; height: 14px;"></i> 저장
              </button>'''

import re
# Replace the input element with the input + button
if 'id="btn-save-ai-key"' not in html:
    html = re.sub(r'<input type="password" id="setting-ai-key" class="editor-input".*?>', replacement, html)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_js = f.read()

# Add DOM reference
if 'btnSaveAiKey:' not in app_js:
    app_js = app_js.replace("settingAiKey: document.getElementById('setting-ai-key'),", 
                            "settingAiKey: document.getElementById('setting-ai-key'),\n  btnSaveAiKey: document.getElementById('btn-save-ai-key'),")

# Update listener from 'input' to clicking the button
if 'btnSaveAiKey.addEventListener' not in app_js:
    old_listener = """  if (DOM.settingAiKey) {
    DOM.settingAiKey.addEventListener('input', (e) => {
      state.settings.aiKey = e.target.value.trim();
      saveSettingsToStorage();
    });
  }"""
    
    new_listener = """  if (DOM.btnSaveAiKey && DOM.settingAiKey) {
    DOM.btnSaveAiKey.addEventListener('click', () => {
      state.settings.aiKey = DOM.settingAiKey.value.trim();
      saveSettingsToStorage();
      showToast('AI API Key가 저장되었습니다.');
    });
  }"""
    app_js = app_js.replace(old_listener, new_listener)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_js)

print("Patch applied for save button")
