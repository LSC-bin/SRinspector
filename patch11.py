import os

css_path = "C:/Users/82102/Desktop/workspace/SRinspector/style.css"
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

new_css_rule2 = """
#subject-student-cards-container .group-student-card {
  min-width: 0;
}
#subject-student-cards-container .group-card-title,
#subject-student-cards-container .group-card-subtitle {
  white-space: normal;
  overflow-wrap: break-word;
  word-break: keep-all;
}
"""

if "min-width: 0;" not in css.split("#subject-student-cards-container .group-student-card")[1][:100]:
    css += new_css_rule2

with open(css_path, "w", encoding="utf-8") as f:
    f.write(css)

print("Patch 11 applied")
