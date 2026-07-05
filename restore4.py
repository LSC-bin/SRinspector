import os
import json

recovery_path = "C:/Users/82102/Desktop/workspace/SRinspector/recovery_utf8.txt"
with open(recovery_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

gemini_html = None
for line in lines:
    if '<!-- Google Gemini AI API' in line and '"ReplacementContent":"' in line:
        try:
            data = json.loads(line)
            for tc in data.get("tool_calls", []):
                if tc.get("name") == "replace_file_content" or tc.get("name") == "multi_replace_file_content":
                    rc = tc.get("args", {}).get("ReplacementContent", "")
                    if '<!-- Google Gemini AI API' in rc:
                        gemini_html = rc
        except:
            pass

# Also check for write_to_file or similar if not found
if not gemini_html:
    # Just do a rough extraction
    for line in lines:
        if '<!-- Google Gemini AI API' in line:
            # We can find the snippet in the line manually
            idx = line.find('<!-- Google Gemini AI API')
            # It's usually inside a JSON string, so we can just grab the whole block if needed.

print("Found Gemini HTML length:", len(gemini_html) if gemini_html else 0)
if gemini_html:
    print(gemini_html[:200])
