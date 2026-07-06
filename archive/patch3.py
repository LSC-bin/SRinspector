import os

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    code = f.read()

code = code.replace("const studKey = \\_\\;", "const studKey = \${stud.sNum || '학번없음'}_\;")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Patch 3 applied successfully.")
