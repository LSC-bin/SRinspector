import os

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    js = f.read()

# Find the start of btnInspectAllNav click handler
start_idx = js.find("DOM.btnInspectAllNav.addEventListener('click'")
# Find the start of btnExportExcel click handler which is right after it
end_idx = js.find("DOM.btnExportExcel.addEventListener('click'", start_idx)

if start_idx != -1 and end_idx != -1:
    btn_click_new = """DOM.btnInspectAllNav.addEventListener('click', async () => {
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
  });
  """
    js = js[:start_idx] + btn_click_new + js[end_idx:]
    print("Replaced btnInspectAllNav click handler successfully!")
else:
    print("Failed to find indices", start_idx, end_idx)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(js)
print("Updated app.js")
