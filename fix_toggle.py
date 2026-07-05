import os

html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# Replace setting-ai-enabled with setting-aiEnabled
html = html.replace('id="setting-ai-enabled"', 'id="setting-aiEnabled"')

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Toggle ID fixed in index.html")
