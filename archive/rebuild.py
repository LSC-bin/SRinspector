import os

head_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html" # Currently HEAD because of git checkout
broken_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html.broken"

with open(head_path, "r", encoding="utf-8") as f:
    head_html = f.read()

with open(broken_path, "r", encoding="utf-8") as f:
    broken_html = f.read()

# 1. We need the top of the file up to the END of the Editor Fields.
# Actually, head_html has the correct top of the file AND the editor fields AND the clean settings.
# So we can take head_html from start to the end of the Settings tab.
# Let's find the end of the Settings tab in head_html.
end_settings_marker = '<!-- TAB 5: SUBJECT GROUP VIEW -->'
idx_end_settings = head_html.find(end_settings_marker)

if idx_end_settings == -1:
    print("Could not find TAB 5 in head_html")
    exit(1)

clean_top = head_html[:idx_end_settings]

# 2. We need to inject the Gemini block at the very end of the settings tab.
# Where is the end of the settings tab?
# It ends with the Custom Dictionary block:
custom_dict_end = '<!-- Rows will be dynamically added here -->\n            </div>\n          </div>'
idx_custom_dict = clean_top.find(custom_dict_end)
if idx_custom_dict != -1:
    insert_pos = idx_custom_dict + len(custom_dict_end)
    
    gemini_block = """

          <!-- Google Gemini AI API 연동 -->
          <div class="settings-section" style="margin-top: 24px;">
            <h4 class="settings-section-title">
              <i data-lucide="brain-circuit"></i>
              <span>Google Gemini AI 점검 연동 (옵션)</span>
            </h4>
            <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 16px;">
              로컬 사전을 보완하여 정적인 매칭으로 잡지 못하는 문맥 오류(우회 대학명 언급, 부모의 사회적 지위 암시 등)를 인공지능이 추가 정밀 분석합니다. 개인 식별 정보는 마스킹 처리 후 본문만 전송되므로 안전합니다.
            </p>
            
            <div class="toggle-item" style="margin-bottom: 16px;">
              <div class="toggle-details">
                <h5>AI 점검 기능 활성화</h5>
                <p>Gemini API를 활용하여 문맥 기반 정밀 생기부 검사를 함께 수행합니다.</p>
              </div>
              <label class="switch">
                <input type="checkbox" id="setting-ai-enabled">
                <span class="slider"></span>
              </label>
            </div>

            <div class="editor-field-group" style="display: flex; gap: 8px; align-items: center; width: 100%;">
              <span class="editor-label" style="width: 120px; flex-shrink: 0; font-weight: 600; font-size: 13px;">Gemini API Key</span>
              <input type="password" id="setting-ai-key" class="editor-input" style="flex: 1; height:32px; font-size:13px; border: 1px solid var(--border-color); background-color: var(--bg-primary); border-radius: 4px; padding: 4px 8px; font-family: inherit; color: var(--text-primary);" placeholder="AI Studio에서 발급받은 API 키를 입력하세요">
              <button id="btn-save-ai-key" class="btn-primary" style="height: 32px; padding: 0 16px; font-size: 13px; font-weight: 600; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; border: none; background-color: var(--color-primary); color: white;">
                저장
              </button>
            </div>
            
            <div style="margin-top: 10px; padding: 8px 12px; background-color: var(--bg-secondary); border-left: 3px solid var(--color-slang-text); border-radius: 0 4px 4px 0; font-size: 11px; color: var(--text-secondary); line-height: 1.5;">
              💡 <b>[필독] 404 (Not Found) 오류 발생 시 자가 조치법</b><br>
              구글 AI Studio에서 API 키를 만드실 때, 기존 프로젝트가 아닌 <b>[새 프로젝트에서 API 키 만들기 (Create API key in new project)]</b>를 클릭하여 완전 새로운 프로젝트의 키를 생성해 등록해 주세요. 기존 기본 프로젝트(Default Gemini Project)에 권한 꼬임이 있을 때 발생하는 구글 클라우드 고유의 차단 버그를 100% 즉시 해결해 줍니다.
            </div>
          </div>
"""
    clean_top = clean_top[:insert_pos] + gemini_block + clean_top[insert_pos:]
else:
    print("Could not find custom dict end")
    exit(1)

# 3. We need the NEW Subject Group View from broken_html.
# In broken_html, the Subject Group View starts with <!-- TAB 5: SUBJECT GROUP VIEW -->
idx_subject = broken_html.find('<!-- TAB 5: SUBJECT GROUP VIEW -->')
if idx_subject == -1:
    print("Could not find TAB 5 in broken_html")
    exit(1)

subject_view_bottom = broken_html[idx_subject:]

# Assemble!
final_html = clean_top + subject_view_bottom

with open(head_path, "w", encoding="utf-8") as f:
    f.write(final_html)

print("Rebuilt index.html perfectly.")
