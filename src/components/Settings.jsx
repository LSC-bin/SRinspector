import React, { useState, useEffect } from 'react';
import { ShieldCheck, BookOpen, BrainCircuit, Trash2, Plus, Download, Upload } from 'lucide-react';

const Settings = ({ 
  settings, 
  setSettings, 
  customDictionary, 
  setCustomDictionary, 
  showToast 
}) => {
  const [apiKeyInput, setApiKeyInput] = useState(settings.aiKey || '');

  // 부모의 settings.aiKey 로드 시 로컬 입력 상태와 동기화
  useEffect(() => {
    setApiKeyInput(settings.aiKey || '');
  }, [settings.aiKey]);

  // 설정 내보내기 (Export)
  const handleExportSettings = () => {
    try {
      const dataStr = JSON.stringify({ settings, customDictionary }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `sr_inspector_settings_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('점검 규칙 및 사전 설정 파일이 성공적으로 다운로드되었습니다.');
    } catch (err) {
      console.error(err);
      showToast('설정 파일 내보내기 중 오류가 발생했습니다.');
    }
  };

  // 설정 가져오기 (Import)
  const handleImportSettings = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        
        if (!parsed.settings && !parsed.customDictionary) {
          throw new Error('올바르지 않은 설정 파일 양식입니다.');
        }

        if (parsed.settings) {
          setSettings(parsed.settings);
        }
        if (parsed.customDictionary) {
          setCustomDictionary(parsed.customDictionary);
        }

        showToast('설정 파일(JSON)을 성공적으로 불러와 적용했습니다!');
      } catch (err) {
        console.error(err);
        showToast('설정 파일 형식이 올바르지 않거나 손상된 파일입니다.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // 규칙 토글 핸들러
  const handleToggle = (key) => {
    setSettings(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      showToast('점검 규칙 설정이 실시간으로 적용되었습니다.');
      return updated;
    });
  };

  // AI 활성화 토글 핸들러
  const handleAiToggle = () => {
    setSettings(prev => {
      const updated = { ...prev, aiEnabled: !prev.aiEnabled };
      showToast(updated.aiEnabled ? 'AI 분석 기능이 활성화되었습니다.' : 'AI 분석 기능이 비활성화되었습니다.');
      return updated;
    });
  };

  // API 키 저장 핸들러
  const handleSaveApiKey = () => {
    setSettings(prev => ({ ...prev, aiKey: apiKeyInput }));
    showToast('Gemini API Key가 저장되었습니다.');
  };

  // 사용자 사전 항목 추가
  const addDictEntry = () => {
    const tempKey = '새_단어_' + Math.random().toString(36).substr(2, 5);
    setCustomDictionary(prev => ({
      ...prev,
      [tempKey]: { replace: '', reason: '수정 사유 입력' }
    }));
  };

  // 사용자 사전 개별 변경 핸들러
  const updateDictEntry = (oldKey, newKey, replace, reason) => {
    if (!newKey.trim()) return;

    setCustomDictionary(prev => {
      const updated = { ...prev };
      if (oldKey !== newKey) {
        delete updated[oldKey];
      }
      updated[newKey] = {
        replace: replace || newKey, // 비어있으면 예외 처리로 판단
        reason: reason || '사용자 정의 규칙'
      };
      return updated;
    });
  };

  // 사용자 사전 삭제
  const deleteDictEntry = (key) => {
    setCustomDictionary(prev => {
      const updated = { ...prev };
      delete updated[key];
      showToast(`'${key}' 사전 규칙이 삭제되었습니다.`);
      return updated;
    });
  };

  const dictEntries = Object.entries(customDictionary);

  return (
    <div className="settings-tab-wrapper">
      {/* 활성화할 점검 규칙 */}
      <div className="settings-section">
        <h4 className="settings-section-title">
          <ShieldCheck />
          <span>활성화할 점검 규칙</span>
        </h4>
        
        {[
          { id: 'spelling', title: '맞춤법 및 흔한 오탈자 점검', desc: '생기부 다빈도 오탈자(역활, 됬다, 무난하다 등)를 감지합니다.' },
          { id: 'slang', title: '비표준어 및 청소년 은어 사용 금지', desc: '킹받다, 개이득, 잼민이 등 격식 없는 은어 및 유행어를 점검합니다.' },
          { id: 'loanword', title: '외래어 표기 교정', desc: '시물레이션 -> 시뮬레이션 등 잘못 표기된 외래어를 찾습니다.' },
          { id: 'spacing', title: '연속 띄어쓰기 점검', desc: '2개 이상 연속으로 입력된 불필요한 공백을 1개로 줄입니다.' },
          { id: 'endingDot', title: '문장 종결 온점(.) 점검', desc: '각 문장의 끝이 마침표(.)로 끝나지 않은 오류를 체크합니다.' },
          { id: 'forbidden', title: '생기부 기재 금지 키워드 필터링', desc: '어학성적(토익 등), 교외대회 수상실적, 사설기관 언급을 제한합니다.' },
          { id: 'nameCheck', title: '학생 본인 실명 노출 주의', desc: '본문에 학생 실명이 직접 들어갔는지 검사하여 대체 명칭을 권고합니다.' }
        ].map(rule => (
          <div className="toggle-item" key={rule.id}>
            <div className="toggle-details">
              <h5>{rule.title}</h5>
              <p>{rule.desc}</p>
            </div>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={!!settings[rule.id]} 
                onChange={() => handleToggle(rule.id)}
              />
              <span className="slider"></span>
            </label>
          </div>
        ))}
      </div>

      {/* 나만의 단어 사전 */}
      <div className="settings-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 className="settings-section-title" style={{ marginBottom: 0 }}>
            <BookOpen />
            <span>나만의 단어 사전 (예외 및 직접 추가)</span>
          </h4>
          <button className="btn" onClick={addDictEntry}>
            <Plus style={{ width: '14px', height: '14px', marginRight: '4px' }} />
            <span>사전 항목 추가</span>
          </button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          사용자가 추가한 단어들은 기재 지침 점검 시 우선 반영됩니다. 대체어 칸을 비워두면(또는 예외 처리하면) 기본 사전의 오류 목록에서 예외로 제외됩니다.
        </p>

        <div className="dictionary-grid" id="custom-dictionary-list">
          <div className="dictionary-row" style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
            <span>찾을 단어 (오류 단어)</span>
            <span>대체할 단어 (제안)</span>
            <span>이유 / 설명</span>
            <span style={{ width: '28px' }}></span>
          </div>

          {dictEntries.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              등록된 사용자 사전 규칙이 없습니다. [사전 항목 추가] 버튼을 눌러보세요.
            </div>
          ) : (
            dictEntries.map(([key, val]) => {
              const replaceVal = val.replace === key ? '' : val.replace;
              return (
                <div className="dictionary-row" key={key} data-word={key}>
                  <input 
                    type="text" 
                    className="dict-input-word" 
                    defaultValue={key} 
                    placeholder="오류 단어"
                    onBlur={(e) => updateDictEntry(key, e.target.value.trim(), replaceVal, val.reason)}
                  />
                  <input 
                    type="text" 
                    className="dict-input-replace" 
                    defaultValue={replaceVal} 
                    placeholder="대체어 (비우면 예외처리)"
                    onBlur={(e) => updateDictEntry(key, key, e.target.value.trim(), val.reason)}
                  />
                  <input 
                    type="text" 
                    className="dict-input-reason" 
                    defaultValue={val.reason || ''} 
                    placeholder="수정 사유"
                    onBlur={(e) => updateDictEntry(key, key, replaceVal, e.target.value.trim())}
                  />
                  <button 
                    className="action-icon-btn btn-delete-dict" 
                    style={{ color: 'var(--color-spelling-text)' }} 
                    title="규칙 삭제"
                    onClick={() => deleteDictEntry(key)}
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Google Gemini AI API 연동 */}
      <div className="settings-section" style={{ marginTop: '24px' }}>
        <h4 className="settings-section-title">
          <BrainCircuit />
          <span>Google Gemini AI 점검 연동 (옵션)</span>
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          로컬 사전을 보완하여 정적인 매칭으로 잡지 못하는 문맥 오류(우회 대학명 언급, 부모의 사회적 지위 암시 등)를 인공지능이 추가 정밀 분석합니다. 개인 식별 정보는 마스킹 처리 후 본문만 전송되므로 안전합니다.
        </p>
        
        <div className="toggle-item" style={{ marginBottom: '16px' }}>
          <div className="toggle-details">
            <h5>AI 점검 기능 활성화</h5>
            <p>Gemini API를 활용하여 문맥 기반 정밀 생기부 검사를 함께 수행합니다.</p>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={!!settings.aiEnabled} 
              onChange={handleAiToggle}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', marginBottom: '8px' }}>
          <span className="editor-label" style={{ width: '120px', flexShrink: 0, fontWeight: 600, fontSize: '13px' }}>Gemini API Key</span>
          <input 
            type="password" 
            className="editor-input" 
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            style={{ flex: 1, height: '32px', fontSize: '13px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', padding: '4px 8px', fontFamily: 'inherit', color: 'var(--text-primary)' }} 
            placeholder="AI Studio에서 발급받은 API 키를 입력하세요"
          />
          <button 
            onClick={handleSaveApiKey}
            className="btn btn-primary" 
            style={{ height: '32px', padding: '0 16px', flexShrink: 0 }}
          >
            저장
          </button>
        </div>
        
        <div style={{ marginTop: '10px', padding: '8px 12px', backgroundColor: 'var(--bg-secondary)', borderLeft: '3px solid var(--color-slang-text)', borderRadius: '0 4px 4px 0', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          💡 <b>[필독] 404 (Not Found) 오류 발생 시 자가 조치법</b><br />
          구글 AI Studio에서 API 키를 만드실 때, 기존 프로젝트가 아닌 <b>[새 프로젝트에서 API 키 만들기 (Create API key in new project)]</b>를 클릭하여 완전 새로운 프로젝트의 키를 생성해 등록해 주세요. 기존 기본 프로젝트(Default Gemini Project)에 권한 꼬임이 있을 때 발생하는 구글 클라우드 고유의 차단 버그를 100% 즉시 해결해 줍니다.
        </div>
      </div>
      {/* 설정 백업 및 이관 */}
      <div className="settings-section" style={{ marginTop: '24px' }}>
        <h4 className="settings-section-title">
          <Download style={{ width: '18px', height: '18px' }} />
          <span>설정 백업 및 내보내기/가져오기</span>
        </h4>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          현재 활성화된 점검 규칙 설정과 사용자 사전(단어장), 등록된 API 키를 JSON 파일로 백업하여 다른 PC나 환경으로 그대로 옮길 수 있습니다.
        </p>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={handleExportSettings}>
            <Download style={{ width: '14px', height: '14px', marginRight: '6px' }} />
            <span>설정 백업 파일 다운로드 (.json)</span>
          </button>
          
          <button className="btn" onClick={() => document.getElementById('settings-file-input').click()}>
            <Upload style={{ width: '14px', height: '14px', marginRight: '6px' }} />
            <span>설정 파일 불러오기 (.json)</span>
          </button>
          
          <input 
            type="file" 
            id="settings-file-input" 
            accept=".json" 
            onChange={handleImportSettings} 
            style={{ display: 'none' }} 
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;
