import os

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    js = f.read()

js = js.replace("# AI 점검 관련 전역 제어 변수", "// AI 점검 관련 전역 제어 변수")

with open(app_path, "w", encoding="utf-8") as f:
    f.write(js)
print("Syntax fixed")
