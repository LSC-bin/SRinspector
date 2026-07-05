import os
import re

html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

# I am replacing ANY missing quote in placeholder="..." > with placeholder="..." >
# The broken string is exactly: placeholder="AI Studio에서 발급받은 API 키를 입력하세요">
html = html.replace('placeholder="AI Studio에서 발급받은 API 키를 입력하세요">', 'placeholder="AI Studio에서 발급받은 API 키를 입력하세요">') # Wait! I did it again!

# Ok, let's write it carefully
bad_string = 'placeholder="AI Studio에서 발급받은 API 키를 입력하세요">'
good_string = 'placeholder="AI Studio에서 발급받은 API 키를 입력하세요">' # STILL wrong in my brain!

# What I WANT is: placeholder="[text]">
# What I HAVE is: placeholder="[text]>
# I need to insert a quote BEFORE the >

html = html.replace('placeholder="AI Studio에서 발급받은 API 키를 입력하세요">', 'placeholder="AI Studio에서 발급받은 API 키를 입력하세요" >')

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html)

print("Patch 13 applied")
