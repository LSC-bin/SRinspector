with open("C:/Users/82102/Desktop/workspace/SRinspector/app.js", "r", encoding="utf-8") as f:
    js = f.read()

idx = js.find("DOM.btnInspectAllNav.addEventListener")
if idx != -1:
    print(js[idx:idx+500])
else:
    print("Not found")
