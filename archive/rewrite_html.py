import os
import re

html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# I will find the editor-field-group for Gemini API Key and completely replace it
pattern = r'<div class="editor-field-group".*?<span class="editor-label"[^>]*>Gemini API Key</span>.*?</div>'

replacement = '''<div class="editor-field-group" style="display: flex; gap: 8px; align-items: center; width: 100%;">
              <span class="editor-label" style="width: 120px; flex-shrink: 0; font-weight: 600; font-size: 13px;">Gemini API Key</span>
              <input type="password" id="setting-ai-key" class="editor-input" style="flex: 1; height:32px; font-size:13px; border: 1px solid var(--border-color); background-color: var(--bg-primary); border-radius: 4px; padding: 4px 8px; font-family: inherit; color: var(--text-primary);" placeholder="AI Studio에서 발급받은 API 키를 입력하세요">
              <button id="btn-save-ai-key" class="btn-primary" style="height: 32px; padding: 0 16px; font-size: 13px; font-weight: 600; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: none; background-color: var(--color-primary); color: white;">
                저장
              </button>
            </div>'''

html = re.sub(pattern, replacement, html, flags=re.DOTALL)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Rewritten HTML block")
