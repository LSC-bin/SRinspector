import os

css_path = "C:/Users/82102/Desktop/workspace/SRinspector/style.css"
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

new_css_rule = """
#subject-student-cards-container .group-card-desc {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: keep-all;
  overflow-wrap: break-word;
  line-height: 1.5;
  margin-top: 6px;
}
"""

if "#subject-student-cards-container .group-card-desc" not in css:
    css += new_css_rule

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Patch 10 applied")
