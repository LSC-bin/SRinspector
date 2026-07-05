import os
import json

log_path = r"C:\Users\82102\.gemini\antigravity\brain\02e46803-dbc9-49ea-a840-1dd34db1d55c\.system_generated\logs\transcript_full.jsonl"
with open(log_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(reversed(lines)):
    if "getBestAvailableModel" in line:
        # Just check what is in the line
        print(f"Index {len(lines)-1-i}: length={len(line)}, has_cmd={'CommandLine' in line}")
        # Print a snippet of it
        idx = line.find("getBestAvailableModel")
        print(repr(line[idx-50:idx+150]))
