import os
import json

log_path = r"C:\Users\82102\.gemini\antigravity\brain\02e46803-dbc9-49ea-a840-1dd34db1d55c\.system_generated\logs\transcript_full.jsonl"
with open(log_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in reversed(lines):
    if "updateEditorFilterDropdowns" in line and "function" in line:
        if "CommandLine" in line or "Set-Content" in line or "patch_" in line or "recover_" in line:
            continue
        try:
            data = json.loads(line)
            # Print the content/tool call values
            print("Step:", data.get("step_index"))
            # Let's write the whole line to a file for analysis
            with open("C:/Users/82102/Desktop/workspace/SRinspector/editor_funcs_debug.txt", "w", encoding="utf-8") as f_out:
                f_out.write(line)
            print("Wrote debug log")
            exit(0)
        except Exception as e:
            print("Err", e)

print("Not found")
