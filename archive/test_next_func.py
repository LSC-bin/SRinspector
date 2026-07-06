with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "r", encoding="utf-8") as f:
    js = f.read()

start_idx = js.find("function runAnalysisOnAllStudents")
next_func = js.find("function ", start_idx + len("function runAnalysisOnAllStudents"))
print("runAnalysisOnAllStudents start:", start_idx)
print("Next function start:", next_func)
if next_func != -1:
    print(js[next_func:next_func+100])
