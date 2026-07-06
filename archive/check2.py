import os

html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
with open(html_path, "rb") as f:
    content = f.read()
    idx = content.find(b'placeholder="AI Studio')
    if idx == -1:
        idx = content.find(b'setting-ai-key')
    print(content[idx:idx+200])
