import React, { useState, useMemo } from 'react';
import { BookOpen, ChevronsLeft, ChevronsRight, Search, ChevronRight, CheckCircle } from 'lucide-react';

const SubjectView = ({ 
  students, 
  onNavigateToStudent, 
  showToast 
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterTerm, setFilterTerm] = useState('all');
  const [filterGrade, setFilterGrade] = useState('all');
  const [activeSubjectKey, setActiveSubjectKey] = useState(null);

  // 학번 파싱 도우미
  const parseGradeClassNumberFromSNum = (sNum) => {
    if (!sNum) return { grade: '', classVal: '', numberVal: '' };
    const num = String(sNum).trim();
    if (num.length === 5) {
      return {
        grade: num[0],
        classVal: String(parseInt(num.substring(1, 3))),
        numberVal: String(parseInt(num.substring(3, 5)))
      };
    } else if (num.length === 4) {
      return {
        grade: num[0],
        classVal: String(parseInt(num[1])),
        numberVal: String(parseInt(num.substring(2, 4)))
      };
    }
    return { grade: '', classVal: '', numberVal: '' };
  };

  // 고유 필터 리스트 계산
  const filterOptions = useMemo(() => {
    const years = new Set();
    const terms = new Set();
    const grades = new Set();

    students.forEach(s => {
      if (s.year) years.add(s.year);
      if (s.term) terms.add(s.term);
      const { grade } = parseGradeClassNumberFromSNum(s.sNum);
      if (grade) grades.add(grade);
    });

    return {
      years: Array.from(years).sort(),
      terms: Array.from(terms).sort(),
      grades: Array.from(grades).sort()
    };
  }, [students]);

  // 과목 그룹화 데이터 계산
  const subjectGroups = useMemo(() => {
    const groups = {}; // key: "year|term|gradeStr|subject" -> students array
    
    students.forEach(s => {
      const { grade } = parseGradeClassNumberFromSNum(s.sNum);
      const gradeStr = grade ? grade + '학년' : '학년없음';
      const sub = s.subject || '과목없음';

      // 필터
      if (filterYear !== 'all' && s.year !== filterYear) return;
      if (filterTerm !== 'all' && s.term !== filterTerm) return;
      if (filterGrade !== 'all' && grade !== filterGrade) return;
      if (searchTerm && !sub.toLowerCase().includes(searchTerm.toLowerCase())) return;

      const groupKey = `${s.year}|${s.term}|${gradeStr}|${sub}`;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(s);
    });

    return groups;
  }, [students, searchTerm, filterYear, filterTerm, filterGrade]);

  const groupKeys = useMemo(() => Object.keys(subjectGroups).sort(), [subjectGroups]);

  // 활성 과목 정보 계산
  const activeSubjectInfo = useMemo(() => {
    if (!activeSubjectKey || !subjectGroups[activeSubjectKey]) return null;
    const [year, term, gradeStr, subject] = activeSubjectKey.split('|');
    const studentsInGroup = [...subjectGroups[activeSubjectKey]].sort((a, b) => String(a.sNum).localeCompare(String(b.sNum)));
    return { year, term, gradeStr, subject, studentsInGroup };
  }, [activeSubjectKey, subjectGroups]);

  // 과목 선택 처리
  const selectSubject = (key) => {
    setActiveSubjectKey(key);
  };

  return (
    <div className="split-container">
      {/* 좌측 과목 리스트 */}
      <div className={`sidebar-student-list ${sidebarCollapsed ? 'collapsed' : ''}`} id="sidebar-subject-list">
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
              과목 목록 <span id="subject-list-count" style={{ color: 'var(--color-loanword-text)', fontWeight: 700 }}>{groupKeys.length}</span>개
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
              placeholder="과목 이름 검색..." 
              style={{ fontSize: '12px' }}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setActiveSubjectKey(null);
              }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '4px' }}>
            <select 
              value={filterYear} 
              onChange={(e) => { setFilterYear(e.target.value); setActiveSubjectKey(null); }} 
              className="editor-input" 
              style={{ padding: '3px 8px', fontSize: '11px', height: '28px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
            >
              <option value="all">전체 학년도</option>
              {filterOptions.years.map(y => <option key={y} value={y}>{y}학년도</option>)}
            </select>
            <select 
              value={filterTerm} 
              onChange={(e) => { setFilterTerm(e.target.value); setActiveSubjectKey(null); }} 
              className="editor-input" 
              style={{ padding: '3px 8px', fontSize: '11px', height: '28px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
            >
              <option value="all">전체 학기</option>
              {filterOptions.terms.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ marginTop: '4px' }}>
            <select 
              value={filterGrade} 
              onChange={(e) => { setFilterGrade(e.target.value); setActiveSubjectKey(null); }} 
              className="editor-input" 
              style={{ width: '100%', padding: '3px 8px', fontSize: '11px', height: '28px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
            >
              <option value="all">전체 학년</option>
              {filterOptions.grades.map(g => <option key={g} value={g}>{g}학년</option>)}
            </select>
          </div>
        </div>
        
        <div id="subject-list-container" style={{ flex: 1, overflowY: 'auto', padding: '6px' }}>
          {groupKeys.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              조건에 맞는 과목이 없습니다.
            </div>
          ) : (
            groupKeys.map(key => {
              const [year, term, gradeStr, subject] = key.split('|');
              const studentsInGroup = subjectGroups[key];
              const errCount = studentsInGroup.reduce((sum, s) => sum + (s.errors ? s.errors.length : 0), 0);
              const isActive = key === activeSubjectKey;

              const badgeStyle = errCount > 0
                ? { backgroundColor: 'var(--color-spelling-bg)', color: 'var(--color-spelling-text)' }
                : { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' };
              const badgeText = errCount > 0 ? `오류 ${errCount}건` : '정상';

              return (
                <div 
                  key={key}
                  onClick={() => selectSubject(key)}
                  className={`editor-student-item ${isActive ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background-color 0.15s ease', backgroundColor: isActive ? 'var(--bg-active)' : 'transparent' }}
                >
                  <div className="editor-student-item-info" style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    <div className="editor-student-item-name" style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {subject}
                    </div>
                    <div className="editor-student-item-snum" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {year}년도 {term} - {gradeStr} ({studentsInGroup.length}명)
                    </div>
                  </div>
                  <div className="editor-student-item-status" style={{ marginLeft: '8px' }}>
                    <span className="editor-student-status-badge" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, ...badgeStyle }}>
                      {badgeText}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 우측 과목 상세 및 수강 학생 카드 그리드 */}
      <div className="editor-main-area" id="subject-main-area">
        {sidebarCollapsed && (
          <button 
            onClick={() => setSidebarCollapsed(false)}
            className="btn-icon" 
            title="목록 펼치기" 
            style={{ position: 'absolute', left: '16px', top: '16px', zIndex: 10, border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', padding: '5px', cursor: 'pointer', color: 'var(--text-secondary)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ChevronsRight style={{ width: '16px', height: '16px' }} />
          </button>
        )}

        {!activeSubjectInfo ? (
          <div id="subject-empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', textAlign: 'center', padding: '32px' }}>
            <BookOpen style={{ width: '48px', height: '48px', color: 'var(--border-focus)', marginBottom: '12px' }} />
            <h4 style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)' }}>선택된 과목 없음</h4>
            <p style={{ fontSize: '13px', maxWidth: '320px' }}>좌측 목록에서 수강 학생들을 확인할 과목을 선택해 주세요.</p>
          </div>
        ) : (
          <div id="subject-active-container" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: '16px' }}>
            <div className="student-selector-bar" style={{ marginBottom: '12px', flexShrink: 0, backgroundColor: 'transparent', borderBottom: '1px solid var(--border-color)', padding: '0 0 12px 0', display: 'flex', alignItems: 'center' }}>
              <div className="student-info-tag" style={{ display: 'flex', alignItems: 'center' }}>
                <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{activeSubjectInfo.subject}</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                  {activeSubjectInfo.year}학년도 {activeSubjectInfo.term} - {activeSubjectInfo.gradeStr} ({activeSubjectInfo.studentsInGroup.length}명)
                </span>
              </div>
            </div>
            
            {/* 학생 카드 그리드 */}
            <div id="subject-student-cards-container" style={{ flex: 1, overflowY: 'auto', padding: '4px' }}>
              {activeSubjectInfo.studentsInGroup.map(s => {
                const { grade, classVal, numberVal } = parseGradeClassNumberFromSNum(s.sNum);
                const studentMeta = `${grade}학년 ${classVal}반 ${numberVal}번 - ${s.sNum || '학번없음'}`;
                const errCount = s.errors ? s.errors.length : 0;
                
                const badgeStyle = errCount > 0
                  ? { backgroundColor: 'var(--color-spelling-bg)', color: 'var(--color-spelling-text)' }
                  : { backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success-text)' };
                const badgeText = errCount > 0 ? `오류 ${errCount}건` : '정상';

                return (
                  <div 
                    key={s.id}
                    onClick={() => {
                      onNavigateToStudent(s.id);
                      showToast(`'${s.name}' 학생의 '${activeSubjectInfo.subject}' 교정 화면으로 이동했습니다.`);
                    }}
                    className="group-student-card" 
                    style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', backgroundColor: 'var(--bg-primary)', marginBottom: '8px', cursor: 'pointer', transition: 'all 0.2s ease' }}
                  >
                    <div className="group-card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{s.name}</strong>
                      <span className="editor-student-status-badge" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 600, ...badgeStyle }}>
                        {badgeText}
                      </span>
                    </div>
                    <div className="group-card-subtitle" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px', textAlign: 'left' }}>
                      {studentMeta}
                    </div>
                    <div className="group-card-desc" style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', maxHeight: '48px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-all', textAlign: 'left' }}>
                      {s.content || '내용 없음'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectView;
