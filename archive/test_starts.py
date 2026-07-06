with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "r", encoding="utf-8") as f:
    js = f.read()

idx1 = js.find("function runAnalysisOnStudent")
idx2 = js.find("function runAnalysisOnAllStudents")
idx3 = js.find("function updateStudentListStatusIcon")

print("runAnalysisOnStudent:", idx1)
print("runAnalysisOnAllStudents:", idx2)
print("updateStudentListStatusIcon:", idx3)
