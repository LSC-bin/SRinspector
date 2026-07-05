import os
import re

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    js = f.read()

# 1. Add Loading Overlay functions at the end of app.js (before the last few lines or just append it)
overlay_functions = """
// AI 분석용 로딩 오버레이 함수
function showLoadingOverlay(message) {
  let overlay = document.getElementById('ai-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ai-loading-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.color = 'white';
    overlay.style.fontFamily = 'inherit';
    
    const spinner = document.createElement('div');
    spinner.style.width = '50px';
    spinner.style.height = '50px';
    spinner.style.border = '5px solid rgba(255,255,255,0.3)';
    spinner.style.borderTop = '5px solid #0066cc';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';
    overlay.appendChild(spinner);
    
    const style = document.createElement('style');
    style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    const text = document.createElement('div');
    text.id = 'ai-loading-text';
    text.style.marginTop = '20px';
    text.style.fontSize = '16px';
    text.style.fontWeight = 'bold';
    text.innerText = message;
    overlay.appendChild(text);
    
    document.body.appendChild(overlay);
  } else {
    document.getElementById('ai-loading-text').innerText = message;
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('ai-loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}
"""

js += overlay_functions

# 2. Update runAnalysisOnStudent to return the Promise when triggerAiAnalysis is called
run_student_old = """  // Gemini AI 추가 분석 검사가 활성화되어 있고 API Key가 유효한 경우 백그라운드 비동기 요청 진행
  if (forceAi && state.settings.aiEnabled && state.settings.aiKey && stud.content) {
    triggerAiAnalysis(index);
  }"""

run_student_new = """  // Gemini AI 추가 분석 검사가 활성화되어 있고 API Key가 유효한 경우 백그라운드 비동기 요청 진행
  if (forceAi && state.settings.aiEnabled && state.settings.aiKey && stud.content) {
    return triggerAiAnalysis(index);
  }
  return Promise.resolve();"""

js = js.replace(run_student_old, run_student_new)

# If the replacement above didn't match, try with different whitespaces or simplified version
if run_student_new not in js:
    # Let's find index.html's equivalent first
    pattern = r"if\s*\(forceAi\s*&&\s*state\.settings\.aiEnabled\s*&&\s*state\.settings\.aiKey\s*&&\s*stud\.content\)\s*\{\s*triggerAiAnalysis\(index\);\s*\}"
    js = re.sub(pattern, "if (forceAi && state.settings.aiEnabled && state.settings.aiKey && stud.content) {\n    return triggerAiAnalysis(index);\n  }\n  return Promise.resolve();", js)

# 3. Update runAnalysisOnAllStudents to be async and support progress bar sequential run
run_all_old = """function runAnalysisOnAllStudents(forceAi = false) {
  state.students.forEach((_, idx) => {
    runAnalysisOnStudent(idx, forceAi);
  });
  saveStudentsToStorage();
  updateDashboardStats();
  
  // 일괄 분석 완료 후 에디터 내 학생 리스트 드롭다운도 갱신
  updateEditorFilterDropdowns();
  renderEditorStudentList();
}"""

run_all_new = """async function runAnalysisOnAllStudents(forceAi = false) {
  const isAiActive = forceAi && state.settings.aiEnabled && state.settings.aiKey;
  
  if (isAiActive) {
    showLoadingOverlay("AI 분석 준비 중...");
    const total = state.students.length;
    let success = 0;
    let fail = 0;
    
    for (let idx = 0; idx < total; idx++) {
      showLoadingOverlay(`AI 점검 진행 중... (${idx + 1}/${total})`);
      try {
        await runAnalysisOnStudent(idx, true);
        success++;
      } catch (e) {
        console.error(`Student ${idx} AI Analysis failed:`, e);
        fail++;
      }
    }
    hideLoadingOverlay();
    showToast(`AI 분석 완료 (성공: ${success}명, 실패: ${fail}명)`);
  } else {
    state.students.forEach((_, idx) => {
      runAnalysisOnStudent(idx, false);
    });
  }
  
  saveStudentsToStorage();
  updateDashboardStats();
  updateEditorFilterDropdowns();
  renderEditorStudentList();
}"""

# If the run_all_old replacement fails due to comments, let's make it robust
if run_all_old not in js:
    # Use regex
    pattern_run_all = r"function\s+runAnalysisOnAllStudents\(forceAi\s*=\s*false\)\s*\{[\s\S]*?renderEditorStudentList\(\);\s*\}"
    js = re.sub(pattern_run_all, run_all_new, js)
else:
    js = js.replace(run_all_old, run_all_new)

# 4. Make DOM.btnInspectAllNav click handler call runAnalysisOnAllStudents(true) and wait
btn_click_old = """  DOM.btnInspectAllNav.addEventListener('click', () => {
    if (state.students.length === 0) {
      showToast('분석할 학생 데이터를 먼저 추가해 주세요.');
      return;
    }
    runAnalysisOnAllStudents();
    showToast('모든 학생 데이터 분석이 완료되었습니다!');
    // 분석 후 바로 에디터로 탭 이동
    if (state.students.length > 0) {
      state.currentStudentIndex = 0;
      loadStudentIntoEditor(0);
    }
    switchTab('student-group-view');
  });"""

btn_click_new = """  DOM.btnInspectAllNav.addEventListener('click', async () => {
    if (state.students.length === 0) {
      showToast('분석할 학생 데이터를 먼저 추가해 주세요.');
      return;
    }
    await runAnalysisOnAllStudents(true);
    // 분석 후 바로 에디터로 탭 이동
    if (state.students.length > 0) {
      state.currentStudentIndex = 0;
      loadStudentIntoEditor(0);
    }
    switchTab('student-group-view');
  });"""

# Use regex for btnClick to handle any minor whitespace differences
if btn_click_old not in js:
    pattern_btn = r"DOM\.btnInspectAllNav\.addEventListener\('click',\s*(?:async\s*)?\(\)\s*=>\s*\{[\s\S]*?switchTab\('student-group-view'\);\s*\}\);"
    js = re.sub(pattern_btn, btn_click_new, js)
else:
    js = js.replace(btn_click_old, btn_click_new)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(js)
print("Bulk AI logic updated in app.js")
