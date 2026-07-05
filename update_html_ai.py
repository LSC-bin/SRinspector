import os

html_path = "C:/Users/82102/Desktop/workspace/SRinspector/index.html"
with open(html_path, "r", encoding="utf-8") as f:
    html = f.read()

feedback_block = """
                <!-- AI General Feedback Block -->
                <div id="ai-general-feedback" style="display: none; padding: 12px; margin: 12px 12px 0 12px; background-color: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color);">
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                    <i data-lucide="message-square" style="width: 14px; height: 14px; color: var(--color-primary);"></i>
                    <strong style="font-size: 13px; color: var(--text-primary);">AI 총평</strong>
                  </div>
                  <div id="ai-general-feedback-text" style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;"></div>
                </div>
"""

# Find where to inject in index.html
# We want it right under <div class="results-header">...</div> inside the right panel
target_header_end = """                  <button class="btn btn-primary" id="btn-apply-all-fixes" style="padding: 4px 8px; font-size: 12px;">
                    <i data-lucide="sparkles"></i>
                    <span>모든 제안 적용</span>
                  </button>
                </div>"""

idx = html.find(target_header_end)
if idx != -1:
    insert_pos = idx + len(target_header_end)
    if "ai-general-feedback" not in html:
        new_html = html[:insert_pos] + "\n" + feedback_block + html[insert_pos:]
        with open(html_path, "w", encoding="utf-8") as f:
            f.write(new_html)
        print("Injected feedback block into index.html")
    else:
        print("Feedback block already exists")
else:
    print("Could not find target in index.html")
