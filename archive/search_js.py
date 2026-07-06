with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "r", encoding="utf-8", errors="ignore") as f:
    js = f.read()

# Let's find any occurrences of Toast or 완료
for line in js.split("\n"):
    if "완료" in line or "완료되었습니다" in line or "분석" in line:
        print(line)
