import os
import re

html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Fix the broken placeholder and button text
html = re.sub(r'<input type="password" id="setting-ai-key".*?>\s*<button id="btn-save-ai-key".*?>\s*<i data-lucide="save".*?></i>.*?</button>',
    '''<input type="password" id="setting-ai-key" class="editor-input" style="flex: 1; height:32px; font-size:13px; border: 1px solid var(--border-color); background-color: var(--bg-primary); border-radius: 4px; padding: 4px 8px; font-family: inherit; color: var(--text-primary);" placeholder="AI Studio에서 발급받은 API 키를 입력하세요">
              <button id="btn-save-ai-key" class="btn-primary" style="height: 32px; padding: 0 16px; font-size: 13px; font-weight: 600; border-radius: 4px; display: flex; align-items: center; gap: 6px; cursor: pointer; border: none; background-color: var(--color-primary); color: white;">
                <i data-lucide="save" style="width: 14px; height: 14px;"></i> 저장
              </button>''', html, flags=re.DOTALL)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    app_js = f.read()
    
# Check if btnSaveAiKey was added correctly to DOM object
if "btnSaveAiKey:" not in app_js:
    app_js = app_js.replace("settingAiKey: document.getElementById('setting-aiKey'),", 
                            "settingAiKey: document.getElementById('setting-ai-key'),\n  btnSaveAiKey: document.getElementById('btn-save-ai-key'),")

# Fix broken toast text
app_js = app_js.replace("showToast('AI API Key Ǿϴ.');", "showToast('AI API Key가 저장되었습니다.');")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(app_js)

print("Patch 9 applied")
