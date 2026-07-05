import os
import re

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    js = f.read()

# 1. Update runAnalysisOnStudent to hook triggerAiAnalysis
# Let's locate runAnalysisOnStudent
# In HEAD, it is:
#   // 좌측 배지 표시 여부 업데이트
#   updateStudentListStatusIcon(index);
# }
# Wait, we want to add the Gemini call.
run_student_old = """  // 좌측 배지 표시 여부 업데이트
  updateStudentListStatusIcon(index);
}"""

run_student_new = """  // 좌측 배지 표시 여부 업데이트
  updateStudentListStatusIcon(index);

  // Gemini AI 추가 분석 검사가 활성화되어 있고 API Key가 유효한 경우 백그라운드 비동기 요청 진행
  if (forceAi && state.settings.aiEnabled && state.settings.aiKey && stud.content) {
    return triggerAiAnalysis(index);
  }
  return Promise.resolve();
}"""

js = js.replace(run_student_old, run_student_new)

# 2. Update runAnalysisOnAllStudents to be async and support progress bar sequential run
run_all_old = """function runAnalysisOnAllStudents(forceAi = false) {
  state.students.forEach((_, idx) => {
    runAnalysisOnStudent(idx, forceAi);
  });
  saveStudentsToStorage();
  updateDashboardStats();
  
  // 일괄 분석 완료 후 에디터 내 학생 리스트 드롭다운도 갱신
  updateEditorFilterDropdowns();
  renderEditorStudentList();
}"""

run_all_new = """async function runAnalysisOnAllStudents(forceAi = false) {
  const isAiActive = forceAi && state.settings.aiEnabled && state.settings.aiKey;
  
  if (isAiActive) {
    showLoadingOverlay("AI 분석 준비 중...");
    const total = state.students.length;
    let success = 0;
    let fail = 0;
    
    for (let idx = 0; idx < total; idx++) {
      showLoadingOverlay(`AI 점검 진행 중... (${idx + 1}/${total})`);
      try {
        await runAnalysisOnStudent(idx, true);
        success++;
      } catch (e) {
        console.error(`Student ${idx} AI Analysis failed:`, e);
        fail++;
      }
    }
    hideLoadingOverlay();
    showToast(`AI 분석 완료 (성공: ${success}명, 실패: ${fail}명)`);
  } else {
    state.students.forEach((_, idx) => {
      runAnalysisOnStudent(idx, false);
    });
  }
  
  saveStudentsToStorage();
  updateDashboardStats();
  updateEditorFilterDropdowns();
  renderEditorStudentList();
}"""

js = js.replace(run_all_old, run_all_new)

# 3. Update DOM.btnInspectAllNav click handler
btn_click_old = """  DOM.btnInspectAllNav.addEventListener('click', () => {
    if (state.students.length === 0) {
      showToast('분석할 학생 데이터를 먼저 추가해 주세요.');
      return;
    }
    runAnalysisOnAllStudents();
    showToast('모든 학생 데이터 분석이 완료되었습니다!');
    // 분석 후 바로 에디터로 탭 이동
    if (state.students.length > 0) {
      state.currentStudentIndex = 0;
      loadStudentIntoEditor(0);
    }
    switchTab('student-group-view');
  });"""

btn_click_new = """  DOM.btnInspectAllNav.addEventListener('click', async () => {
    if (state.students.length === 0) {
      showToast('분석할 학생 데이터를 먼저 추가해 주세요.');
      return;
    }
    await runAnalysisOnAllStudents(true);
    // 분석 후 바로 에디터로 탭 이동
    if (state.students.length > 0) {
      state.currentStudentIndex = 0;
      loadStudentIntoEditor(0);
    }
    switchTab('student-group-view');
  });"""

js = js.replace(btn_click_old, btn_click_new)

# 4. Insert all AI functions right before escapeHTML
ai_functions = """
// ----------------------------------------------------
# AI 점검 관련 전역 제어 변수
const aiControl = {
  abortController: null,
  debounceTimer: null
};

// 1) 캐시용 변수
let cachedAiModel = null;

// 2) 가용한 최적의 모델 반환
async function getBestAvailableModel(apiKey) {
  if (cachedAiModel) return cachedAiModel;
  
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const res = await fetch(listUrl);
    if (!res.ok) {
      console.warn("[AI 진단] 모델 리스트 획득 실패, 기본값(gemini-1.5-flash) 사용:", await res.text());
      return 'gemini-1.5-flash';
    }
    const data = await res.json();
    const models = data.models || [];
    
    const supported = models.filter(m => 
      m.supportedGenerationMethods && 
      m.supportedGenerationMethods.includes('generateContent')
    ).map(m => m.name.replace('models/', ''));
    
    console.log("[AI 진단] 가용한 모델 목록:", supported);
    
    const preferences = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-1.5-pro-latest', 'gemini-1.0-pro', 'gemini-pro'];
    
    for (const pref of preferences) {
      if (supported.includes(pref)) {
        cachedAiModel = pref;
        console.log("[AI 진단] 선호 모델 선택 완료:", cachedAiModel);
        return cachedAiModel;
      }
    }
    
    if (supported.length > 0) {
      cachedAiModel = supported[0];
      console.log("[AI 진단] 선호 목록 외 대체 모델 선택 완료:", cachedAiModel);
      return cachedAiModel;
    }
    
    return 'gemini-1.5-flash';
  } catch(e) {
    console.error("[AI 진단] 모델 탐색 중 에러 발생, 기본값 사용:", e);
    return 'gemini-1.5-flash';
  }
}

// 3) Gemini API 요청 수행
async function fetchGeminiAiAnalysis(maskedText, studentName) {
  const apiKey = state.settings.aiKey;
  if (!apiKey) {
    console.warn("[AI 점검] API Key가 설정되어 있지 않습니다.");
    return { errors: [], feedback: "" };
  }

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
}

// 4) triggerAiAnalysis 함수 정의
async function triggerAiAnalysis(index) {
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
  const mappedAiErrors = mapAiErrorsToLocalFormat(rawAiErrors, origText, maskedText, stud.name);

  // 4. 기존 로컬 오류 목록과 병합 (중복 방지)
  mappedAiErrors.forEach(aiErr => {
    const isDuplicate = stud.errors.some(localErr => localErr.start === aiErr.start && localErr.end === aiErr.end);
    if (!isDuplicate) {
      stud.errors.push(aiErr);
    }
  });

  // 5. X 버튼 무시 단어 목록 필터링 적용
  stud.ignoredWords = stud.ignoredWords || [];
  stud.errors = stud.errors.filter(err => !stud.ignoredWords.includes(err.original));

  // 6. 상태 아이콘 및 화면 업데이트 (백그라운드에서 완료되었으므로 화면 동기화)
  updateStudentListStatusIcon(index);
  if (index === state.currentStudentIndex) {
    console.log(`[AI 진단] 현재 편집중인 학생의 화면을 갱신합니다.`);
    renderInspectionResults();
  }
}

// 5) AI 분석용 로딩 오버레이 함수
function showLoadingOverlay(message) {
  let overlay = document.getElementById('ai-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ai-loading-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.color = 'white';
    overlay.style.fontFamily = 'inherit';
    
    const spinner = document.createElement('div');
    spinner.style.width = '50px';
    spinner.style.height = '50px';
    spinner.style.border = '5px solid rgba(255,255,255,0.3)';
    spinner.style.borderTop = '5px solid #0066cc';
    spinner.style.borderRadius = '50%';
    spinner.style.animation = 'spin 1s linear infinite';
    overlay.appendChild(spinner);
    
    const style = document.createElement('style');
    style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';
    document.head.appendChild(style);
    
    const text = document.createElement('div');
    text.id = 'ai-loading-text';
    text.style.marginTop = '20px';
    text.style.fontSize = '16px';
    text.style.fontWeight = 'bold';
    text.innerText = message;
    overlay.appendChild(text);
    
    document.body.appendChild(overlay);
  } else {
    document.getElementById('ai-loading-text').innerText = message;
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('ai-loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// ----------------------------------------------------
"""

escape_idx = js.find("function escapeHTML(str)")
if escape_idx != -1:
    js = js[:escape_idx] + ai_functions + "\n" + js[escape_idx:]
else:
    print("Could not find escapeHTML")
    exit(1)

# 5. Insert feedback render logic inside renderInspectionResults
# Let's find renderInspectionResults
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
  }"""

js = js.replace(render_results_old, render_results_new)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(js)
print("Rebuilt app.js with all AI features successfully")
