import os

main_path = "C:/Users/82102/Desktop/workspace/SRinspector/main.js"
with open(main_path, "r", encoding="utf-8") as f:
    main_js = f.read()

main_js = main_js.replace("// mainWindow.webContents.openDevTools();", "mainWindow.webContents.openDevTools();")

with open(main_path, "w", encoding="utf-8") as f:
    f.write(main_js)

print("DevTools enabled")
