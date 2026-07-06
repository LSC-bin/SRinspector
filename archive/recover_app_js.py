import os
import json
import re

log_path = r"C:\Users\82102\.gemini\antigravity\brain\02e46803-dbc9-49ea-a840-1dd34db1d55c\.system_generated\logs\transcript_full.jsonl"
with open(log_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# We want to find the tool calls where we edited app.js or read app.js
# and extract the code for fetchGeminiAiAnalysis, triggerAiAnalysis, getBestAvailableModel, etc.

# Let's search backward to find the last time app.js was modified or read before git checkout.
# The checkout was in step ~1500 or so. Let's look for replacements in app.js.
for line in reversed(lines):
    if "app.js" in line and ("ReplacementContent" in line or "CodeContent" in line):
        try:
            data = json.loads(line)
            for tc in data.get("tool_calls", []):
                args = tc.get("args", {})
                if "app.js" in args.get("TargetFile", "") or "app.js" in args.get("TargetFile", ""):
                    rc = args.get("ReplacementContent", "")
                    if "fetchGeminiAiAnalysis" in rc:
                        print("FOUND ReplacementContent:")
                        print(rc[:1000])
                        print("...")
        except:
            pass

# Also look for grep or select-string outputs in transcript
for line in reversed(lines):
    if "fetchGeminiAiAnalysis" in line and "Stdout" in line:
        try:
            data = json.loads(line)
            content = data.get("content", "")
            if "fetchGeminiAiAnalysis" in content:
                print("FOUND in stdout/content:")
                print(content[:1000])
        except:
            pass
