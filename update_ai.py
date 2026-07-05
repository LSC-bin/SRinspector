import os
import re

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    js = f.read()

# 1. Update triggerAiAnalysis
trigger_old = """  // 2. Gemini API 비동기 병렬 요청
  const rawAiErrors = await fetchGeminiAiAnalysis(maskedText, stud.name);

  // 3. AI 오류 결과를 로컬 인덱스 범위 포맷으로 복원
  const mappedAiErrors = mapAiErrorsToLocalFormat(rawAiErrors, origText, maskedText, stud.name);"""

trigger_new = """  // 2. Gemini API 비동기 병렬 요청
  const aiResult = await fetchGeminiAiAnalysis(maskedText, stud.name);
  const rawAiErrors = aiResult.errors || [];
  
  // 피드백 저장
  if (aiResult.feedback) {
    stud.aiFeedback = aiResult.feedback;
  }

  // 3. AI 오류 결과를 로컬 인덱스 범위 포맷으로 복원
  const mappedAiErrors = mapAiErrorsToLocalFormat(rawAiErrors, origText, maskedText, stud.name);"""
  
js = js.replace(trigger_old, trigger_new)

# Add re-render logic to triggerAiAnalysis
# We need to find the end of triggerAiAnalysis
end_trigger_old = """  // 6. 상태 아이콘 및 화면 업데이트 (백그라운드에서 완료되었으므로 화면 동기화)
  updateStudentListStatusIcon(index);"""

end_trigger_new = """  // 6. 상태 아이콘 및 화면 업데이트 (백그라운드에서 완료되었으므로 화면 동기화)
  updateStudentListStatusIcon(index);
  if (index === state.currentStudentIndex) {
    renderInspectionResults();
  }"""
js = js.replace(end_trigger_old, end_trigger_new)

# 2. Update fetchGeminiAiAnalysis prompt
prompt_old = """  출력은 반드시 다른 설명(마크다운 코드블록 등) 없이 오직 아래 지정된 JSON 스키마를 만족하는 JSON 배열 포맷으로 반환해야 합니다:
  [
    {
      "original": "오류문구(원문에서 있는 그대로의 부분문자열)",
      "replace": "교정제안단어",
      "reason": "오류 판정 이유 및 가이드라인",
      "type": "spelling" 또는 "forbidden" 또는 "endingStyle" 중 하나
    }
  ]"""

prompt_new = """  출력은 반드시 다른 설명(마크다운 코드블록 등) 없이 오직 아래 지정된 JSON 스키마를 만족하는 JSON 포맷으로 반환해야 합니다:
  {
    "feedback": "본문이 전반적으로 잘 작성되었는지, 아쉬운 점은 없는지 2~3문장으로 총평을 작성하세요. 잘했으면 칭찬하고, 못했으면 보완점을 알려주세요.",
    "errors": [
      {
        "original": "오류문구(원문에서 있는 그대로의 부분문자열)",
        "replace": "교정제안단어",
        "reason": "오류 판정 이유 및 가이드라인",
        "type": "spelling" 또는 "forbidden" 또는 "endingStyle" 중 하나
      }
    ]
  }"""
js = js.replace(prompt_old, prompt_new)

# 3. Update fetchGeminiAiAnalysis return
return_old = """    // 5. JSON 파싱
    let aiErrors;
    try {
      aiErrors = JSON.parse(responseText);
    } catch (e) {
      // 마크다운 백틱 제거 시도
      const match = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        aiErrors = JSON.parse(match[1]);
      } else {
        throw new Error("Invalid JSON format from Gemini");
      }
    }
    
    return Array.isArray(aiErrors) ? aiErrors : [];
  } catch (error) {"""

return_new = """    // 5. JSON 파싱
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      // 마크다운 백틱 제거 시도
      const match = responseText.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (match) {
        data = JSON.parse(match[1]);
      } else {
        throw new Error("Invalid JSON format from Gemini");
      }
    }
    
    let aiErrors = [];
    let aiFeedback = "";
    if (Array.isArray(data)) {
      aiErrors = data;
    } else if (data && typeof data === 'object') {
      aiErrors = data.errors || [];
      aiFeedback = data.feedback || "";
    }
    
    return { errors: Array.isArray(aiErrors) ? aiErrors : [], feedback: aiFeedback };
  } catch (error) {"""
js = js.replace(return_old, return_new)

# Also fix the empty array returns in fetchGeminiAiAnalysis
js = js.replace('console.warn("[AI 점검] API Key가 설정되어 있지 않습니다.");\n    return [];', 'console.warn("[AI 점검] API Key가 설정되어 있지 않습니다.");\n    return { errors: [], feedback: "" };')
js = js.replace("console.warn(\"[AI 점검] API Key가 유효하지 않거나 설정되지 않았습니다.\");\n    return [];", "console.warn(\"[AI 점검] API Key가 유효하지 않거나 설정되지 않았습니다.\");\n    return { errors: [], feedback: \"\" };")
js = js.replace("showToast(`AI 분석 실패: ${error.message || '네트워크 오류가 발생했습니다.'}`);\n    return [];", "showToast(`AI 분석 실패: ${error.message || '네트워크 오류가 발생했습니다.'}`);\n    return { errors: [], feedback: \"\" };")


# 4. Update renderInspectionResults to show the feedback
render_results_old = """function renderInspectionResults() {
  const list = DOM.inspectionResultsList;
  list.innerHTML = '';

  if (state.currentStudentIndex === -1) return;
  const stud = state.students[state.currentStudentIndex];"""

render_results_new = """function renderInspectionResults() {
  const list = DOM.inspectionResultsList;
  list.innerHTML = '';

  if (state.currentStudentIndex === -1) return;
  const stud = state.students[state.currentStudentIndex];
  
  const feedbackBlock = document.getElementById('ai-general-feedback');
  const feedbackText = document.getElementById('ai-general-feedback-text');
  if (feedbackBlock && feedbackText) {
    if (stud.aiFeedback) {
      feedbackBlock.style.display = 'block';
      feedbackText.innerText = stud.aiFeedback;
    } else {
      feedbackBlock.style.display = 'none';
      feedbackText.innerText = '';
    }
  }
"""
js = js.replace(render_results_old, render_results_new)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(js)
print("Updated app.js")
