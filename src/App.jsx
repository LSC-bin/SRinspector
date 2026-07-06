import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentEditor from './components/StudentEditor';
import Settings from './components/Settings';
import SubjectView from './components/SubjectView';
import { inspectStudentRecord } from './utils/checker';
let cachedAiModel = null;

// 가용한 최적의 모델 동적 탐색 (프로젝트/지역별 모델 가용성 대응)
const getBestAvailableModel = async (apiKey) => {
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
    const supported = models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));
    
    const preferences = [
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash-lite-latest',
      'gemini-2.0-flash-lite',
      'gemini-2.5-flash',
      'gemini-2.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.0-pro',
      'gemini-pro'
    ];
    for (const pref of preferences) {
      if (supported.includes(pref)) {
        cachedAiModel = pref;
        console.log("[AI 진단] 선호 모델 선택 완료:", cachedAiModel);
        return cachedAiModel;
      }
    }
    if (supported.length > 0) {
      cachedAiModel = supported[0];
      console.log("[AI 진단] 대체 모델 선택 완료:", cachedAiModel);
      return cachedAiModel;
    }
    return 'gemini-1.5-flash';
  } catch (e) {
    console.error("[AI 진단] 모델 탐색 중 에러 발생, 기본값 사용:", e);
    return 'gemini-1.5-flash';
  }
};

const App = () => {
  // 1. 전역 상태 정의
  const [activeTab, setActiveTab] = useState('data-management');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [students, setStudents] = useState(() => {
    const saved = localStorage.getItem('s_record_students');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load students:", e);
      }
    }
    return [];
  });
  const [customDictionary, setCustomDictionary] = useState(() => {
    const saved = localStorage.getItem('s_record_dict');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to load dict:", e);
      }
    }
    return {};
  });
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('s_record_settings');
    if (saved) {
      try {
        return {
          spelling: true,
          slang: true,
          loanword: true,
          spacing: true,
          endingDot: true,
          forbidden: true,
          nameCheck: true,
          aiEnabled: false,
          aiKey: '',
          ...JSON.parse(saved)
        };
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    }
    return {
      spelling: true,
      slang: true,
      loanword: true,
      spacing: true,
      endingDot: true,
      forbidden: true,
      nameCheck: true,
      aiEnabled: false,
      aiKey: ''
    };
  });
  
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loadingMessage, setLoadingMessage] = useState('');
  const inspectCancelledRef = useRef(false);

  // 2. 알림 메시지 출력 함수
  const showToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // 4. 상태 변경 시 로컬 스토리지에 동기화 저장
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem('s_record_students', JSON.stringify(students));
    }
  }, [students]);

  useEffect(() => {
    localStorage.setItem('s_record_dict', JSON.stringify(customDictionary));
  }, [customDictionary]);

  useEffect(() => {
    localStorage.setItem('s_record_settings', JSON.stringify(settings));
  }, [settings]);

  // 규칙 설정 변경 시 전체 재검사
  useEffect(() => {
    if (students.length > 0) {
      setStudents(prev => prev.map(s => {
        const rawErrors = inspectStudentRecord(s.content, s.name, { 
          ...settings, 
          customDictionary 
        });
        const errors = rawErrors.filter(err => !(s.ignoredWords || []).includes(err.original));
        return { ...s, errors };
      }));
    }
  }, [settings, customDictionary]);

  // 5. 이름 마스킹 함수
  const maskStudentName = (text, studentName) => {
    if (!text || !studentName) return text;
    const namesToMask = [studentName];
    if (studentName.length >= 3) {
      namesToMask.push(studentName.substring(1));
    }
    let maskedText = text;
    namesToMask.forEach(name => {
      const escapedName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(escapedName, 'g');
      maskedText = maskedText.replace(regex, '[이 학생]');
    });
    return maskedText;
  };

  // 6. AI 검출 결과를 로컬 오류 형식으로 매핑
  const mapAiErrorsToLocalFormat = (aiErrors, originalText, studentName) => {
    const localErrors = [];
    if (!aiErrors || !Array.isArray(aiErrors)) return localErrors;

    aiErrors.forEach(err => {
      let orig = err.original;
      let repl = err.replace;
      if (!orig || !repl) return;
      
      if (orig.includes('[이 학생]')) {
        orig = orig.replace(/\[이 학생\]/g, studentName);
      }
      if (repl.includes('[이 학생]')) {
        repl = repl.replace(/\[이 학생\]/g, studentName);
      }
      
      let startIdx = originalText.indexOf(orig);
      if (startIdx !== -1) {
        const isForbidden = err.type === 'forbidden';
        localErrors.push({
          type: isForbidden ? 'forbidden' : 'ai',
          label: isForbidden ? '기재 금지' : (err.type === 'endingStyle' ? '종결 어미' : 'AI 추천'),
          start: startIdx,
          end: startIdx + orig.length,
          original: orig,
          replace: repl,
          reason: err.reason || 'AI 문맥 분석 기반 교정 제안'
        });
      }
    });
    
    return localErrors;
  };

  // 7. Gemini API 호출
  const fetchGeminiAiAnalysis = async (apiKey, maskedText) => {
    const model = await getBestAvailableModel(apiKey);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const prompt = `
    당신은 대한민국 교육부의 생활기록부 기재 표준 지침을 준수하는 고정밀 맞춤법 및 기재 요령 위반 점검관입니다.
    다음 학생 세특 본문에서 아래 [점검 및 필수 순화 가이드라인]을 기준으로 오류를 매우 정밀하게 분석해주세요.

    [점검 및 필수 순화 가이드라인]
    1. 문장 종결 어미 및 서술형 일관성 규정:
       - 문장은 무조건 명사형 어미(예: ~함, ~임, ~됨 등 'ㅁ/ㄻ' 받침)로 끝나야 합니다. (예: '~했다', '~했습니다', '~함이다', '~한다'는 종결 어미 위반 오류입니다. -> '~함'으로 변경해야 함)
       - 시제는 원칙적으로 현재형(~함, ~임)으로 작성해야 합니다.
    2. 학생 입장 서술 금지 (교사 관찰 시점 필수):
       - 학생 시점의 심리 상태나 인지 묘사(예: ~라고 느낌, ~라고 생각함, ~을 배움, ~을 알게 됨, ~을 이해함, ~라고 다짐함 등)는 기재할 수 없습니다.
       - 교사 관찰 시점의 행위 서술(예: '느낌' -> '느낀 점을 서술함/발표함', '배움' -> '학습함/탐구함', '다짐함' -> '포부를 밝힘')로 순화해야 합니다.
    3. 구체적인 브랜드/상호명 기재 금지 및 순화:
       - 구글/네이버/다음 ➡️ 포털사이트
       - 네이버 밴드/온라인 클래스/구글 클래스룸 ➡️ 교육 플랫폼
       - 유튜브 ➡️ 동영상 공유 플랫폼 또는 동영상
       - 유튜버 ➡️ 동영상 크리에이터 또는 개인 미디어 제작자
       - 카카오톡 ➡️ SNS 메신저
       - 인스타그램/페이스북/메타 ➡️ SNS 또는 소셜 네트워킹 서비스
       - 게더타운/이프랜드 ➡️ 메타버스 플랫폼
       - 패들렛/띵커벨 ➡️ 온라인 협업 플랫폼
       - 미리캔버스/캔바 ➡️ 온라인 디자인 도구
       - 커리어넷/메이저맵 ➡️ 진로 정보 사이트
    4. 불필요한 영어 약어 및 기구명 순화:
       - TED 영상 ➡️ 온라인 강연회 영상
       - KTX / SRT ➡️ 고속 열차
       - CCD ➡️ 전하 결합 소자
       - 국제기구 약어 (UN, EU, WHO, OECD, IMF, UNESCO 등) ➡️ '국제 기구' 등의 일반 명사로 순화
       - 외국 학교명은 입력할 수 없습니다.
       - 일반화된 영문 명사(CEO, IT, PPT, SNS, TV 등)나 도서명/저자명 외의 불필요한 영어 약어는 피해야 합니다.
    5. 교육부 기재 금지 조항 위반 (교외 수상 실적, 공인어학시험, 구체적인 대학명 우회 언급, 부모 직업 간접 언급 등) 점검

    [세특 본문]
    "${maskedText}"

    ★ [중요 규칙] ★
    - 총평(feedback) 글에 적거나 언급한 모든 수정 사항 및 지적 표현(예: '너무 좋은'과 같이 교정해야 할 표현 등)은 반드시 아래 "errors" 배열에도 빠짐없이 각각 정확한 원문(original), 대체어(replace), 사유(reason)를 담아 개별 객체로 추가해야 합니다.
    - 특히 명사형 어미로 끝나지 않은 문장(예: '~했다', '~한다')이나 학생 시점 표현(예: '배웠다', '느꼈다', '이해했다')이 발견되면 "errors" 목록에 빠짐없이 수록해 주세요.

    출력은 반드시 다른 설명(인사말, 마크다운 코드블록 등) 없이 오직 아래 지정된 JSON 스키마를 만족하는 JSON 포맷만 반환해야 합니다:
    {
      "feedback": "본문이 전반적으로 잘 작성되었는지, 아쉬운 점은 없는지 2~3문장으로 총평을 작성하세요. 잘했으면 칭찬하고, 못했으면 보완점을 알려주세요.",
      "errors": [
        {
          "original": "오류어구(원문에 나타난 그대로의 부분 문자열)",
          "replace": "교정제안단어",
          "reason": "오류 판정 사유 및 점검 가이드라인",
          "type": "spelling" 또는 "forbidden" 또는 "endingStyle" 중 하나
        }
      ]
    }
    `;

    const requestBody = {
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      let errMsg = `Status ${response.status}`;
      try {
        const errData = await response.json();
        if (errData && errData.error && errData.error.message) {
          errMsg = errData.error.message;
        }
      } catch (e) {}
      throw new Error(errMsg);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      return { errors: [], feedback: '' };
    }

    const jsonText = data.candidates[0].content.parts[0].text;
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (e) {
      const match = jsonText.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (match) {
        parsedData = JSON.parse(match[1]);
      } else {
        throw new Error("Invalid JSON format from Gemini");
      }
    }

    return {
      feedback: parsedData.feedback || '',
      errors: Array.isArray(parsedData.errors) ? parsedData.errors : []
    };
  };

  // 8. 단일 학생 분석 실행 (AI 포함 가능)
  const runStudentAnalysis = async (index, forceAi = false) => {
    if (index < 0 || index >= students.length) return;
    const stud = students[index];
    const text = stud.content;
    if (!text) return;

    // 로컬 검출
    const rawErrors = inspectStudentRecord(text, stud.name, { ...settings, customDictionary });
    let errors = rawErrors.filter(err => !(stud.ignoredWords || []).includes(err.original));
    let aiFeedback = stud.aiFeedback || '';

    // AI 활성화되었고 강제 호출할 경우
    if (forceAi && settings.aiEnabled && settings.aiKey) {
      try {
        const masked = maskStudentName(text, stud.name);
        const aiResult = await fetchGeminiAiAnalysis(settings.aiKey, masked);
        
        aiFeedback = aiResult.feedback;
        const mappedAiErrors = mapAiErrorsToLocalFormat(aiResult.errors, text, stud.name);
        
        // AI 검출 에러를 로컬 에러와 병합 (중복 방지)
        mappedAiErrors.forEach(aiErr => {
          const isDuplicate = errors.some(le => le.start === aiErr.start && le.end === aiErr.end);
          if (!isDuplicate) {
            errors.push(aiErr);
          }
        });
      } catch (err) {
        console.error(err);
        throw err;
      }
    }

    // 학생 정보 업데이트
    setStudents(prev => prev.map((s, idx) => {
      if (idx === index) {
        return { ...s, errors, aiFeedback, checked: true };
      }
      return s;
    }));
  };

  // 단일 학생 분석용 래퍼 함수 (예외 포착 및 로딩 오버레이 제어)
  const handleSingleStudentAnalysis = async (index, forceAi = false) => {
    try {
      setLoadingMessage('AI 정밀 진단 중...');
      await runStudentAnalysis(index, forceAi);
      showToast('AI 분석이 성공적으로 완료되었습니다.');
    } catch (err) {
      showToast(`AI 분석 실패: ${err.message}`);
    } finally {
      setLoadingMessage('');
    }
  };

  // 9. 전체 학생 분석 일괄 실행 (429 한도 재시도 및 API 인증 실패 시 즉시 중단 적용)
  const inspectAll = async () => {
    if (students.length === 0) {
      showToast('분석할 학생 데이터를 먼저 추가해 주세요.');
      return;
    }

    const isAiActive = settings.aiEnabled && settings.aiKey;
    if (isAiActive) {
      inspectCancelledRef.current = false;
      setLoadingMessage('AI 분석 준비 중...');
      let success = 0;
      let fail = 0;
      let aborted = false;

      // 딜레이용 헬퍼
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      for (let idx = 0; idx < students.length; idx++) {
        if (aborted) break;
        if (inspectCancelledRef.current) {
          aborted = true;
          showToast('사용자가 분석을 중단했습니다.');
          break;
        }

        // 유료 결제 활성화에 따라 대기 시간 제거 (초고속 일괄 분석 수행)
        await sleep(150);

        let retries = 3;
        while (retries > 0) {
          if (inspectCancelledRef.current) {
            aborted = true;
            showToast('사용자가 분석을 중단했습니다.');
            break;
          }
          setLoadingMessage(`AI 점검 진행 중... (${idx + 1}/${students.length})`);
          try {
            await runStudentAnalysis(idx, true);
            success++;
            break; // 성공 시 재시도 루프 탈출
          } catch (err) {
            console.error(`AI analysis failed at index ${idx}:`, err);
            
            const errMsg = String(err.message || err);
            
            // 429 Too Many Requests (호출 한도 도달)의 경우 성공할 때까지 무제한 대기 후 해당 학생으로 재시도
            if (errMsg.includes('429') || errMsg.includes('Quota exceeded') || errMsg.includes('limit') || errMsg.includes('quota')) {
              // 에러 메시지에서 대기 권장 시간 파싱 시도 (예: Please retry in 27.228170592s)
              let waitMs = 6000; // 기본 6초 대기
              const match = errMsg.match(/retry in ([\d.]+)\s*s/i);
              if (match) {
                const parsedSecs = parseFloat(match[1]);
                if (!isNaN(parsedSecs)) {
                  // 파싱된 초 단위 시간에 1.5초 안정화 버퍼 추가
                  waitMs = Math.ceil(parsedSecs * 1000) + 1500;
                }
              }
              
              setLoadingMessage(`호출 한도 도달. ${(waitMs / 1000).toFixed(1)}초 후 해당 학생(${idx + 1}/${students.length}) 건으로 재시도합니다...`);
              await sleep(waitMs);
              continue; // retries 차감 없이 루프 맨 위로 이동하여 동일 학생으로 다시 호출
            } 
            // 403/400 API Key 에러의 경우 바로 일괄 중단하여 무의미한 에러 메시지 팝업 도배 방지
            else if (errMsg.includes('API key') || errMsg.includes('403') || errMsg.includes('400') || errMsg.includes('invalid') || errMsg.includes('not valid')) {
              aborted = true;
              fail += (students.length - idx);
              showToast(`API 인증 오류: API Key가 올바르지 않거나 활성화되지 않은 상태입니다. (${errMsg})`);
              break;
            } 
            // 기타 일반 에러 처리 (3회 시도 후 실패하고 다음 학생으로)
            else {
              retries--;
              if (retries === 0) {
                fail++;
                break;
              }
              setLoadingMessage(`네트워크 일시 오류. 3초 후 재시도합니다... (남은 시도: ${retries}회)`);
              await sleep(3000);
            }
          }
        }
      }

      setLoadingMessage('');
      if (!aborted) {
        showToast(`AI 일괄 분석 완료 (성공: ${success}명, 실패: ${fail}명)`);
      }
    } else {
      setStudents(prev => prev.map((s) => {
        const rawErrors = inspectStudentRecord(s.content, s.name, { ...settings, customDictionary });
        const errors = rawErrors.filter(err => !(s.ignoredWords || []).includes(err.original));
        return { ...s, errors, checked: true };
      }));
      showToast('일괄 분석이 성공적으로 완료되었습니다.');
    }
  };

  // 대시보드 테이블 등에서 에디터로 이동용 헬퍼
  const handleGoToEditor = (studentId) => {
    setCurrentStudentId(studentId);
    setActiveTab('student-group-view');
  };

  return (
    <div id="app-container">
      {/* 사이드바 네비게이션 */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
      />

      {/* 메인 콘텐츠 영역 */}
      <main className="content-area">
        {/* 헤더 */}
        <header className="page-header">
          <h2 className="page-title" id="current-page-title">
            <span>{
              activeTab === 'data-management' ? '데이터 관리' :
              activeTab === 'settings' ? '점검 규칙 설정' :
              activeTab === 'student-group-view' ? '학생별 확인' : '과목별 확인'
            }</span>
          </h2>
        </header>

        {/* 탭 가시성 선택 */}
        <div id="data-management" className={`tab-content ${activeTab === 'data-management' ? 'active' : ''}`}>
          <Dashboard 
            students={students}
            setStudents={setStudents}
            inspectAll={inspectAll}
            goToEditor={handleGoToEditor}
            showToast={showToast}
          />
        </div>

        <div id="student-group-view" className={`tab-content ${activeTab === 'student-group-view' ? 'active' : ''}`}>
          <StudentEditor 
            students={students}
            setStudents={setStudents}
            currentStudentId={currentStudentId}
            setCurrentStudentId={setCurrentStudentId}
            customDictionary={customDictionary}
            setCustomDictionary={setCustomDictionary}
            settings={settings}
            showToast={showToast}
            runStudentAnalysis={handleSingleStudentAnalysis}
          />
        </div>

        <div id="settings" className={`tab-content ${activeTab === 'settings' ? 'active' : ''}`}>
          <Settings 
            settings={settings}
            setSettings={setSettings}
            customDictionary={customDictionary}
            setCustomDictionary={setCustomDictionary}
            showToast={showToast}
          />
        </div>

        <div id="subject-group-view" className={`tab-content ${activeTab === 'subject-group-view' ? 'active' : ''}`}>
          <SubjectView 
            students={students}
            onNavigateToStudent={handleGoToEditor}
            showToast={showToast}
          />
        </div>
      </main>

      {/* 로딩 오버레이 */}
      {loadingMessage && (
        <div id="ai-loading-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, color: 'white', flexDirection: 'column' }}>
          <div className="spinner" style={{ border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid white', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '16px', fontWeight: 600 }}>{loadingMessage}</div>
          {loadingMessage.includes('점검') && (
            <button 
              onClick={() => { inspectCancelledRef.current = true; }}
              className="btn" 
              style={{ marginTop: '16px', backgroundColor: 'var(--color-spelling-bg)', color: 'var(--color-spelling-text)', borderColor: 'rgba(212,64,39,0.15)', cursor: 'pointer' }}
            >
              분석 중단
            </button>
          )}
        </div>
      )}

      {/* 토스트 알림 컨테이너 */}
      <div id="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
