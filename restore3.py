import os

html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
head_path = "C:/Users/82102/Desktop/workspace/SRinspector/HEAD_index.html"

with open(html_path, "r", encoding="utf-8") as f:
    current_html = f.read()

with open(head_path, "r", encoding="utf-16") as f:
    head_html = f.read()

start_marker = '<!-- Editor Fields (Readonly Meta + Editable Textarea) -->'
end_marker = '<!-- TAB 5: SUBJECT GROUP VIEW -->'

start_idx = head_html.find(start_marker)
end_idx = head_html.find(end_marker)

missing_block = head_html[start_idx:end_idx]

broken_block_start = current_html.find('<!-- Editor Fields (Readonly Meta + Editable Textarea) -->')
# Because my rewrite_html.py basically ate everything up to the Gemini API Key button,
# I will find the end of my broken block which is:
broken_block_end = current_html.find('</button>\n            </div>', broken_block_start)
if broken_block_end != -1:
    broken_block_end += len('</button>\n            </div>')
else:
    # If not found, just try to find where the subject list starts
    broken_block_end = current_html.find('<!-- 우측: 과목 상세 및 수강 학생 카드 그리드 영역 -->')
    # Actually, the block I destroyed ended before:
    # <!-- 세로 과목 리스트 (스크롤) -->
    # Let's find that.
    broken_block_end = current_html.find('<!-- 세로 과목 리스트 (스크롤) -->')
    # Before that, there are some closing divs.
    broken_block_end = current_html.rfind('</div>', 0, broken_block_end)

# Let's fix missing_block to include the button!
missing_block = missing_block.replace(
    '''<input type="password" id="setting-ai-key" class="editor-input" style="flex: 1; height:32px; font-size:13px; border: 1px solid var(--border-color); background-color: var(--bg-primary); border-radius: 4px; padding: 4px 8px; font-family: inherit; color: var(--text-primary);" placeholder="AI Studio에서 발급받은 API 키를 입력하세요">''',
    '''<input type="password" id="setting-ai-key" class="editor-input" style="flex: 1; height:32px; font-size:13px; border: 1px solid var(--border-color); background-color: var(--bg-primary); border-radius: 4px; padding: 4px 8px; font-family: inherit; color: var(--text-primary);" placeholder="AI Studio에서 발급받은 API 키를 입력하세요" >
              <button id="btn-save-ai-key" class="btn-primary" style="height: 32px; padding: 0 16px; font-size: 13px; font-weight: 600; border-radius: 4px; display: flex; align-items: center; gap: 6px; cursor: pointer; border: none; background-color: var(--color-primary); color: white;">
                <i data-lucide="save" style="width: 14px; height: 14px;"></i> 저장
              </button>'''
)

# Replace in current_html
new_html = current_html[:broken_block_start] + missing_block + current_html[broken_block_end:]

with open(html_path, "w", encoding="utf-8") as f:
    f.write(new_html)

print("Restoration complete")
