import chardet

with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "rb") as f:
    raw = f.read(10000)
    print(chardet.detect(raw))
