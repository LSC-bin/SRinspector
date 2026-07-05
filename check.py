import os
import base64

html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
with open(html_path, "rb") as f:
    content = f.read()
    idx = content.find(b'setting-ai-key')
    print(content[idx:idx+300].decode('utf-8', errors='replace'))
