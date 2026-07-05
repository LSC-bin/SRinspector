with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "r", encoding="utf-8") as f:
    js = f.read()

m1 = js.find("updateStudentListStatusIcon(index);")
m2 = js.find("updateStudentListStatusIcon(index)")
print("With semicolon:", m1)
print("Without semicolon:", m2)
