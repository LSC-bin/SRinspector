import os

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i in range(len(lines)):
    if "const studKey = \\_\\;" in lines[i]:
        lines[i] = "  const studKey = ${stud.sNum || '학번없음'}_;\n"
    if 'querySelector(\.editor-student-item[data-student-key="\"]\);' in lines[i]:
        lines[i] = "  const item = DOM.editorStudentListContainer.querySelector(.editor-student-item[data-student-key=\"\"]);\n"

with open(app_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("Patch 4 applied successfully.")
