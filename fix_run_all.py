import os

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    js = f.read()

# Find start of runAnalysisOnAllStudents
start_idx = js.find("function runAnalysisOnAllStudents()")
# Find the next function definition after it
end_idx = js.find("function ", start_idx + len("function runAnalysisOnAllStudents()"))

if start_idx != -1 and end_idx != -1:
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
}

"""
    js = js[:start_idx] + run_all_new + js[end_idx:]
    print("Replaced runAnalysisOnAllStudents successfully!")
else:
    print("Failed to find indices", start_idx, end_idx)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(js)
print("Updated app.js")
