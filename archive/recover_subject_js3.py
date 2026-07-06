import os
import json

log_path = r"C:\Users\82102\.gemini\antigravity\brain\02e46803-dbc9-49ea-a840-1dd34db1d55c\.system_generated\logs\transcript_full.jsonl"
with open(log_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for line in reversed(lines):
    if "function parseGradeClassNumberFromSNum" in line:
        if "CommandLine" in line or "Set-Content" in line or "patch_" in line or "recover_" in line:
            continue
        try:
            data = json.loads(line)
            # print step index
            step = data.get("step_index")
            print("Found function definition in step:", step)
            for tc in data.get("tool_calls", []):
                args = tc.get("args", {})
                rc = args.get("ReplacementContent", "")
                if "parseGradeClassNumberFromSNum" in rc:
                    with open("C:/Users/82102/Desktop/workspace/SRinspector/parse_snum_extracted.txt", "w", encoding="utf-8") as f_out:
                        f_out.write(rc)
                    print("Wrote definition from ReplacementContent!")
                    exit(0)
                cc = args.get("CodeContent", "")
                if "parseGradeClassNumberFromSNum" in cc:
                    with open("C:/Users/82102/Desktop/workspace/SRinspector/parse_snum_extracted.txt", "w", encoding="utf-8") as f_out:
                        f_out.write(cc)
                    print("Wrote definition from CodeContent!")
                    exit(0)
        except Exception as e:
            pass

print("Not found")
