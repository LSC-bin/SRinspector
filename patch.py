import os

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Read restored files
with open("C:/Users/82102/Desktop/workspace/SRinspector/restore.js", "r", encoding="utf-8") as f:
    restore1 = f.read()

with open("C:/Users/82102/Desktop/workspace/SRinspector/restore2.js", "r", encoding="utf-8") as f:
    restore2 = f.read()

# Replace runAnalysisOnStudent block
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if line.startswith("function runAnalysisOnStudent(index) {"):
        start_idx = i
        # find matching closing brace
        brace_count = 0
        for j in range(i, len(lines)):
            if "{" in lines[j]: brace_count += lines[j].count("{")
            if "}" in lines[j]: brace_count -= lines[j].count("}")
            if brace_count == 0:
                end_idx = j
                break
        break

if start_idx != -1 and end_idx != -1:
    lines = lines[:start_idx] + [restore2 + "\n"] + lines[end_idx+1:]

# Insert helper functions before escapeHTML
insert_idx = -1
for i, line in enumerate(lines):
    if line.startswith("function escapeHTML(str) {"):
        insert_idx = i
        break

if insert_idx != -1:
    lines = lines[:insert_idx] + [restore1 + "\n\n"] + lines[insert_idx:]

with open(app_path, "w", encoding="utf-8") as f:
    f.writelines(lines)

print("Patch applied successfully.")
