import React, { useRef, useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, Search, Trash2, Download, Plus, 
  Sparkles, FileOutput, Filter, ArrowUpDown, 
  ChevronLeft, ChevronRight, Info 
} from 'lucide-react';

const Dashboard = ({ 
  students, 
  setStudents, 
  inspectAll, 
  goToEditor, 
  showToast 
}) => {
  const fileInputRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [sortBy, setSortBy] = useState('sNum-asc');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(30);
  const [selectedIds, setSelectedIds] = useState([]);

  // 학년, 반 파싱 유틸리티 함수
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

  // 통계 계산
  const stats = useMemo(() => {
    const total = students.length;
    const totalRecords = students.length; // 각 행이 하나의 레코드
    let totalErrors = 0;
    let forbiddenErrors = 0;

    students.forEach(s => {
      if (s.errors) {
        totalErrors += s.errors.length;
        forbiddenErrors += s.errors.filter(e => e.type === 'forbidden').length;
      }
    });

    return { total, totalRecords, totalErrors, forbiddenErrors };
  }, [students]);

  // 필터 옵션 추출
  const filterOptions = useMemo(() => {
    const years = new Set();
    const classes = new Set();
    const subjects = new Set();

    students.forEach(s => {
      const { grade, classVal } = parseGradeAndClass(s.sNum);
      if (grade) years.add(grade);
      if (classVal) classes.add(classVal);
      if (s.subject) subjects.add(s.subject);
    });

    return {
      years: Array.from(years).sort(),
      classes: Array.from(classes).sort(),
      subjects: Array.from(subjects).sort()
    };
  }, [students]);

  // 엑셀 파싱 핸들러
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    const isCSV = file.name.toLowerCase().endsWith('.csv');

    reader.onload = (evt) => {
      let workbook;
      try {
        if (isCSV) {
          const text = evt.target.result;
          workbook = XLSX.read(text, { type: 'string', codepage: 65001 });
        } else {
          const data = new Uint8Array(evt.target.result);
          workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
        }

        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          showToast('유효한 시트가 없는 파일입니다.');
          return;
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (!rows || rows.length < 2) {
          showToast('파일에 분석할 수 있는 데이터 열이 존재하지 않습니다.');
          return;
        }

        const headers = rows[0].map(h => h ? String(h).replace(/^\ufeff/, '').trim() : '');
        
        const colMap = {
          type: headers.findIndex(h => h.includes('구분') || h.includes('종류')),
          year: headers.findIndex(h => h.includes('학년도') || h.includes('연도')),
          term: headers.findIndex(h => h.includes('학기')),
          sNum: headers.findIndex(h => h.includes('학번') || h.includes('번호')),
          name: headers.findIndex(h => h.includes('이름') || h.includes('성명')),
          subject: headers.findIndex(h => h.includes('과목') || h.includes('주제') || h.includes('활동')),
          content: headers.findIndex(h => h.includes('내용') || h.includes('특기사항') || h.includes('세부특기')),
          teacher: headers.findIndex(h => h.includes('교사') || h.includes('선생님') || h.includes('담당'))
        };

        if (colMap.name === -1 && colMap.content === -1) {
          colMap.type = 0;
          colMap.year = 1;
          colMap.term = 2;
          colMap.sNum = 3;
          colMap.name = 4;
          colMap.subject = 5;
          colMap.content = 6;
          colMap.teacher = 7;
        }

        const newStudents = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const getRowVal = (colIdx) => {
            if (colIdx === -1 || colIdx === undefined || colIdx >= row.length) return '';
            const val = row[colIdx];
            return (val === null || val === undefined) ? '' : String(val).trim();
          };

          const nameVal = getRowVal(colMap.name);
          const contentVal = getRowVal(colMap.content);
          
          if (!nameVal && !contentVal) continue;

          newStudents.push({
            id: 'stud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            type: colMap.type !== -1 ? (getRowVal(colMap.type) || '세특') : '세특',
            year: colMap.year !== -1 ? (getRowVal(colMap.year) || String(new Date().getFullYear())) : String(new Date().getFullYear()),
            term: colMap.term !== -1 ? (getRowVal(colMap.term) || '1학기') : '1학기',
            sNum: colMap.sNum !== -1 ? getRowVal(colMap.sNum) : '',
            name: nameVal,
            subject: colMap.subject !== -1 ? getRowVal(colMap.subject) : '',
            content: contentVal,
            teacher: colMap.teacher !== -1 ? getRowVal(colMap.teacher) : '',
            errors: [],
            checked: false
          });
        }

        if (newStudents.length > 0) {
          setStudents(prev => [...prev, ...newStudents]);
          showToast(`${newStudents.length}명의 학생 데이터를 성공적으로 불러왔습니다!`);
        } else {
          showToast('불러올 학생 데이터가 없습니다.');
        }
      } catch (err) {
        console.error(err);
        showToast('엑셀 파일을 읽는 과정에서 오류가 발생했습니다.');
      }
    };

    if (isCSV) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // 학생 추가 기능
  const addNewStudentRow = () => {
    const newStudent = {
      id: 'stud_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      type: '세특',
      year: String(new Date().getFullYear()),
      term: '1학기',
      sNum: '',
      name: '',
      subject: '',
      content: '',
      teacher: '',
      errors: [],
      checked: false
    };
    setStudents(prev => [newStudent, ...prev]);
    setCurrentPage(1);
    showToast('새 학생 행이 추가되었습니다. 테이블 셀을 더블클릭하여 내용을 입력하세요.');
  };

  // 개별 셀 수정 기능
  const handleCellBlur = (studentId, field, value) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        if (s[field] !== value) {
          return { ...s, [field]: value };
        }
      }
      return s;
    }));
  };

  // 단일 학생 삭제
  const deleteStudent = (studentId) => {
    if (confirm('이 학생 데이터를 삭제하시겠습니까?')) {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      setSelectedIds(prev => prev.filter(id => id !== studentId));
      showToast('삭제되었습니다.');
    }
  };

  // 선택 삭제 기능
  const deleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`선택한 ${selectedIds.length}명의 학생 데이터를 삭제하시겠습니까?`)) {
      setStudents(prev => prev.filter(s => !selectedIds.includes(s.id)));
      setSelectedIds([]);
      showToast('선택한 학생 정보가 삭제되었습니다.');
    }
  };

  // 엑셀 저장 기능
  const exportCheckedDataToExcel = () => {
    const headers = ['구분', '학년도', '학기', '학번', '이름', '과목명/주제명', '담당 교사', '내용 (생활기록부 세부 특기사항)', '검출 오류 수'];
    const rows = [headers];
    
    students.forEach(s => {
      rows.push([
        s.type,
        s.year,
        s.term,
        s.sNum,
        s.name,
        s.subject,
        s.teacher || '',
        s.content,
        s.errors ? s.errors.length : 0
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "생활기록부_점검결과");
    
    XLSX.writeFile(workbook, `생활기록부_점검_완료_${new Date().toISOString().substring(0, 10)}.xlsx`);
    showToast('검사 완료된 생활기록부 엑셀 저장이 성공적으로 완료되었습니다.');
  };

  // 샘플 엑셀 다운로드
  const downloadSampleExcel = () => {
    const sampleHeaders = ['구분', '학년도', '학기', '학번', '이름', '과목명/주제명', '담당 교사', '내용 (생활기록부 세부 특기사항)'];
    const sampleRows = [
      sampleHeaders,
      ['세특', '2026', '1학기', '30101', '김철수', '물리학I', '김물리', '수업 시간에 집중력이 매우 뛰어나며 모둠 활동에서 중추적 역활을 성실히 수행함  특히 물리 실험 시물레이션 프로그램을 제작년보다 훨씬 정교하게 구현하여 동료들의 극찬을 받음'],
      ['세특', '2026', '1학기', '30102', '이영희', '정보과학', '박정보', '정보과학 교과의 알고리즘 설계 과정에서 개이득을 취하기 위해 꼼꼼이 준비함. 영희는 평소 영어 학습에도 흥미가 깊어 토익 시험을 꾸준히 준비함'],
      ['주제선택', '2026', '1학기', '30103', '박민수', '창의융합과학', '최융합', '다양한 융합 실험을 기획하고 이끄는 역량이 탁월함. 탐구 결과 보고서를 작성하는 과정에서 띄어쓰기와 맞춤법을 정확히 준수하며 가짐으로 성숙한 학술적 태도가 됬다']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "생기부_점검_샘플");
    
    XLSX.writeFile(workbook, "생기부_점검_테스트_샘플.xlsx");
    showToast('테스트용 샘플 엑셀 파일을 다운로드했습니다.');
  };

  // 필터 및 정렬 처리된 데이터 계산
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. 검색어 필터
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchSearch = (
          s.name.toLowerCase().includes(query) ||
          s.sNum.toLowerCase().includes(query) ||
          s.subject.toLowerCase().includes(query) ||
          s.content.toLowerCase().includes(query)
        );
        if (!matchSearch) return false;
      }

      // 2. 학년 필터
      if (filterYear !== 'all') {
        const { grade } = parseGradeAndClass(s.sNum);
        if (grade !== filterYear) return false;
      }

      // 3. 반 필터
      if (filterClass !== 'all') {
        const { classVal } = parseGradeAndClass(s.sNum);
        if (classVal !== filterClass) return false;
      }

      // 4. 과목 필터
      if (filterSubject !== 'all') {
        if (s.subject !== filterSubject) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'sNum-asc') {
        return String(a.sNum).localeCompare(String(b.sNum));
      } else if (sortBy === 'sNum-desc') {
        return String(b.sNum).localeCompare(String(a.sNum));
      } else if (sortBy === 'name-asc') {
        return String(a.name).localeCompare(String(b.name));
      } else if (sortBy === 'subject-asc') {
        return String(a.subject).localeCompare(String(b.subject));
      } else if (sortBy === 'errors-desc') {
        return (b.errors ? b.errors.length : 0) - (a.errors ? a.errors.length : 0);
      }
      return 0;
    });
  }, [students, searchTerm, filterYear, filterClass, filterSubject, sortBy]);

  // 페이지 데이터
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage) || 1;
  const pageData = useMemo(() => {
    const startIdx = (currentPage - 1) * rowsPerPage;
    return filteredStudents.slice(startIdx, startIdx + rowsPerPage);
  }, [filteredStudents, currentPage, rowsPerPage]);

  // 선택박스 토글
  const toggleSelectRow = (id) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(pageData.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected = pageData.length > 0 && pageData.every(s => selectedIds.includes(s.id));

  // Drag and Drop Zone event handlers
  const [dragOver, setDragOver] = useState(false);
  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => {
    setDragOver(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleExcelUpload({ target: { files: e.dataTransfer.files } });
    }
  };

  return (
    <div className="data-tab-wrapper">
      {/* 대시보드 요약 */}
      <div className="dashboard-summary">
        <div className="summary-card">
          <span className="summary-label">전체 학생 수</span>
          <span className="summary-value">{stats.total}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">전체 기록(행) 수</span>
          <span className="summary-value">{stats.totalRecords}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">검출된 오류 수</span>
          <span className="summary-value">{stats.totalErrors}</span>
        </div>
        <div className="summary-card">
          <span className="summary-label">기재 금지 위반 수</span>
          <span className="summary-value">{stats.forbiddenErrors}</span>
        </div>
      </div>

      {/* 업로드 존 */}
      <div 
        className="upload-zone" 
        onClick={() => fileInputRef.current.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          borderColor: dragOver ? 'var(--border-focus)' : 'var(--border-color)',
          backgroundColor: dragOver ? 'rgba(35, 131, 226, 0.05)' : 'var(--bg-secondary)'
        }}
      >
        <UploadCloud />
        <h3>엑셀(XLSX / CSV) 파일 업로드</h3>
        <p>여기로 파일을 드래그하거나 클릭하여 파일을 선택해 주세요.</p>
        <p style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-light)' }}>
          (학년도, 학기, 학번, 이름, 과목명, 내용 항목이 포함된 엑셀을 업로드하세요)
        </p>
      </div>

      {/* 테이블 제어 */}
      <div className="table-controls">
        <div className="search-box">
          <Search />
          <input 
            type="text" 
            placeholder="이름, 학번, 과목 검색..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          {selectedIds.length > 0 && (
            <button 
              className="btn btn-danger" 
              onClick={deleteSelected}
              style={{ backgroundColor: 'var(--color-spelling-bg)', color: 'var(--color-spelling-text)', borderColor: 'rgba(212,64,39,0.15)', display: 'inline-flex' }}
            >
              <Trash2 style={{ width: '14px', height: '14px', marginRight: '4px' }} />
              <span>선택 삭제 ({selectedIds.length})</span>
            </button>
          )}
          <button className="btn" onClick={downloadSampleExcel}>
            <Download style={{ width: '14px', height: '14px', marginRight: '4px' }} />
            <span>샘플 양식 다운로드</span>
          </button>
          <button className="btn btn-secondary" onClick={addNewStudentRow}>
            <Plus style={{ width: '14px', height: '14px', marginRight: '4px' }} />
            <span>학생 추가</span>
          </button>
          <button className="btn btn-primary" onClick={inspectAll}>
            <Sparkles style={{ width: '14px', height: '14px', marginRight: '4px' }} />
            <span>일괄 분석 시작</span>
          </button>
          {students.length > 0 && (
            <button className="btn" onClick={exportCheckedDataToExcel}>
              <FileOutput style={{ width: '14px', height: '14px', marginRight: '4px' }} />
              <span>점검 완료 엑셀 저장</span>
            </button>
          )}
        </div>
      </div>

      {/* 필터 툴바 */}
      <div className="filter-toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', padding: '10px 0', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', fontSize: '13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter style={{ width: '14px', height: '14px', color: 'var(--text-secondary)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>필터:</span>
        </div>
        
        <select 
          value={filterYear} 
          onChange={(e) => { setFilterYear(e.target.value); setCurrentPage(1); }} 
          className="editor-input" 
          style={{ padding: '3px 8px', fontSize: '12px', height: '28px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
        >
          <option value="all">학년: 전체</option>
          {filterOptions.years.map(y => <option key={y} value={y}>{y}학년</option>)}
        </select>
        
        <select 
          value={filterClass} 
          onChange={(e) => { setFilterClass(e.target.value); setCurrentPage(1); }} 
          className="editor-input" 
          style={{ padding: '3px 8px', fontSize: '12px', height: '28px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
        >
          <option value="all">반: 전체</option>
          {filterOptions.classes.map(c => <option key={c} value={c}>{c}반</option>)}
        </select>

        <select 
          value={filterSubject} 
          onChange={(e) => { setFilterSubject(e.target.value); setCurrentPage(1); }} 
          className="editor-input" 
          style={{ padding: '3px 8px', fontSize: '12px', height: '28px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
        >
          <option value="all">과목/활동: 전체</option>
          {filterOptions.subjects.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ArrowUpDown style={{ width: '14px', height: '14px', color: 'var(--text-secondary)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>정렬:</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)} 
            className="editor-input" 
            style={{ padding: '3px 8px', fontSize: '12px', height: '28px', width: '145px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
          >
            <option value="sNum-asc">학번 순 (오름차순)</option>
            <option value="sNum-desc">학번 순 (내림차순)</option>
            <option value="name-asc">이름 순</option>
            <option value="subject-asc">과목 순</option>
            <option value="errors-desc">오류 많은 순</option>
          </select>
        </div>
      </div>

      {/* 테이블 그리드 */}
      <div className="table-wrapper">
        <table className="notion-table">
          <thead>
            <tr>
              <th style={{ width: '30px', textAlign: 'center' }}>
                <input 
                  type="checkbox" 
                  checked={isAllSelected}
                  onChange={(e) => toggleSelectAll(e.target.checked)} 
                />
              </th>
              <th style={{ width: '50px' }}>구분</th>
              <th style={{ width: '70px' }}>학년도</th>
              <th style={{ width: '50px' }}>학기</th>
              <th style={{ width: '80px' }}>학번</th>
              <th style={{ width: '90px' }}>이름</th>
              <th style={{ width: '120px' }}>과목명 / 주제명</th>
              <th>내용 (생활기록부 세부 특기사항)</th>
              <th style={{ width: '120px' }}>검출 오류</th>
              <th style={{ width: '80px' }}>작업</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px 0' }}>
                  <Info style={{ verticalAlign: 'middle', marginRight: '4px', display: 'inline-block', width: '16px', height: '16px' }} />
                  등록된 학생 데이터가 없습니다. 직접 추가하거나 엑셀 파일을 업로드해 주세요.
                </td>
              </tr>
            ) : (
              pageData.map((stud) => {
                const hasErrors = stud.errors && stud.errors.length > 0;
                
                // 에러 요약 그리기
                const errorSummary = {};
                if (hasErrors) {
                  stud.errors.forEach(err => {
                    errorSummary[err.label] = (errorSummary[err.label] || 0) + 1;
                  });
                }

                return (
                  <tr key={stud.id}>
                    <td style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(stud.id)}
                        onChange={() => toggleSelectRow(stud.id)} 
                      />
                    </td>
                    {['type', 'year', 'term', 'sNum', 'name', 'subject'].map(field => (
                      <td 
                        key={field}
                        className="editable-cell" 
                        contentEditable 
                        suppressContentEditableWarning
                        onBlur={(e) => handleCellBlur(stud.id, field, e.target.innerText.trim())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.target.blur();
                          }
                        }}
                      >
                        {stud[field]}
                      </td>
                    ))}
                    <td 
                      className="editable-cell" 
                      style={{ textAlign: 'left', cursor: 'pointer' }}
                      title="클릭하여 점검하기"
                      onClick={() => goToEditor(stud.id)}
                    >
                      {stud.content}
                    </td>
                    <td style={{ textAlign: 'left' }}>
                      {!hasErrors ? (
                        <span style={{ color: 'var(--color-success-text)', fontWeight: 600 }}>정상</span>
                      ) : (
                        Object.entries(errorSummary).map(([label, count]) => {
                          let style = { fontSize: '11px', padding: '2px 5px', borderRadius: '3px', fontWeight: 600, marginRight: '4px', display: 'inline-block', marginBottom: '2px' };
                          if (label.includes('맞춤법') || label.includes('기재 금지')) {
                            style = { ...style, color: 'var(--color-spelling-text)', backgroundColor: 'var(--color-spelling-bg)' };
                          } else if (label.includes('은어')) {
                            style = { ...style, color: 'var(--color-slang-text)', backgroundColor: 'var(--color-slang-bg)' };
                          } else {
                            style = { ...style, color: '#37352f', backgroundColor: 'var(--bg-selected)' };
                          }
                          return (
                            <span key={label} style={style}>
                              {label} {count}
                            </span>
                          );
                        })
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="action-icon-btn btn-inspect" title="점검하기" onClick={() => goToEditor(stud.id)}>
                          <Search style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button className="action-icon-btn btn-delete" style={{ color: 'var(--color-spelling-text)' }} title="삭제" onClick={() => deleteStudent(stud.id)}>
                          <Trash2 style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 */}
      <div className="pagination-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>페이지당 표시 행 수:</span>
          <select 
            value={rowsPerPage} 
            onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setCurrentPage(1); }} 
            className="editor-input" 
            style={{ padding: '2px 6px', fontSize: '12px', height: '26px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', borderRadius: '4px', color: 'var(--text-primary)' }}
          >
            <option value={20}>20개</option>
            <option value={30}>30개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{ padding: '2px 8px', fontSize: '12px', height: '26px', opacity: currentPage === 1 ? '0.4' : '1', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
          >
            <ChevronLeft style={{ width: '12px', height: '12px', verticalAlign: 'middle', marginRight: '2px' }} />
            <span style={{ verticalAlign: 'middle' }}>이전</span>
          </button>
          <span style={{ fontWeight: 500 }}>{currentPage} / {totalPages} 페이지</span>
          <button 
            className="btn btn-secondary" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{ padding: '2px 8px', fontSize: '12px', height: '26px', opacity: currentPage === totalPages ? '0.4' : '1', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
          >
            <span style={{ verticalAlign: 'middle', marginRight: '2px' }}>다음</span>
            <ChevronRight style={{ width: '12px', height: '12px', verticalAlign: 'middle' }} />
          </button>
        </div>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept=".xlsx, .xls, .csv" 
        onChange={handleExcelUpload} 
      />
    </div>
  );
};

export default Dashboard;
