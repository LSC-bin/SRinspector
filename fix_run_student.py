import os

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    js = f.read()

# Find the start of runAnalysisOnStudent
start_idx = js.find("function runAnalysisOnStudent")
# Find the next function keyword after it
end_idx = js.find("function ", start_idx + len("function runAnalysisOnStudent"))

if start_idx != -1 and end_idx != -1:
    new_run_student = """function runAnalysisOnStudent(index, forceAi = false) {
  if (index < 0 || index >= state.students.length) return;
  const stud = state.students[index];
  
  const customConfig = {
    ...state.settings,
    customDictionary: state.customDictionary
  };
  
  const rawErrors = window.inspectStudentRecord(stud.content, stud.name, customConfig);
  
  stud.ignoredWords = stud.ignoredWords || [];
  stud.errors = rawErrors.filter(err => !stud.ignoredWords.includes(err.original));
  stud.checked = true;

  updateStudentListStatusIcon(index);

  if (forceAi && state.settings.aiEnabled && state.settings.aiKey && stud.content) {
    return triggerAiAnalysis(index);
  }
  return Promise.resolve();
}

"""
    js = js[:start_idx] + new_run_student + js[end_idx:]
    print("Replaced runAnalysisOnStudent successfully!")
else:
    print("Failed to find indices", start_idx, end_idx)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(js)
print("Updated app.js")
