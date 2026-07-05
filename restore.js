// 이름 마스킹 비식별화 유틸리티
function maskStudentName(text, studentName) {
  if (!text || !studentName) return text;
  
  // 이름이 3글자 이상(예: 김서준)이면 성을 제외한 이름(서준)도 함께 마스킹 대상으로 지정
  const namesToMask = [studentName];
  if (studentName.length >= 3) {
    namesToMask.push(studentName.substring(1));
  }
  
  let maskedText = text;
  namesToMask.forEach(name => {
    // 특수문자 이스케이프 후 전역 매치 정규식 생성
    const escapedName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(escapedName, 'g');
    maskedText = maskedText.replace(regex, '[이 학생]');
  });
  
  return maskedText;
}

// AI 검출 단어를 본래 텍스트 인덱스로 역복원하여 로컬 오류 데이터 포맷으로 매핑
function mapAiErrorsToLocalFormat(aiErrors, originalText, maskedText, studentName) {
  const localErrors = [];
  if (!aiErrors || !Array.isArray(aiErrors)) return localErrors;

  aiErrors.forEach(err => {
    let orig = err.original;
    let repl = err.replace;
    if (!orig || !repl) return;
    
    // 만약 AI가 마스킹된 대명사([이 학생])를 교정 대상으로 리턴한 경우 역마스킹(이름으로 복원)
    if (orig.includes('[이 학생]')) {
      orig = orig.replace(/\[이 학생\]/g, studentName);
    }
    if (repl.includes('[이 학생]')) {
      repl = repl.replace(/\[이 학생\]/g, studentName);
    }
    
    // 원래 본문에서 이 오류 단어의 출현 위치(인덱스) 검색
    let startIdx = originalText.indexOf(orig);
    if (startIdx !== -1) {
      localErrors.push({
        type: err.type || 'spelling',
        label: err.type === 'forbidden' ? '기재 금지' : (err.type === 'endingStyle' ? '종결 어미' : '맞춤법/문맥'),
        start: startIdx,
        end: startIdx + orig.length,
        original: orig,
        replace: repl,
        reason: err.reason || 'AI 문맥 분석 기반 교정 제안'
      });
    }
  });
  
  return localErrors;
}

// Google Gemini API를 활용한 비동기 AI 문맥 분석 수행
async function fetchGeminiAiAnalysis(maskedText, studentName) {
  const apiKey = state.settings.aiKey;
  if (!apiKey) {
    console.warn("[AI 점검] API Key가 설정되어 있지 않습니다.");
    return [];
  }

  // 항상 v1beta와 gemini-1.5-flash 모델을 사용하여 권한 에러 회피 (x-goog-api-key 이슈 방지용 파라미터)
  const url = \https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=\\;
  
  const prompt = \
  당신은 대한민국 교육부의 생활기록부 기재 표준 지침을 준수하는 고정밀 맞춤법 및 기재 요령 위반 점검관입니다.
  다음 학생 세특 본문에서 아래 4가지 지침을 기준으로 오류를 정밀 분석해주세요:
  1. 한글 맞춤법, 띄어쓰기, 어색한 한국어 표현 교정
  2. 비표준어, 속어, 비속어, 격식 없는 구어체 감지
  3. 교육부 생기부 기재 금지 조항 위반 (교외 수상 실적, 공인어학시험, 구체적인 대학명 우회 언급 예: '신촌의 명문대', 부모 직업 간접 언급 예: '의사인 아버지를 따라')
  4. 본문 내 문장 종결 어미의 혼용 (현재형 '~한다'와 명사형 '~함'이 본문 내에서 섞여 일관성 없이 쓰였는지 탐색)

  [세특 본문]
  "\"

  출력은 반드시 다른 설명(인사말, 마크다운 코드블록 등) 없이 오직 아래 지정된 JSON 스키마를 만족하는 JSON 배열 포맷만 반환해야 합니다:
  [
    {
      "original": "오류어구(원문에 나타난 그대로의 부분 문자열)",
      "replace": "교정제안단어",
      "reason": "오류 판정 사유 및 점검 가이드라인",
      "type": "spelling" 또는 "forbidden" 또는 "endingStyle" 중 하나
    }
  ]
  \;

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
      console.error("[Gemini API 에러 응답 상세]", errData.error);
      throw new Error(\\: \\);
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
    showToast(\AI 분석 실패: \\);
    return [];
  }
}
