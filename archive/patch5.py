import os

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    code = f.read()

# Replace fetchGeminiAiAnalysis
new_fetch_func = """
// 모델 자동 탐색 및 캐싱
let cachedAiModel = null;
async function getBestAvailableModel(apiKey) {
  if (cachedAiModel) return cachedAiModel;
  
  try {
    const listUrl = https://generativelanguage.googleapis.com/v1beta/models?key=;
    const res = await fetch(listUrl);
    if (!res.ok) {
      console.warn("모델 리스트 가져오기 실패:", await res.text());
      // 폴백: 리스트를 못가져와도 기본 모델 반환
      return 'gemini-1.5-flash';
    }
    const data = await res.json();
    const models = data.models || [];
    
    // 지원되는 모델 필터링
    const supported = models.filter(m => 
      m.supportedGenerationMethods && 
      m.supportedGenerationMethods.includes('generateContent')
    ).map(m => m.name.replace('models/', ''));
    
    console.log("[AI 진단] 사용 가능한 모델 목록:", supported);
    
    // 선호도 순서
    const preferences = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.0-pro', 'gemini-pro'];
    
    for (const pref of preferences) {
      if (supported.includes(pref)) {
        cachedAiModel = pref;
        console.log("[AI 진단] 최적의 모델 선택됨:", cachedAiModel);
        return cachedAiModel;
      }
    }
    
    // 선호 모델이 없으면 아무거나 첫번째 사용
    if (supported.length > 0) {
      cachedAiModel = supported[0];
      return cachedAiModel;
    }
    
    return 'gemini-1.5-flash';
  } catch(e) {
    console.error("모델 탐색 에러", e);
    return 'gemini-1.5-flash';
  }
}

// Google Gemini API를 활용한 비동기 AI 문맥 분석 수행
async function fetchGeminiAiAnalysis(maskedText, studentName) {
  const apiKey = state.settings.aiKey;
  if (!apiKey) {
    console.warn("[AI 점검] API Key가 설정되어 있지 않습니다.");
    return [];
  }

  // 사용 가능한 최적의 모델 탐색 (최초 1회만 실행됨)
  const bestModel = await getBestAvailableModel(apiKey);

  const url = https://generativelanguage.googleapis.com/v1beta/models/:generateContent?key=;
  
  const prompt = 
  당신은 대한민국 교육부의 생활기록부 기재 표준 지침을 준수하는 고정밀 맞춤법 및 기재 요령 위반 점검관입니다.
  다음 학생 세특 본문에서 아래 4가지 지침을 기준으로 오류를 정밀 분석해주세요:
  1. 한글 맞춤법, 띄어쓰기, 어색한 한국어 표현 교정
  2. 비표준어, 속어, 비속어, 격식 없는 구어체 감지
  3. 교육부 생기부 기재 금지 조항 위반 (교외 수상 실적, 공인어학시험, 구체적인 대학명 우회 언급 예: '신촌의 명문대', 부모 직업 간접 언급 예: '의사인 아버지를 따라')
  4. 본문 내 문장 종결 어미의 혼용 (현재형 '~한다'와 명사형 '~함'이 본문 내에서 섞여 일관성 없이 쓰였는지 탐색)

  [세특 본문]
  ""

  출력은 반드시 다른 설명(인사말, 마크다운 코드블록 등) 없이 오직 아래 지정된 JSON 스키마를 만족하는 JSON 배열 포맷만 반환해야 합니다:
  [
    {
      "original": "오류어구(원문에 나타난 그대로의 부분 문자열)",
      "replace": "교정제안단어",
      "reason": "오류 판정 사유 및 점검 가이드라인",
      "type": "spelling" 또는 "forbidden" 또는 "endingStyle" 중 하나
    }
  ]
  ;

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
      
      // 만약 모델을 찾을 수 없었다면 캐시 초기화 (다음 시도때 다시 탐색)
      if (errStatus === 'NOT_FOUND') {
        cachedAiModel = null;
      }
      
      console.error("[Gemini API 에러 응답 상세]", errData.error);
      throw new Error(${errStatus}: );
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      return [];
    }

    const jsonText = data.candidates[0].content.parts[0].text;
    const aiErrors = JSON.parse(jsonText);
    return Array.isArray(aiErrors) ? aiErrors : [];
  } catch (error) {
    console.error("[AI 점검 오류] Gemini API 요청 실패:", error);
    showToast(AI 분석 실패: );
    return [];
  }
}
"""

import re
old_fetch_pattern = r"// Google Gemini API를 활용한 비동기 AI 문맥 분석 수행\nasync function fetchGeminiAiAnalysis[\s\S]*?(?=\nfunction escapeHTML)"
code = re.sub(old_fetch_pattern, new_fetch_func, code, count=1)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Patch 5 applied successfully.")
