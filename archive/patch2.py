import os
import re

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update state.settings
if "aiEnabled:" not in code:
    code = code.replace("nameCheck: true", "nameCheck: true,\n    aiEnabled: false,\n    aiKey: ''")

# 2. Update DOM object
if "settingAiEnabled:" not in code:
    code = code.replace("settingNameCheck: document.getElementById('setting-nameCheck'),", 
                        "settingNameCheck: document.getElementById('setting-nameCheck'),\n  settingAiEnabled: document.getElementById('setting-aiEnabled'),\n  settingAiKey: document.getElementById('setting-aiKey'),")

# 3. Update initSettingsUI
if "DOM.settingAiEnabled" not in code:
    init_settings_ui = r"(function initSettingsUI\(\) \{[\s\S]*?)(?=\n\})"
    replacement = r"\1\n  if (DOM.settingAiEnabled) DOM.settingAiEnabled.checked = state.settings.aiEnabled;\n  if (DOM.settingAiKey) DOM.settingAiKey.value = state.settings.aiKey || '';"
    code = re.sub(init_settings_ui, replacement, code, count=1)

# 4. Update initEventListeners
if "DOM.settingAiKey.addEventListener" not in code:
    listeners = """
  if (DOM.settingAiEnabled) {
    DOM.settingAiEnabled.addEventListener('change', (e) => {
      state.settings.aiEnabled = e.target.checked;
      saveSettingsToStorage();
      if (e.target.checked) runAnalysisOnAllStudents();
    });
  }
  if (DOM.settingAiKey) {
    DOM.settingAiKey.addEventListener('input', (e) => {
      state.settings.aiKey = e.target.value.trim();
      saveSettingsToStorage();
    });
  }
"""
    code = code.replace("function initEventListeners() {", "function initEventListeners() {\n" + listeners)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Patch 2 applied successfully.")
