import os

head_path = "C:/Users/82102/Desktop/workspace/SRinspector/HEAD_index.html"
with open(head_path, "r", encoding="utf-16") as f:
    html = f.read()

idx = html.find("Gemini API")
if idx != -1:
    print(html[idx-100:idx+300])
else:
    print("Not found in HEAD")
