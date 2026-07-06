import os

css_path = "C:/Users/82102/Desktop/workspace/SRinspector/style.css"
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

# Replace fastly.jsdelivr.net with cdn.jsdelivr.net
css = css.replace("https://fastly.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumSquareRound.css", "https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_two@1.0/NanumSquareRound.css")

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Patch 14 applied")
