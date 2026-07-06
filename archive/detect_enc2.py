try:
    with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "r", encoding="utf-8") as f:
        f.read()
    print("UTF-8 works perfectly!")
except UnicodeDecodeError:
    try:
        with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "r", encoding="cp949") as f:
            f.read()
        print("CP949 works!")
    except Exception as e:
        print("CP949 failed:", e)
