import os
import json
import re

log_path = r"C:\Users\82102\.gemini\antigravity\brain\02e46803-dbc9-49ea-a840-1dd34db1d55c\.system_generated\logs\transcript_full.jsonl"
with open(log_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in lines:
    if '<!-- Google Gemini AI API' in line:
        try:
            data = json.loads(line)
            # if it's a tool call
            if "tool_calls" in data:
                for tc in data["tool_calls"]:
                    args = tc.get("args", {})
                    if "ReplacementContent" in args and '<!-- Google Gemini AI API' in args["ReplacementContent"]:
                        print(args["ReplacementContent"])
                        exit(0)
                    if "ReplacementChunks" in args:
                        import ast
                        chunks = ast.literal_eval(args["ReplacementChunks"])
                        for chunk in chunks:
                            if '<!-- Google Gemini AI API' in chunk.get("ReplacementContent", ""):
                                print(chunk["ReplacementContent"])
                                exit(0)
        except Exception as e:
            print("Error parsing json", e)
            
# fallback rough extract
for line in lines:
    if '<!-- Google Gemini AI API' in line:
        matches = re.findall(r'<!-- Google Gemini AI API.*?(?:</div>\s*</div>)', line, flags=re.DOTALL)
        if matches:
            print("Found via regex:")
            print(matches[-1])
            exit(0)
