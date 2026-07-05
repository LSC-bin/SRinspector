import os
import re

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    js = f.read()

# 1. Update triggerAiAnalysis to add detailed logs and call renderInspectionResults
trigger_old = """async function triggerAiAnalysis(index) {
  if (index < 0 || index >= state.students.length) return;
  const stud = state.students[index];
  const origText = stud.content;
  if (!origText) return;

  // 1. 개인정보 비식별화 마스크
  const maskedText = maskStudentName(origText, stud.name);

  // 2. Gemini API 비동기 병렬 요청
  const rawAiErrors = await fetchGeminiAiAnalysis(maskedText, stud.name);

  // 3. AI 오류 결과를 로컬 인덱스 범위 포맷으로 복원
  const mappedAiErrors = mapAiErrorsToLocalFormat(rawAiErrors, origText, maskedText, stud.name);"""

trigger_debug = """async function triggerAiAnalysis(index) {
  if (index < 0 || index >= state.students.length) return;
  const stud = state.students[index];
  const origText = stud.content;
  if (!origText) return;

  console.log(`[AI 진단] 학생 ${index + 1} (${stud.name}) AI 분석 시작`);

  // 1. 개인정보 비식별화 마스크
  const maskedText = maskStudentName(origText, stud.name);

  // 2. Gemini API 비동기 병렬 요청
  const aiResult = await fetchGeminiAiAnalysis(maskedText, stud.name);
  const rawAiErrors = aiResult.errors || [];
  
  if (aiResult.feedback) {
    stud.aiFeedback = aiResult.feedback;
    console.log(`[AI 진단] 학생 ${index + 1} 피드백 저장 완료: ${aiResult.feedback}`);
  }

  // 3. AI 오류 결과를 로컬 인덱스 범위 포맷으로 복원
  const mappedAiErrors = mapAiErrorsToLocalFormat(rawAiErrors, origText, maskedText, stud.name);"""

js = js.replace(trigger_old, trigger_debug)

# Add render logic at the end of triggerAiAnalysis
end_trigger_old = """  // 6. 상태 아이콘 및 화면 업데이트 (백그라운드에서 완료되었으므로 화면 동기화)
  updateStudentListStatusIcon(index);"""

end_trigger_debug = """  // 6. 상태 아이콘 및 화면 업데이트 (백그라운드에서 완료되었으므로 화면 동기화)
  updateStudentListStatusIcon(index);
  if (index === state.currentStudentIndex) {
    console.log(`[AI 진단] 현재 편집중인 학생의 화면을 갱신합니다.`);
    renderInspectionResults();
  }"""
js = js.replace(end_trigger_old, end_trigger_debug)

# 2. Update runAnalysisOnStudent to return the Promise
run_student_old = """  // Gemini AI 추가 분석 검사가 활성화되어 있고 API Key가 유효한 경우 백그라운드 비동기 요청 진행
  if (forceAi && state.settings.aiEnabled && state.settings.aiKey && stud.content) {
    triggerAiAnalysis(index);
  }"""

run_student_debug = """  // Gemini AI 추가 분석 검사가 활성화되어 있고 API Key가 유효한 경우 백그라운드 비동기 요청 진행
  if (forceAi && state.settings.aiEnabled && state.settings.aiKey && stud.content) {
    return triggerAiAnalysis(index);
  }
  return Promise.resolve();"""

js = js.replace(run_student_old, run_student_debug)

# 3. Update fetchGeminiAiAnalysis with detailed logs and new JSON schema
fetch_old = """async function fetchGeminiAiAnalysis(maskedText, studentName) {
  const apiKey = state.settings.aiKey;
  if (!apiKey) {
    console.warn("[AI 점검] API Key가 설정되어 있지 않습니다.");
    return [];
  }

  // 사용 가능한 최고의 모델 탐색 (최초 1회만 진행)
  const bestModel = await getBestAvailableModel(apiKey);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${bestModel}:generateContent?key=${apiKey}`;
  
  const prompt = `
  당신은 대한민국 교육부의 생활기록부 기재 요령 지침을 준수하는 고정밀 맞춤법 및 기재 요령 위반 점검관입니다.
  다음 학생 생특 본문에서 아래 4가지 지침을 기준으로 오류를 찾아 분석해주세요:
  1. 단순 맞춤법, 띄어쓰기, 어색한 한국어 표현 교정
  2. 비표준어, 비속어, 격식 없는 구어체 감지
  3. 교육부 생기부 기재 금지 조항 위반 (교외 수상 실적, 공인어학시험, 구체적인 특정 대학명 우회 언급 예: '신촌의 명문대', 부모 직업 간접 언급 예: '의사이신 아버지를 따라')
  4. 본문 내 문장 종결 어미 혼용 (현재형 '~한다'와 명사형 '~음/함'이 혼용된 것이 있는지 검색)

  [생특 본문]
  "${maskedText}"

  출력은 반드시 다른 설명(마크다운 코드블록 등) 없이 오직 아래 지정된 JSON 스키마를 만족하는 JSON 배열 포맷으로 반환해야 합니다:
  [
    {
      "original": "오류문구(원문에서 있는 그대로의 부분문자열)",
      "replace": "교정제안단어",
      "reason": "오류 판정 이유 및 가이드라인",
      "type": "spelling" 또는 "forbidden" 또는 "endingStyle" 중 하나
    }
  ]
  `;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error ? errData.error.message : 'HTTP 오류';
      const errStatus = errData.error ? errData.error.status : 'UNKNOWN';
      
      // 만약 모델을 찾을 수 없었다면 캐시 초기화 (다음 시도에 다시 검색)
      if (errStatus === 'NOT_FOUND') {
        cachedAiModel = null;
      }
      
      console.error("[Gemini API 러 응답 상세]", errData.error);
      throw new Error(`${errStatus}: ${errMsg}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      return [];
    }

    const jsonText = data.candidates[0].content.parts[0].text;
    const aiErrors = JSON.parse(jsonText);
    return Array.isArray(aiErrors) ? aiErrors : [];
  } catch (error) {
    console.error("[AI 에러 오류] Gemini API 요청 실패:", error);
    showToast(`AI 분석 실패: ${error.message || '네트워크 오류가 발생했습니다.'}`);
    return [];
  }
}"""

fetch_debug = """async function fetchGeminiAiAnalysis(maskedText, studentName) {
  const apiKey = state.settings.aiKey;
  if (!apiKey) {
    console.warn("[AI 점검] API Key가 설정되어 있지 않습니다.");
    return { errors: [], feedback: "" };
  }

  // 사용 가능한 최고의 모델 탐색 (최초 1회만 진행)
  const bestModel = await getBestAvailableModel(apiKey);
  console.log(`[AI 진단] 최종 선택된 AI 모델: ${bestModel}`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${bestModel}:generateContent?key=${apiKey}`;
  
  const prompt = `
  당신은 대한민국 교육부의 생활기록부 기재 요령 지침을 준수하는 고정밀 맞춤법 및 기재 요령 위반 점검관입니다.
  다음 학생 생특 본문에서 아래 4가지 지침을 기준으로 오류를 찾아 분석해주세요:
  1. 단순 맞춤법, 띄어쓰기, 어색한 한국어 표현 교정
  2. 비표준어, 비속어, 격식 없는 구어체 감지
  3. 교육부 생기부 기재 금지 조항 위반 (교외 수상 실적, 공인어학시험, 구체적인 특정 대학명 우회 언급 예: '신촌의 명문대', 부모 직업 간접 언급 예: '의사이신 아버지를 따라')
  4. 본문 내 문장 종결 어미 혼용 (현재형 '~한다'와 명사형 '~음/함'이 혼용된 것이 있는지 검색)

  [생특 본문]
  "${maskedText}"

  출력은 반드시 다른 설명(마크다운 코드블록 등) 없이 오직 아래 지정된 JSON 스키마를 만족하는 JSON 포맷으로 반환해야 합니다:
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
  }
  `;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  console.log(`[AI 진단] Gemini API 요청 전송 시작 (URL: ${url.split('?')[0]}?key=***)`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`[AI 진단] Gemini API 응답 받음 (상태 코드: ${response.status})`);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error ? errData.error.message : 'HTTP 오류';
      const errStatus = errData.error ? errData.error.status : 'UNKNOWN';
      
      if (errStatus === 'NOT_FOUND') {
        cachedAiModel = null;
      }
      
      console.error("[Gemini API 에러 응답 상세]", errData.error);
      throw new Error(`${errStatus}: ${errMsg}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      console.warn("[AI 진단] API 응답에 candidates가 없습니다.");
      return { errors: [], feedback: "" };
    }

    const jsonText = data.candidates[0].content.parts[0].text;
    console.log("[AI 진단] 수신된 raw JSON 텍스트:", jsonText);

    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (e) {
      const match = jsonText.match(/```(?:json)?\\n([\\s\\S]*?)\\n```/);
      if (match) {
        parsedData = JSON.parse(match[1]);
      } else {
        throw new Error("Invalid JSON format from Gemini");
      }
    }

    let aiErrors = [];
    let aiFeedback = "";
    if (Array.isArray(parsedData)) {
      aiErrors = parsedData;
    } else if (parsedData && typeof parsedData === 'object') {
      aiErrors = parsedData.errors || [];
      aiFeedback = parsedData.feedback || "";
    }

    console.log(`[AI 진단] 파싱 성공 (감지된 오류 수: ${aiErrors.length}, 피드백 길이: ${aiFeedback.length})`);
    return { errors: Array.isArray(aiErrors) ? aiErrors : [], feedback: aiFeedback };
  } catch (error) {
    console.error("[AI 진단] Gemini API 요청 중 예외 발생:", error);
    showToast(`AI 분석 실패: ${error.message || '네트워크 오류가 발생했습니다.'}`);
    return { errors: [], feedback: "" };
  }
}"""

js = js.replace(fetch_old, fetch_debug)

# If standard replace didn't work (due to comment spacing), use regex
if fetch_debug not in js:
    # Pattern to match fetchGeminiAiAnalysis
    pattern_fetch = r"async function fetchGeminiAiAnalysis\(maskedText,\s*studentName\)[\s\S]*?escapeHTML\(str\)"
    # We will replace it but keep escapeHTML
    js = re.sub(pattern_fetch, fetch_debug + "\n\nfunction escapeHTML(str)", js)

# 4. Update getBestAvailableModel to log chosen model when preferences fail
model_old = """    // 선호 모델이 없으면 아무거나 첫번째 사용
    if (supported.length > 0) {
      cachedAiModel = supported[0];
      return cachedAiModel;
    }"""

model_new = """    // 선호 모델이 없으면 아무거나 첫번째 사용
    if (supported.length > 0) {
      cachedAiModel = supported[0];
      console.log("[AI 진단] 선호 목록 외 대체 모델 선택 완료: ", cachedAiModel);
      return cachedAiModel;
    }"""
js = js.replace(model_old, model_new)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(js)
print("Debug patches applied to app.js")
