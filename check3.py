import os
html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()
idx = html.find('setting-ai-key')
print(html[idx:idx+350])
