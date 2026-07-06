with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "rb") as f:
    raw = f.read()

# Let's decode with cp949 and handle errors
js_cp949 = raw.decode("cp949", errors="ignore")

for line in js_cp949.split("\n"):
    if "완료" in line or "완료되었습니다" in line or "분석" in line or "toast" in line.lower():
        print(line)
