with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "r", encoding="utf-8") as f:
    js = f.read()

stud_start = js.find("function runAnalysisOnStudent")
print("stud_start:", stud_start)
if stud_start != -1:
    print(js[stud_start:stud_start+100])
    stud_marker = js.find("updateStudentListStatusIcon(index)", stud_start)
    print("stud_marker:", stud_marker)
    if stud_marker != -1:
        print(js[stud_marker:stud_marker+100])
        stud_end = js.find("}", stud_marker)
        print("stud_end:", stud_end)
