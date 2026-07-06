import os

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    js = f.read()

# 1. Update DOM object to include AI settings and new Subject View elements
dom_old = """  // Toast 알림
  toastContainer: document.getElementById('toast-container')
};"""

dom_new = """  // Toast 알림
  toastContainer: document.getElementById('toast-container'),

  // Gemini API 설정
  settingAiEnabled: document.getElementById('setting-aiEnabled'),
  settingAiKey: document.getElementById('setting-ai-key'),
  btnSaveAiKey: document.getElementById('btn-save-ai-key'),

  // Tab 4: 과목별 확인 (2단 분할 레이아웃 개편)
  subjectFilterYear: document.getElementById('subject-filter-year'),
  subjectFilterTerm: document.getElementById('subject-filter-term'),
  subjectFilterGrade: document.getElementById('subject-filter-grade'),
  subjectListContainer: document.getElementById('subject-list-container'),
  subjectEmptyState: document.getElementById('subject-empty-state'),
  subjectActiveContainer: document.getElementById('subject-active-container'),
  currentSubjectTitle: document.getElementById('current-subject-title'),
  currentSubjectMeta: document.getElementById('current-subject-meta'),
  subjectStudentCardsContainer: document.getElementById('subject-student-cards-container')
};"""

js = js.replace(dom_old, dom_new)

# 2. Add event listeners for the new subject filters
listeners_old = """  DOM.btnAddRow.addEventListener('click', addNewStudentRow);"""

listeners_new = """  // AI 설정 이벤트 리스너
  if (DOM.settingAiEnabled) {
    DOM.settingAiEnabled.addEventListener('change', (e) => {
      state.settings.aiEnabled = e.target.checked;
      saveSettingsToStorage();
      if (e.target.checked) runAnalysisOnAllStudents();
    });
  }

  if (DOM.btnSaveAiKey && DOM.settingAiKey) {
    DOM.btnSaveAiKey.addEventListener('click', () => {
      const key = DOM.settingAiKey.value.trim();
      state.settings.aiKey = key;
      saveSettingsToStorage();
      showToast('Gemini API Key가 저장되었습니다.');
    });
  }

  // 과목별 확인 필터 이벤트 리스너
  if (DOM.subjectFilterYear) DOM.subjectFilterYear.addEventListener('change', renderSubjectGroupView);
  if (DOM.subjectFilterTerm) DOM.subjectFilterTerm.addEventListener('change', renderSubjectGroupView);
  if (DOM.subjectFilterGrade) DOM.subjectFilterGrade.addEventListener('change', renderSubjectGroupView);
  if (DOM.subjectSearchInputTab) {
    let subjectSearchTimeout;
    DOM.subjectSearchInputTab.addEventListener('input', (e) => {
      clearTimeout(subjectSearchTimeout);
      subjectSearchTimeout = setTimeout(() => {
        renderSubjectGroupView();
      }, 250);
    });
  }

  DOM.btnAddRow.addEventListener('click', addNewStudentRow);"""

js = js.replace(listeners_old, listeners_new)

# 3. Replace the old renderSubjectGroupView function with the new one
start_func_idx = js.find("function renderSubjectGroupView() {")
end_func_idx = js.find("function escapeHTML", start_func_idx)
if end_func_idx == -1:
    # If not found, it is at the end of the file
    end_func_idx = len(js)

if start_func_idx != -1:
    with open("C:/Users/82102/Desktop/workspace/SRinspector/subject_view_extracted_render.txt", "r", encoding="utf-8") as f_render:
        new_render_code = f_render.read()
    
    with open("C:/Users/82102/Desktop/workspace/SRinspector/parse_snum_extracted.txt", "r", encoding="utf-8") as f_snum:
        snum_code = f_snum.read()
        func_snum_idx = snum_code.find("function parseGradeClassNumberFromSNum")
        snum_func = snum_code[func_snum_idx:] if func_snum_idx != -1 else ""

    js = js[:start_func_idx] + new_render_code + "\n\n" + snum_func + "\n\n" + js[end_func_idx:]
    print("Replaced subject view rendering code successfully")
else:
    print("Failed to replace renderSubjectGroupView indices", start_func_idx, end_func_idx)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(js)
print("Rebuilt app.js with DOM and Subject View fixes")
