import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Users, ChevronsLeft, ChevronsRight, Search, 
  ChevronLeft, ChevronRight, Send, Sparkles, 
  AlertCircle, CheckCircle, MessageSquare 
} from 'lucide-react';
import { calculateNEISBytes, inspectStudentRecord } from '../utils/checker';

const StudentEditor = ({ 
  students, 
  setStudents, 
  currentStudentId, 
  setCurrentStudentId, 
  customDictionary, 
  setCustomDictionary,
  settings, 
  showToast,
  runStudentAnalysis // 단일 학생 분석을 트리거하는 함수 (AI 포함)
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');

  const editorRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  // 학번 파싱 도우미
  const parseGradeAndClass = (sNum) => {
    if (!sNum) return { grade: '', classVal: '' };
    const numStr = String(sNum).trim();
    if (numStr.length >= 5) {
      return { grade: numStr[0], classVal: numStr.substring(1, 3) };
    } else if (numStr.length === 4) {
      return { grade: numStr[0], classVal: numStr[1] };
    }
    return { grade: '', classVal: '' };
  };

  // 필터 옵션 추출
  const filterOptions = useMemo(() => {
    const years = new Set();
    const classes = new Set();
    students.forEach(s => {
      const { grade, classVal } = parseGradeAndClass(s.sNum);
      if (grade) years.add(grade);
      if (classVal) classes.add(classVal);
    });
    return {
      years: Array.from(years).sort(),
      classes: Array.from(classes).sort()
    };
  }, [students]);

  // 사이드바 과목 필터용 옵션 추출
  const sidebarSubjectOptions = useMemo(() => {
    const subs = new Set();
    students.forEach(s => {
      if (s.subject) subs.add(s.subject);
    });
    return Array.from(subs).sort();
  }, [students]);

  // 왼쪽 명부 필터링된 학생들 목록
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        if (!s.name.toLowerCase().includes(query) && !s.sNum.toLowerCase().includes(query)) {
          return false;
        }
      }
      if (filterYear !== 'all') {
        const { grade } = parseGradeAndClass(s.sNum);
        if (grade !== filterYear) return false;
      }
      if (filterClass !== 'all') {
        const { classVal } = parseGradeAndClass(s.sNum);
        if (classVal !== filterClass) return false;
      }
      if (filterSubject !== 'all') {
        if (s.subject !== filterSubject) return false;
      }
      return true;
    });
  }, [students, searchTerm, filterYear, filterClass, filterSubject]);

  // 중복이 제거된 유니크 학생 목록 (이름 + 학번 기준)
  const uniqueStudents = useMemo(() => {
    const seen = new Set();
    const list = [];
    filteredStudents.forEach(s => {
      const key = `${s.name}_${s.sNum || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        list.push(s);
      }
    });
    return list;
  }, [filteredStudents]);

  // 현재 활성화된 학생 객체 찾기
  const currentStudent = students.find(s => s.id === currentStudentId);

  // 현재 선택된 학생의 uniqueStudents 내 인덱스 찾기
  const currentUniqueStudentIndex = useMemo(() => {
    if (!currentStudent) return -1;
    return uniqueStudents.findIndex(s => s.name === currentStudent.name && s.sNum === currentStudent.sNum);
  }, [uniqueStudents, currentStudent]);

  // 현재 선택된 학생이 수강 중인 모든 과목 레코드 목록
  const currentStudentSubjects = useMemo(() => {
    if (!currentStudent) return [];
    return students.filter(s => s.name === currentStudent.name && s.sNum === currentStudent.sNum);
  }, [students, currentStudent?.name, currentStudent?.sNum]);

  // 1. 에디터 하이라이팅 적용 함수
  const applyHighlighting = () => {
    if (!editorRef.current || !currentStudent) return;
    
    const text = currentStudent.content || '';
    if (!currentStudent.errors || currentStudent.errors.length === 0) {
      editorRef.current.innerHTML = escapeHTML(text);
      return;
    }

    // 겹치지 않는 오류 필터링
    const sortedSpans = [...currentStudent.errors].sort((a, b) => a.start - b.start);
    const activeErrors = [];
    let lastEnd = -1;
    
    sortedSpans.forEach(err => {
      if (err.start >= lastEnd) {
        activeErrors.push(err);
        lastEnd = err.end;
      }
    });

    // 뒤에서부터 태그 치환
    let html = text;
    const sortedErrors = activeErrors.sort((a, b) => b.start - a.start);

    sortedErrors.forEach(err => {
      const before = html.substring(0, err.start);
      const match = html.substring(err.start, err.end);
      const after = html.substring(err.end);
      html = before + `<span class="hl-${err.type}" data-start="${err.start}" data-end="${err.end}" title="${escapeHTML(err.reason)}">${escapeHTML(match)}</span>` + after;
    });

    editorRef.current.innerHTML = html;
  };

  // HTML 이스케이프 헬퍼
  const escapeHTML = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // 캐럿 위치 획득
  const getCaretCharacterOffsetWithin = (element) => {
    let caretOffset = 0;
    const doc = element.ownerDocument || element.document;
    const win = doc.defaultView || doc.parentWindow;
    const sel = win.getSelection();
    
    if (sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
    return caretOffset;
  };

  // 캐럿 위치 복원
  const setCaretPosition = (element, offset) => {
    if (offset < 0) return;
    const range = document.createRange();
    const sel = window.getSelection();
    
    let currentOffset = 0;
    let nodeToFocus = null;
    let focusOffset = 0;
    
    const traverse = (node) => {
      if (nodeToFocus) return;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const len = node.nodeValue.length;
        if (currentOffset + len >= offset) {
          nodeToFocus = node;
          focusOffset = offset - currentOffset;
        } else {
          currentOffset += len;
        }
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i]);
        }
      }
    };
    
    traverse(element);
    
    if (!nodeToFocus) {
      nodeToFocus = element;
      focusOffset = element.childNodes.length;
      if (element.lastChild && element.lastChild.nodeType === Node.TEXT_NODE) {
        nodeToFocus = element.lastChild;
        focusOffset = element.lastChild.nodeValue.length;
      }
    }
    
    try {
      if (nodeToFocus.nodeType === Node.TEXT_NODE) {
        range.setStart(nodeToFocus, focusOffset);
      } else {
        range.setStart(nodeToFocus, focusOffset);
      }
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    } catch (e) {
      console.warn("Caret restore error: ", e);
    }
  };

  // 학생 선택 시 본문 하이라이트 동기화
  useEffect(() => {
    if (currentStudent && editorRef.current) {
      applyHighlighting();
    }
  }, [currentStudentId]);

  // 과목 필터 선택 변경 시, 현재 학생의 과목 레코드가 있으면 해당 과목으로 자동 전환
  useEffect(() => {
    if (currentStudent && filterSubject !== 'all') {
      const match = students.find(s => 
        s.name && currentStudent.name &&
        String(s.name).trim() === String(currentStudent.name).trim() && 
        String(s.sNum).trim() === String(currentStudent.sNum).trim() && 
        String(s.subject).trim() === String(filterSubject).trim()
      );
      if (match) {
        setCurrentStudentId(match.id);
      }
    }
  }, [filterSubject, currentStudent, students]);

  // 에디터 타이핑 핸들러
  const handleEditorInput = () => {
    if (!currentStudent || !editorRef.current) return;
    isTypingRef.current = true;
    const text = editorRef.current.innerText;

    // 디바운싱 점검 적용 (800ms 뒤 하이라이팅 재적용)
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const caretOffset = getCaretCharacterOffsetWithin(editorRef.current);

      // 로컬 상태 수정
      setStudents(prev => prev.map(s => {
        if (s.id === currentStudent.id) {
          // 실시간 규칙 재검사 실행
          const rawErrors = inspectStudentRecord(text, s.name, { ...settings, customDictionary });
          const errors = rawErrors.filter(err => !(s.ignoredWords || []).includes(err.original));
          return { ...s, content: text, errors, checked: true };
        }
        return s;
      }));

      // 하이라이팅 적용 및 캐럿 복원
      isTypingRef.current = false;
    }, 800);
  };

  // 타이핑 아닐 때 에러 상태 변경에 따른 하이라이트 동기화
  useEffect(() => {
    if (!isTypingRef.current && currentStudent) {
      applyHighlighting();
    }
  }, [currentStudent?.errors]);

  // 과목명 드롭다운 변경 (선택된 학생의 다른 과목 레코드로 전환 또는 새 과목 추가)
  const handleSubjectChange = (e) => {
    const val = e.target.value;
    if (val === '__add_new__') {
      const newSubName = prompt('추가할 새로운 과목/활동명을 입력하세요:');
      if (newSubName && newSubName.trim()) {
        const trimmed = newSubName.trim();
        const exists = currentStudentSubjects.some(s => s.subject === trimmed);
        if (exists) {
          showToast('이미 존재하는 과목입니다.');
          return;
        }

        const newId = `record_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const newRecord = {
          ...currentStudent,
          id: newId,
          subject: trimmed,
          content: '',
          errors: [],
          checked: false,
          ignoredWords: []
        };

        setStudents(prev => [...prev, newRecord]);
        setCurrentStudentId(newId);
        showToast(`새 과목 [${trimmed}]이 추가되었습니다.`);
      }
    } else {
      setCurrentStudentId(val);
    }
  };

  // 교사 인풋 처리 (현재 선택된 과목 레코드의 교사 수정)
  const handleTeacherChange = (e) => {
    const val = e.target.value;
    setStudents(prev => prev.map(s => {
      if (s.id === currentStudent.id) {
        return { ...s, teacher: val };
      }
      return s;
    }));
  };

  // 이전/다음 학생 이동 (유니크 학생 기준 이동 및 필터링된 과목 우선 적용)
  const navigateStudent = (dir) => {
    if (uniqueStudents.length === 0) return;
    let nextIdx = currentUniqueStudentIndex + dir;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= uniqueStudents.length) nextIdx = uniqueStudents.length - 1;
    
    const targetStudent = uniqueStudents[nextIdx];
    const record = students.find(s => 
      s.name && targetStudent.name &&
      String(s.name).trim() === String(targetStudent.name).trim() && 
      String(s.sNum).trim() === String(targetStudent.sNum).trim() && 
      (filterSubject === 'all' ? true : String(s.subject).trim() === String(filterSubject).trim())
    );
    if (record) {
      setCurrentStudentId(record.id);
    }
  };

  // 키보드 위/아래 방향키를 이용한 학생 탐색 지원
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      // 입력창이나 에디터에 포커스가 있을 때는 기본 동작 보존
      if (
        activeEl && 
        (activeEl.tagName === 'INPUT' || 
         activeEl.tagName === 'TEXTAREA' || 
         activeEl.isContentEditable ||
         activeEl.getAttribute('contenteditable') === 'true' ||
         activeEl.className.includes('editor-text')
      )
      ) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateStudent(1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateStudent(-1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [uniqueStudents, currentUniqueStudentIndex]);

  // 활성화된 학생 선택 시 사이드바에서 자동으로 스크롤 위치 보정
  useEffect(() => {
    const activeItem = document.querySelector('.student-list-item.active');
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStudentId]);

  // 단일 오류 교정 반영
  const applySingleFix = (errIdx) => {
    if (!currentStudent) return;
    const err = currentStudent.errors[errIdx];
    if (!err) return;

    const text = currentStudent.content;
    const before = text.substring(0, err.start);
    const after = text.substring(err.end);
    const updatedText = before + err.replace + after;

    setStudents(prev => prev.map(s => {
      if (s.id === currentStudent.id) {
        const rawErrors = inspectStudentRecord(updatedText, s.name, { ...settings, customDictionary });
        const errors = rawErrors.filter(e => !(s.ignoredWords || []).includes(e.original));
        return { ...s, content: updatedText, errors };
      }
      return s;
    }));

    if (editorRef.current) {
      editorRef.current.innerText = updatedText;
    }
    showToast(`'${err.original}'가 '${err.replace}'로 수정되었습니다.`);
  };

  // 모든 제안 교정 반영
  const applyAllFixes = () => {
    if (!currentStudent || !currentStudent.errors || currentStudent.errors.length === 0) return;

    let text = currentStudent.content;
    // 인덱스 꼬임을 막기 위해 뒤에서부터 변경
    const sortedErrors = [...currentStudent.errors].sort((a, b) => b.start - a.start);
    sortedErrors.forEach(err => {
      const before = text.substring(0, err.start);
      const after = text.substring(err.end);
      text = before + err.replace + after;
    });

    setStudents(prev => prev.map(s => {
      if (s.id === currentStudent.id) {
        const rawErrors = inspectStudentRecord(text, s.name, { ...settings, customDictionary });
        const errors = rawErrors.filter(e => !(s.ignoredWords || []).includes(e.original));
        return { ...s, content: text, errors };
      }
      return s;
    }));

    if (editorRef.current) {
      editorRef.current.innerText = text;
    }
    showToast('모든 제안 수정사항이 한 번에 적용되었습니다!');
  };

  // 단일 단어 예외 처리
  const ignoreSingleError = (word) => {
    if (customDictionary[word] === null) return;
    
    // 예외 사전 등록
    setCustomDictionary(prev => ({
      ...prev,
      [word]: { replace: word, reason: '사용자 지정 예외 단어 (검사하지 않음)' }
    }));
    
    // 전역 학생들의 오류 목록에서 필터링 적용
    setStudents(prev => prev.map(s => {
      const rawErrors = inspectStudentRecord(s.content, s.name, { 
        ...settings, 
        customDictionary: {
          ...customDictionary,
          [word]: { replace: word, reason: '사용자 지정 예외 단어 (검사하지 않음)' }
        } 
      });
      const errors = rawErrors.filter(e => !(s.ignoredWords || []).includes(e.original));
      return { ...s, errors };
    }));
    
    showToast(`'${word}' 단어가 검사 예외 목록에 추가되었습니다.`);
  };

  // 담당교사 전송용 메시지 클립보드 복사
  const copyRequestMessage = () => {
    if (!currentStudent) return;
    const s = currentStudent;
    const teacherName = s.teacher || '과목 담당';
    const subjectName = s.subject || '해당 과목';
    const studentName = s.name || '학생';
    const studentMeta = `${s.year}학년도 ${s.term} - ${s.sNum || '학번 없음'}`;
    const contentText = s.content || '';
    
    let errorLines = '';
    if (s.errors && s.errors.length > 0) {
      s.errors.forEach((err, index) => {
        const errorLabel = err.label || '점검 항목';
        const matchedVal = contentText.substring(err.start, err.end);
        const replaceVal = err.replace || '(대체어 없음)';
        const errorReason = err.reason ? ` (${err.reason})` : '';
        errorLines += `${index + 1}. [${errorLabel}] '${matchedVal}' ➔ '${replaceVal}'로 수정 제안${errorReason}\n`;
      });
    } else {
      errorLines = '검출된 수정 제안 사항이 없습니다. (양호)\n';
    }
    
    const message = `📢 [생기부 세특 수정 요청 사항 안내]

안녕하세요, 선생님. 생기부 점검기 검출 결과에 따른 교정 요청 사항을 보내드립니다.

👤 대상 학생: ${studentName} (${studentMeta})
📚 해당 과목: ${subjectName} (담당: ${teacherName} 선생님)
--------------------------------------------------
📝 수정 대상 원문:
"${contentText}"

⚠️ 점검 검출 사항 (총 ${s.errors ? s.errors.length : 0}건):
${errorLines}--------------------------------------------------
점검 시스템 제안에 따라 확인 및 반영을 부탁드립니다. 감사합니다.`;
    
    navigator.clipboard.writeText(message).then(() => {
      showToast('✉️ 선생님 전송용 수정 요청 사항이 클립보드에 복사되었습니다!');
    }).catch(err => {
      console.error(err);
      showToast('클립보드 복사에 실패했습니다.');
    });
  };

  // 에디터 포커스 아웃 시 로컬스토리지 즉각 갱신
  const handleEditorBlur = () => {
    if (!currentStudent || !editorRef.current) return;
    const text = editorRef.current.innerText;
    setStudents(prev => prev.map(s => {
      if (s.id === currentStudent.id) {
        const rawErrors = inspectStudentRecord(text, s.name, { ...settings, customDictionary });
        const errors = rawErrors.filter(e => !(s.ignoredWords || []).includes(e.original));
        return { ...s, content: text, errors };
      }
      return s;
    }));
    applyHighlighting();
  };

  // 에러 카드 호버 시 에디터 단어 외곽선 강조
  const handleCardHover = (start, hoverState) => {
    if (!editorRef.current) return;
    const hlSpan = editorRef.current.querySelector(`span[data-start="${start}"]`);
    if (hlSpan) {
      hlSpan.style.outline = hoverState ? '2px solid var(--border-focus)' : 'none';
    }
  };

  const handleCardClick = (start) => {
    if (!editorRef.current) return;
    const hlSpan = editorRef.current.querySelector(`span[data-start="${start}"]`);
    if (hlSpan) {
      hlSpan.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // 에디터 바이트 수 계산
  const currentText = currentStudent?.content || '';
  const currentNEISBytes = useMemo(() => calculateNEISBytes(currentText), [currentText]);

  return (
    <div className="split-container">
      {/* 좌측: 명부 사이드바 */}
      <div className={`sidebar-student-list ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
              대상 학생 <span id="editor-student-count" style={{ color: 'var(--color-slang-text)', fontWeight: 700 }}>{uniqueStudents.length}</span>명
            </span>
            <button 
              onClick={() => setSidebarCollapsed(true)} 
              className="btn-icon" 
              title="목록 접기" 
              style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronsLeft style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
          
          <div className="search-box" style={{ marginTop: '4px' }}>
            <Search style={{ width: '14px', height: '14px' }} />
            <input 
              type="text" 
              placeholder="학생 이름 검색..." 
              style={{ fontSize: '12px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(e.target.value)} 
              className="editor-input" 
              style={{ padding: '3px 8px', fontSize: '12px', height: '28px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
            >
              <option value="all">전체 학년</option>
              {filterOptions.years.map(y => <option key={y} value={y}>{y}학년</option>)}
            </select>
            <select 
              value={filterClass} 
              onChange={(e) => setFilterClass(e.target.value)} 
              className="editor-input" 
              style={{ padding: '3px 8px', fontSize: '12px', height: '28px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
            >
              <option value="all">전체 반</option>
              {filterOptions.classes.map(c => <option key={c} value={c}>{c}반</option>)}
            </select>
          </div>
          <div style={{ marginTop: '6px' }}>
            <select 
              value={filterSubject} 
              onChange={(e) => setFilterSubject(e.target.value)} 
              className="editor-input" 
              style={{ width: '100%', padding: '3px 8px', fontSize: '12px', height: '28px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
            >
              <option value="all">전체 과목/활동</option>
              {sidebarSubjectOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
            </select>
          </div>
        </div>
        
        <div id="editor-student-list-container" style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {uniqueStudents.map((stud) => {
            const isActive = currentStudent && stud.name === currentStudent.name && stud.sNum === currentStudent.sNum;
            const studentRecords = students.filter(s => s.name === stud.name && s.sNum === stud.sNum);
            const totalErrors = studentRecords.reduce((sum, r) => sum + (r.errors ? r.errors.length : 0), 0);
            const hasErrors = totalErrors > 0;
            return (
              <div 
                key={stud.id}
                onClick={() => {
                  const record = students.find(s => 
                    s.name && stud.name &&
                    String(s.name).trim() === String(stud.name).trim() && 
                    String(s.sNum).trim() === String(stud.sNum).trim() && 
                    (filterSubject === 'all' ? true : String(s.subject).trim() === String(filterSubject).trim())
                  );
                  if (record) setCurrentStudentId(record.id);
                }}
                className={`student-list-item ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', marginBottom: '4px', backgroundColor: isActive ? 'var(--bg-selected)' : 'transparent' }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{stud.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    학번: {stud.sNum} ({studentRecords.length}개 과목)
                  </div>
                </div>
                {hasErrors ? (
                  <span className="error-badge" style={{ backgroundColor: 'var(--color-spelling-bg)', color: 'var(--color-spelling-text)', fontSize: '11px', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>
                    {totalErrors}
                  </span>
                ) : (
                  <CheckCircle style={{ width: '14px', height: '14px', color: 'var(--color-success-text)' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 우측: 에디터 및 검출 영역 */}
      <div className="editor-main-area" style={{ position: 'relative' }}>
        {sidebarCollapsed && !currentStudent && (
          <button 
            onClick={() => setSidebarCollapsed(false)}
            className="btn-icon" 
            title="목록 펼치기" 
            style={{ position: 'absolute', left: '16px', top: '16px', zIndex: 10, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '5px', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronsRight style={{ width: '16px', height: '16px' }} />
          </button>
        )}

        {!currentStudent ? (
          <div id="editor-empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>
            <Users style={{ width: '48px', height: '48px', color: 'var(--border-focus)', marginBottom: '12px' }} />
            <h4 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>선택된 학생 없음</h4>
            <p style={{ fontSize: '13px', maxWidth: '320px' }}>좌측 명부에서 작성 및 점검할 학생을 선택해 주세요.</p>
          </div>
        ) : (
          <div id="editor-active-container" className="inspection-container" style={{ display: 'flex', flex: 1 }}>
            
            {/* 에디터 패널 */}
            <div className="editor-panel">
              <div className="student-selector-bar">
                <div className="student-info-tag" style={{ display: 'flex', alignItems: 'center' }}>
                  {sidebarCollapsed && (
                    <button 
                      onClick={() => setSidebarCollapsed(false)}
                      className="btn-icon" 
                      title="목록 펼치기" 
                      style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '5px', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '8px' }}
                    >
                      <ChevronsRight style={{ width: '16px', height: '16px' }} />
                    </button>
                  )}
                  <strong style={{ fontSize: '16px' }}>{currentStudent.name}</strong>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--border-focus)', marginLeft: '8px', backgroundColor: 'rgba(28,114,203,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                    {currentStudent.subject || '과목 미지정'}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                    {currentStudent.year}학년도 {currentStudent.term} - {currentStudent.sNum || '학번 없음'}{currentStudent.teacher ? ` (${currentStudent.teacher} 교사)` : ''}
                  </span>
                </div>
                
                <div className="student-nav-buttons">
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => navigateStudent(-1)}
                    disabled={currentUniqueStudentIndex <= 0}
                    style={{ padding: '4px 8px', height: '30px' }}
                  >
                    <ChevronLeft style={{ width: '14px', height: '14px' }} />
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => navigateStudent(1)}
                    disabled={currentUniqueStudentIndex >= uniqueStudents.length - 1}
                    style={{ padding: '4px 8px', height: '30px' }}
                  >
                    <ChevronRight style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>

              <div className="editor-body-wrapper" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>

                {/* contenteditable 본문 에디터 */}
                <div className="editor-text-container" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', marginBottom: '12px' }}>
                  <div 
                    ref={editorRef}
                    className="editor-textarea" 
                    contentEditable 
                    suppressContentEditableWarning
                    spellCheck="false" 
                    onInput={handleEditorInput}
                    onBlur={handleEditorBlur}
                    style={{ flex: 1, overflowY: 'auto', outline: 'none', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '12px', fontSize: '14px', lineHeight: 1.6, backgroundColor: 'var(--bg-primary)', minHeight: '200px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexShrink: 0 }}>
                  <button onClick={copyRequestMessage} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', height: '38px', fontSize: '13px', fontWeight: 600, gap: '8px' }}>
                    <Send style={{ width: '15px', height: '15px' }} />
                    담당 선생님께 전송할 수정 요청 사항 복사
                  </button>
                  {settings.aiEnabled && (
                    <button 
                      onClick={() => runStudentAnalysis(currentStudentIndex, true)}
                      className="btn" 
                      style={{ height: '38px', fontSize: '13px', fontWeight: 600, gap: '6px', color: 'var(--color-primary)', borderColor: 'var(--border-focus)' }}
                    >
                      <Sparkles style={{ width: '14px', height: '14px' }} />
                      AI 정밀 진단
                    </button>
                  )}
                </div>

                <div className="editor-footer" style={{ flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>* 본문 강조 단어를 클릭하면 우측 카드로 바로 이동합니다.</span>
                  <div className="byte-counter">
                    <span>글자 수: <strong id="char-count">{currentText.length}</strong>자</span>
                    <span>NEIS 바이트: <strong id="byte-count" className="byte-badge">{currentNEISBytes}</strong> / 1500 Byte</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 우측 결과 패널 */}
            <div className="results-panel" style={{ width: '320px', flexShrink: 0, borderLeft: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
              <div className="results-header">
                <div className="results-title">
                  <AlertCircle style={{ width: '16px', height: '16px', color: 'var(--color-slang-text)' }} />
                  <span>발견된 오류 및 건의사항</span>
                  <span className="results-count-badge" id="errors-count-badge">
                    {currentStudent.errors ? currentStudent.errors.length : 0}
                  </span>
                </div>
              </div>

              {/* AI 피드백 총평 블록 */}
              {currentStudent.aiFeedback && (
                <div id="ai-general-feedback" style={{ padding: '12px', margin: '12px 12px 0 12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <MessageSquare style={{ width: '14px', height: '14px', color: 'var(--color-primary)' }} />
                    <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>AI 총평</strong>
                  </div>
                  <div id="ai-general-feedback-text" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {currentStudent.aiFeedback}
                  </div>
                </div>
              )}

              {/* 오류 목록 */}
              <div className="results-list" id="inspection-results-list" style={{ flex: 1, overflowY: 'auto' }}>
                {!currentStudent.errors || currentStudent.errors.length === 0 ? (
                  <div className="empty-state">
                    <CheckCircle style={{ width: '24px', height: '24px', color: 'var(--color-success-text)', marginBottom: '8px' }} />
                    <h4>검출된 오류 없음</h4>
                    <p>맞춤법 및 기재 지침에 어긋나는 오류가 발견되지 않았습니다.</p>
                  </div>
                ) : (
                  currentStudent.errors.map((err, idx) => (
                    <div 
                      key={idx}
                      className={`error-card card-${err.type}`}
                      onMouseEnter={() => handleCardHover(err.start, true)}
                      onMouseLeave={() => handleCardHover(err.start, false)}
                      onClick={() => handleCardClick(err.start)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="error-card-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span className="error-card-label">{err.label}</span>
                          <div className="error-card-actions">
                            <button 
                              className="btn-text btn-apply-fix" 
                              onClick={(e) => { e.stopPropagation(); applySingleFix(idx); }}
                            >
                              반영
                            </button>
                            <button 
                              className="btn-text btn-ignore-fix" 
                              onClick={(e) => { e.stopPropagation(); ignoreSingleError(err.original); }}
                            >
                              예외
                            </button>
                          </div>
                        </div>
                        <div className="error-card-match">
                          <del>{err.original}</del> 
                          <span style={{ color: 'var(--text-light)', margin: '0 4px', fontWeight: 400 }}>➔</span> 
                          <ins>{err.replace}</ins>
                        </div>
                        <div className="error-card-desc">{err.reason}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default StudentEditor;
