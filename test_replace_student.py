with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "r", encoding="utf-8") as f:
    js = f.read()

stud_start = js.find("function runAnalysisOnStudent")
print("stud_start:", stud_start)
stud_marker = js.find("updateStudentListStatusIcon(index);", stud_start)
print("stud_marker:", stud_marker)
stud_end = js.find("}", stud_marker) + 1 if stud_marker != -1 else -1
print("stud_end:", stud_end)

if stud_start != -1 and stud_end != -1:
    print("Replacing...")
else:
    print("Cannot replace")
