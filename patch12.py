import os

html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

html = html.replace('placeholder="AI Studio에서 발급받은 API 키를 입력하세요">', 'placeholder="AI Studio에서 발급받은 API 키를 입력하세요">')

# Let's use re to be safe in case there's broken encodings
import re
html = re.sub(r'placeholder="([^"]+?)>', r'placeholder="\1">', html)

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Patch 12 applied")
