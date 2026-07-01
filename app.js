/**
 * 생활기록부 점검 프로그램 - 애플리케이션 제어 로직 (app.js)
 */

// 1. 상태 객체 정의
const state = {
  students: [], // 학생 데이터 목록
  currentStudentIndex: -1, // 현재 점검 중인 학생 인덱스
  customDictionary: {}, // { '오류단어': { replace: '대체어', reason: '이유' } }
  settings: {
    spelling: true,
    slang: true,
    loanword: true,
    spacing: true,
    endingDot: true,
    forbidden: true,
    nameCheck: true
  },
  searchTerm: '',
  isEditingCell: false, // 테이블 셀 편집 중 여부
  currentPage: 1,       // 현재 페이지
  rowsPerPage: 30,      // 페이지당 행 갯수
  filters: {            // 학년, 반, 과목별 필터
    year: 'all',
    class: 'all',
    subject: 'all'
  },
  sortBy: 'sNum-asc',    // 정렬 방식
  editorFilters: {       // 에디터 좌측 명부 필터
    searchTerm: '',
    year: 'all',
    class: 'all'
  }
};

// 2. DOM 요소 참조
const DOM = {
  menuItems: document.querySelectorAll('.menu-item'),
  tabs: document.querySelectorAll('.tab-content'),
  pageTitle: document.getElementById('current-page-title'),
  
  // Tab 1: 데이터 관리
  statsTotalStudents: document.getElementById('stats-total-students'),
  statsCheckedStudents: document.getElementById('stats-checked-students'),
  statsTotalErrors: document.getElementById('stats-total-errors'),
  statsForbiddenErrors: document.getElementById('stats-forbidden-errors'),
  excelUploadZone: document.getElementById('excel-upload-zone'),
  excelFileInput: document.getElementById('excel-file-input'),
  studentSearchInput: document.getElementById('student-search-input'),
  studentTableBody: document.getElementById('student-table-body'),
  btnDownloadSample: document.getElementById('btn-download-sample'),
  btnAddRow: document.getElementById('btn-add-row'),
  btnInspectAllNav: document.getElementById('btn-inspect-all-nav'),
  btnExportExcel: document.getElementById('btn-export-excel'),
  btnDeleteSelected: document.getElementById('btn-delete-selected'),
  thSelectAll: document.getElementById('th-select-all'),
  selectRowsPerPage: document.getElementById('select-rows-per-page'),
  btnPrevPage: document.getElementById('btn-prev-page'),
  btnNextPage: document.getElementById('btn-next-page'),
  txtPageInfo: document.getElementById('txt-page-info'),
  filterYear: document.getElementById('filter-year'),
  filterClass: document.getElementById('filter-class'),
  filterSubject: document.getElementById('filter-subject'),
  sortCriteria: document.getElementById('sort-criteria'),
  
  // Tab 2: 점검 및 수정 (2단 분할 레이아웃 개편)
  editorStudentCount: document.getElementById('editor-student-count'),
  editorStudentSearch: document.getElementById('editor-student-search'),
  editorStudentFilterYear: document.getElementById('editor-student-filter-year'),
  editorStudentFilterClass: document.getElementById('editor-student-filter-class'),
  editorStudentListContainer: document.getElementById('editor-student-list-container'),
  editorEmptyState: document.getElementById('editor-empty-state'),
  editorActiveContainer: document.getElementById('editor-active-container'),
  currentStudentName: document.getElementById('current-student-name'),
  currentStudentMeta: document.getElementById('current-student-meta'),
  btnPrevStudent: document.getElementById('btn-prev-student'),
  btnNextStudent: document.getElementById('btn-next-student'),
  editorSubjectSelect: document.getElementById('editor-subject-select'),
  editorSubjectDirectInput: document.getElementById('editor-subject-direct-input'),
  editableContent: document.getElementById('editable-content'),
  charCount: document.getElementById('char-count'),
  byteCount: document.getElementById('byte-count'),
  errorsCountBadge: document.getElementById('errors-count-badge'),
  btnApplyAllFixes: document.getElementById('btn-apply-all-fixes'),
  inspectionResultsList: document.getElementById('inspection-results-list'),
  
  // Tab 3: 설정
  settingSpelling: document.getElementById('setting-spelling'),
  settingSlang: document.getElementById('setting-slang'),
  settingLoanword: document.getElementById('setting-loanword'),
  settingSpacing: document.getElementById('setting-spacing'),
  settingEndingDot: document.getElementById('setting-endingDot'),
  settingForbidden: document.getElementById('setting-forbidden'),
  settingNameCheck: document.getElementById('setting-nameCheck'),
  customDictionaryList: document.getElementById('custom-dictionary-list'),
  btnAddDictRow: document.getElementById('btn-add-dict-row'),
  
  // Toast 알림
  toastContainer: document.getElementById('toast-container')
};

// 3. 초기화 로직
function initializeApp() {
  console.log("[DEBUG] initializeApp() 실행 시작");
  loadLocalStorage();
  initEventListeners();
  initSettingsUI();
  renderCustomDictionary();
  updateDashboardStats();
  lucide.createIcons();
  console.log("[DEBUG] initializeApp() 완료");
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// 4. 로컬 스토리지 불러오기/저장
function loadLocalStorage() {
  const savedSettings = localStorage.getItem('s_record_settings');
  if (savedSettings) {
    state.settings = { ...state.settings, ...JSON.parse(savedSettings) };
  }
  
  const savedDict = localStorage.getItem('s_record_dict');
  if (savedDict) {
    state.customDictionary = JSON.parse(savedDict);
  }

  const savedStudents = localStorage.getItem('s_record_students');
  if (savedStudents) {
    state.students = JSON.parse(savedStudents);
    // 복구된 데이터에 대한 전체 재검사
    runAnalysisOnAllStudents();
    updateFilterDropdowns();
  }
}

function saveSettingsToStorage() {
  localStorage.setItem('s_record_settings', JSON.stringify(state.settings));
}

function saveDictToStorage() {
  localStorage.setItem('s_record_dict', JSON.stringify(state.customDictionary));
}

function saveStudentsToStorage() {
  localStorage.setItem('s_record_students', JSON.stringify(state.students));
}

// 5. 이벤트 리스너 등록
function initEventListeners() {
  // 5.1. 탭 전환 (모든 메뉴 아이템 동적 쿼리 후 바인딩)
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      switchTab(targetTab);
    });
  });

  // 5.2. 엑셀 업로드 관련
  DOM.excelUploadZone.addEventListener('click', () => DOM.excelFileInput.click());
  DOM.excelFileInput.addEventListener('change', handleExcelUpload);
  
  DOM.excelUploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    DOM.excelUploadZone.style.borderColor = 'var(--border-focus)';
    DOM.excelUploadZone.style.backgroundColor = 'rgba(35, 131, 226, 0.05)';
  });
  
  DOM.excelUploadZone.addEventListener('dragleave', () => {
    DOM.excelUploadZone.style.borderColor = 'var(--border-color)';
    DOM.excelUploadZone.style.backgroundColor = 'var(--bg-secondary)';
  });
  
  DOM.excelUploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    DOM.excelUploadZone.style.borderColor = 'var(--border-color)';
    DOM.excelUploadZone.style.backgroundColor = 'var(--bg-secondary)';
    
    if (e.dataTransfer.files.length > 0) {
      DOM.excelFileInput.files = e.dataTransfer.files;
      handleExcelUpload({ target: DOM.excelFileInput });
    }
  });

  // 5.3. 데이터 테이블 조작
  let searchTimeout;
  DOM.studentSearchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.searchTerm = e.target.value;
      state.currentPage = 1; // 검색 시 첫 페이지로 리셋
      if (DOM.thSelectAll) DOM.thSelectAll.checked = false;
      toggleDeleteSelectedButton();
      renderStudentTable();
    }, 250); // 250ms 디바운싱
  });

  DOM.btnAddRow.addEventListener('click', addNewStudentRow);
  DOM.btnInspectAllNav.addEventListener('click', () => {
    if (state.students.length === 0) {
      showToast('점검할 학생 데이터를 먼저 추가해 주세요.');
      return;
    }
    runAnalysisOnAllStudents();
    showToast('모든 학생 데이터 분석이 완료되었습니다!');
    // 분석 후 바로 에디터 탭으로 이동
    if (state.students.length > 0) {
      state.currentStudentIndex = 0;
      loadStudentIntoEditor(0);
    }
    switchTab('student-group-view');
  });
  DOM.btnExportExcel.addEventListener('click', exportCheckedDataToExcel);
  DOM.btnDownloadSample.addEventListener('click', downloadSampleExcel);

  // 전체 선택 체크박스 변경
  DOM.thSelectAll.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    const checkboxes = DOM.studentTableBody.querySelectorAll('.td-select-row');
    checkboxes.forEach(cb => {
      cb.checked = isChecked;
    });
    toggleDeleteSelectedButton();
  });

  // 선택 삭제 버튼 클릭
  DOM.btnDeleteSelected.addEventListener('click', () => {
    const checkedBoxes = DOM.studentTableBody.querySelectorAll('.td-select-row:checked');
    if (checkedBoxes.length === 0) return;

    if (confirm(`선택한 ${checkedBoxes.length}명의 학생 데이터를 삭제하시겠습니까?`)) {
      const idsToDelete = Array.from(checkedBoxes).map(cb => cb.getAttribute('data-id'));
      
      // 상태에서 일괄 제거
      state.students = state.students.filter(s => !idsToDelete.includes(s.id));
      
      // 현재 인덱스 조절
      if (state.currentStudentIndex !== -1) {
        if (state.students.length === 0) {
          state.currentStudentIndex = -1;
        } else if (state.currentStudentIndex >= state.students.length) {
          state.currentStudentIndex = state.students.length - 1;
        }
      }

      DOM.thSelectAll.checked = false;
      toggleDeleteSelectedButton();
      saveStudentsToStorage();
      updateDashboardStats();
      updateFilterDropdowns();
      renderStudentTable();
      showToast(`선택한 ${idsToDelete.length}명의 학생 정보가 삭제되었습니다.`);
    }
  });

  // 페이지당 표시 행수 변경
  DOM.selectRowsPerPage.addEventListener('change', (e) => {
    state.rowsPerPage = parseInt(e.target.value);
    state.currentPage = 1;
    renderStudentTable();
  });

  // 이전 페이지 이동
  DOM.btnPrevPage.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderStudentTable();
    }
  });

  // 다음 페이지 이동
  DOM.btnNextPage.addEventListener('click', () => {
    const filteredCount = state.students.filter(s => {
      if (!state.searchTerm) return true;
      const query = state.searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        s.sNum.toLowerCase().includes(query) ||
        s.subject.toLowerCase().includes(query) ||
        s.content.toLowerCase().includes(query)
      );
    }).length;
    const totalPages = Math.ceil(filteredCount / state.rowsPerPage) || 1;
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderStudentTable();
    }
  });

  // 학년, 반, 과목 필터 및 정렬 변경 시 리로드
  const filtersList = ['filterYear', 'filterClass', 'filterSubject', 'sortCriteria'];
  filtersList.forEach(key => {
    if (DOM[key]) {
      DOM[key].addEventListener('change', () => {
        state.currentPage = 1;
        renderStudentTable();
      });
    }
  });

  // 5.4. 에디터 조작
  DOM.btnPrevStudent.addEventListener('click', () => navigateStudent(-1));
  DOM.btnNextStudent.addEventListener('click', () => navigateStudent(1));
  
  // 과목 선택 변경 시 반영
  if (DOM.editorSubjectSelect) {
    DOM.editorSubjectSelect.addEventListener('change', (e) => {
      if (state.currentStudentIndex === -1) return;
      const stud = state.students[state.currentStudentIndex];
      const val = e.target.value;
      
      if (val === '__direct__') {
        // 직접 입력 모드로 전환
        DOM.editorSubjectSelect.style.display = 'none';
        DOM.editorSubjectDirectInput.style.display = 'block';
        DOM.editorSubjectDirectInput.value = stud.subject || '';
        DOM.editorSubjectDirectInput.focus();
      } else {
        stud.subject = val;
        saveStudentsToStorage();
        renderStudentTable();
        updateFilterDropdowns();
        renderEditorStudentList();
      }
    });
  }

  if (DOM.editorSubjectDirectInput) {
    const updateDirectSubject = (e) => {
      if (state.currentStudentIndex === -1) return;
      const stud = state.students[state.currentStudentIndex];
      const val = e.target.value.trim();
      stud.subject = val;
      saveStudentsToStorage();
      renderStudentTable();
      updateFilterDropdowns();
    };

    DOM.editorSubjectDirectInput.addEventListener('input', updateDirectSubject);
    
    // 포커스를 잃었을 때 새로 기입된 과목명을 목록에 복구
    DOM.editorSubjectDirectInput.addEventListener('blur', (e) => {
      const val = e.target.value.trim();
      DOM.editorSubjectSelect.style.display = 'block';
      DOM.editorSubjectDirectInput.style.display = 'none';
      if (val && state.currentStudentIndex !== -1) {
        loadStudentIntoEditor(state.currentStudentIndex);
      }
    });
  }

  // 에디터 좌측 학생 명부 검색창 디바운싱
  let editorSearchTimeout;
  if (DOM.editorStudentSearch) {
    DOM.editorStudentSearch.addEventListener('input', (e) => {
      clearTimeout(editorSearchTimeout);
      editorSearchTimeout = setTimeout(() => {
        state.editorFilters.searchTerm = e.target.value;
        renderEditorStudentList();
      }, 250);
    });
  }

  // 에디터 학년/반 필터 변경 시
  if (DOM.editorStudentFilterYear) {
    DOM.editorStudentFilterYear.addEventListener('change', (e) => {
      state.editorFilters.year = e.target.value;
      renderEditorStudentList();
    });
  }
  if (DOM.editorStudentFilterClass) {
    DOM.editorStudentFilterClass.addEventListener('change', (e) => {
      state.editorFilters.class = e.target.value;
      renderEditorStudentList();
    });
  }

  // 실시간 에디터 입력 및 디바운싱 점검
  let debounceTimeout;
  DOM.editableContent.addEventListener('input', () => {
    if (state.currentStudentIndex === -1) return;
    
    const text = DOM.editableContent.innerText;
    
    // 글자 수 및 바이트 실시간 업데이트 (커서 무너짐을 막기 위해 마크업 제어는 나중에)
    updateEditorFooterStats(text);
    
    // 타이핑 중에는 하이라이트를 다시 그리지 않고, 1초 동안 입력을 멈췄을 때만 하이라이트 복원
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      // 커서 위치 저장 후 텍스트 하이라이트 갱신
      const selection = window.getSelection();
      let offset = 0;
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        // 에디터 내에서의 캐럿 절대 오프셋 계산 유틸 필요
        offset = getCaretCharacterOffsetWithin(DOM.editableContent);
      }

      // 상태 업데이트 및 재검사
      state.students[state.currentStudentIndex].content = text;
      runAnalysisOnStudent(state.currentStudentIndex);
      
      // 하이라이팅 적용 렌더링
      applyHighlightingToEditor();
      
      // 커서 복원
      setCaretPosition(DOM.editableContent, offset);
      
      // 결과 리스트 갱신
      renderInspectionResults();
      updateDashboardStats();
      saveStudentsToStorage();
      
      // 테이블도 비동기 갱신
      renderStudentTable();
    }, 800);
  });

  // 에디터 포커스 아웃 시 즉시 정밀 검사
  DOM.editableContent.addEventListener('blur', () => {
    if (state.currentStudentIndex === -1) return;
    const text = DOM.editableContent.innerText;
    state.students[state.currentStudentIndex].content = text;
    runAnalysisOnStudent(state.currentStudentIndex);
    applyHighlightingToEditor();
    renderInspectionResults();
    updateDashboardStats();
    saveStudentsToStorage();
    renderStudentTable();
  });

  // 에디터 내 에러 Span 클릭 시 해당 카드로 스크롤 이동
  DOM.editableContent.addEventListener('click', (e) => {
    if (e.target.classList.contains('hl-word') || e.target.className.startsWith('hl-')) {
      const startIdx = parseInt(e.target.getAttribute('data-start'));
      const errorCard = document.querySelector(`.error-card[data-start="${startIdx}"]`);
      if (errorCard) {
        errorCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        // 잠시 깜빡이 효과
        errorCard.style.boxShadow = '0 0 0 2px var(--border-focus)';
        setTimeout(() => { errorCard.style.boxShadow = 'none'; }, 1000);
      }
    }
  });

  // 모든 제안 적용
  DOM.btnApplyAllFixes.addEventListener('click', applyAllFixesForCurrentStudent);

  // 5.5. 설정 탭 조작
  const settingsKeys = ['spelling', 'slang', 'loanword', 'spacing', 'endingDot', 'forbidden', 'nameCheck'];
  settingsKeys.forEach(key => {
    const checkbox = document.getElementById(`setting-${key}`);
    checkbox.addEventListener('change', (e) => {
      state.settings[key] = e.target.checked;
      saveSettingsToStorage();
      runAnalysisOnAllStudents();
      updateDashboardStats();
      if (state.currentStudentIndex !== -1) {
        loadStudentIntoEditor(state.currentStudentIndex);
      }
      renderStudentTable();
      showToast('점검 규칙 설정이 실시간으로 적용되었습니다.');
    });
  });

  DOM.btnAddDictRow.addEventListener('click', addNewDictionaryRow);
}

// 6. 탭 전환 제어
function switchTab(tabId) {
  // 동적 추가 탭 정상 선택을 위해 전환 시점에 최신 리스트 쿼리
  const currentMenuItems = document.querySelectorAll('.menu-item');
  const currentTabs = document.querySelectorAll('.tab-content');

  // 메뉴 아이템 활성화 클래스 전환
  currentMenuItems.forEach(item => {
    if (item.getAttribute('data-tab') === tabId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 탭 콘텐츠 가시성 전환
  currentTabs.forEach(tab => {
    if (tab.id === tabId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  // 페이지 타이틀 아이콘 & 이름 변경
  let titleHTML = '';
  if (tabId === 'data-management') {
    titleHTML = `<i data-lucide="database"></i><span>데이터 관리</span>`;
    renderStudentTable(); // 탭 열 때 렌더링 최신화
  } else if (tabId === 'settings') {
    titleHTML = `<i data-lucide="settings"></i><span>점검 규칙 설정</span>`;
  } else if (tabId === 'student-group-view') {
    titleHTML = `<i data-lucide="users"></i><span>학생별 확인</span>`;
    updateEditorFilterDropdowns();
    renderEditorStudentList();
    if (state.currentStudentIndex === -1 && state.students.length > 0) {
      loadStudentIntoEditor(0);
    } else if (state.currentStudentIndex !== -1) {
      loadStudentIntoEditor(state.currentStudentIndex);
    } else {
      clearEditor();
    }
  } else if (tabId === 'subject-group-view') {
    titleHTML = `<i data-lucide="book-open"></i><span>과목별 확인</span>`;
    renderSubjectGroupView();
  }
  
  DOM.pageTitle.innerHTML = titleHTML;
  lucide.createIcons();
}

// 7. 엑셀 업로드 처리 (SheetJS 활용)
function handleExcelUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  const isCSV = file.name.toLowerCase().endsWith('.csv');

  reader.onload = function(evt) {
    let workbook;
    try {
      if (isCSV) {
        // CSV 파일은 텍스트(문자열) 모드로 읽어 codepage 라이브러리 디코딩 에러 및 깨짐을 사전에 방지
        const text = evt.target.result;
        try {
          workbook = XLSX.read(text, { type: 'string', codepage: 65001 });
        } catch (eCSV) {
          console.warn('UTF-8 CSV 읽기 실패, 기본 문자열 읽기 시도:', eCSV);
          workbook = XLSX.read(text, { type: 'string' });
        }
      } else {
        const data = new Uint8Array(evt.target.result);
        try {
          // 1차 시도: UTF-8 코드페이지 명시
          workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
        } catch (e1) {
          console.warn('UTF-8 코드페이지 읽기 실패, 일반 읽기 시도:', e1);
          // 2차 시도: 기본 바이너리 감지
          workbook = XLSX.read(data, { type: 'array' });
        }
      }

      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        showToast('유효한 시트가 없는 파일입니다.');
        return;
      }

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (!rows || rows.length < 2 || !Array.isArray(rows[0]) || rows[0].length === 0) {
        showToast('파일에 분석할 수 있는 데이터 열(헤더)이 존재하지 않습니다.');
        return;
      }

      // 첫 번째 행은 헤더로 가정하고 맵핑 분석 (BOM '\ufeff' 제거 포함)
      const headers = rows[0].map(h => {
        if (h === null || h === undefined) return '';
        return String(h).replace(/^\ufeff/, '').trim();
      });
      
      // 컬럼 인덱스 찾기
      const colMap = {
        type: headers.findIndex(h => h.includes('구분') || h.includes('종류')),
        year: headers.findIndex(h => h.includes('학년도') || h.includes('연도')),
        term: headers.findIndex(h => h.includes('학기')),
        sNum: headers.findIndex(h => h.includes('학번') || h.includes('번호')),
        name: headers.findIndex(h => h.includes('이름') || h.includes('성명')),
        subject: headers.findIndex(h => h.includes('과목') || h.includes('주제') || h.includes('활동')),
        content: headers.findIndex(h => h.includes('내용') || h.includes('특기사항') || h.includes('세부특기'))
      };

      // 만약 헤더 매칭이 실패했다면 컬럼 순서 기반 Fallback (0:구분, 1:학년도, 2:학기, 3:학번, 4:이름, 5:과목명, 6:내용)
      if (colMap.name === -1 && colMap.content === -1) {
        colMap.type = 0;
        colMap.year = 1;
        colMap.term = 2;
        colMap.sNum = 3;
        colMap.name = 4;
        colMap.subject = 5;
        colMap.content = 6;
      }

      const newStudents = [];
      
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !Array.isArray(row) || row.length === 0) continue;
        
        // 데이터 추출 전 안전 장치
        const getRowVal = (colIdx) => {
          if (colIdx === -1 || colIdx === undefined || colIdx >= row.length) return '';
          const val = row[colIdx];
          return (val === null || val === undefined) ? '' : String(val).trim();
        };

        const nameVal = getRowVal(colMap.name);
        const contentVal = getRowVal(colMap.content);
        
        // 이름과 내용이 모두 없으면 스킵
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
          errors: [],
          checked: false
        });
      }

      if (newStudents.length > 0) {
        state.students = [...state.students, ...newStudents];
        runAnalysisOnAllStudents();
        saveStudentsToStorage();
        updateDashboardStats();
        
        // 새 데이터를 보기 위해 페이지 번호 1로 세팅 후 렌더링
        state.currentPage = 1;
        updateFilterDropdowns();
        renderStudentTable();
        
        showToast(`${newStudents.length}명의 학생 데이터를 성공적으로 불러왔습니다!`);
        DOM.btnExportExcel.style.display = 'inline-flex';
      } else {
        showToast('불러올 수 있는 유효한 행이 없습니다. 템플릿 양식을 확인해 주세요.');
      }
    } catch (err) {
      console.error('파일 파싱 중 에러 발생:', err);
      showToast(`파일 파싱 오류: ${err.message || '헤더 형식을 확인해 주세요.'}`);
    }
  };

  // CSV와 Excel 파일 읽기 방식 다중 분기
  if (isCSV) {
    reader.readAsText(file, 'UTF-8');
  } else {
    reader.readAsArrayBuffer(file);
  }
  
  // 파일 인풋 초기화
  DOM.excelFileInput.value = '';
}

// 8. 학생 분석 로직 연동
function runAnalysisOnStudent(index) {
  if (index < 0 || index >= state.students.length) return;
  const stud = state.students[index];
  
  // 커스텀 설정을 담아 분석 엔진 호출
  const customConfig = {
    ...state.settings,
    customDictionary: state.customDictionary
  };
  
  stud.errors = window.inspectStudentRecord(stud.content, stud.name, customConfig);
  stud.checked = true;

  // 좌측 학생 명부 중 해당 행의 완료/경고 배지만 부분 업데이트하여 성능 저하 및 포커스 튐 차단
  if (DOM.editorStudentListContainer) {
    const item = DOM.editorStudentListContainer.querySelector(`.editor-student-item[data-index="${index}"]`);
    if (item) {
      const statusDiv = item.querySelector('.editor-student-item-status');
      if (statusDiv) {
        const errCount = stud.errors ? stud.errors.length : 0;
        statusDiv.innerHTML = errCount > 0 
          ? '<i data-lucide="alert-circle" class="status-icon-warn" style="width:16px; height:16px;"></i>'
          : '<i data-lucide="check-circle" class="status-icon-ok" style="width:16px; height:16px;"></i>';
        lucide.createIcons();
      }
    }
  }
}

function runAnalysisOnAllStudents() {
  state.students.forEach((_, idx) => {
    runAnalysisOnStudent(idx);
  });
  saveStudentsToStorage();
  updateDashboardStats();
  
  // 일괄 분석 완료 시 에디터용 명부 리스트 및 필터 드롭다운도 동시 갱신
  updateEditorFilterDropdowns();
  renderEditorStudentList();
}

// 9. 대시보드 통계 업데이트
function updateDashboardStats() {
  // 학번과 이름을 조합하여 중복되지 않는 실제 고유 학생 수 산출
  const uniqueStudents = new Set();
  state.students.forEach(s => {
    const key = `${s.sNum || ''}_${s.name || ''}`;
    if (s.name) uniqueStudents.add(key);
  });
  
  const totalStudentsCount = uniqueStudents.size;
  const totalRecordsCount = state.students.length;
  
  let totalErrors = 0;
  let forbiddenErrors = 0;
  
  state.students.forEach(s => {
    if (s.errors) {
      totalErrors += s.errors.length;
      forbiddenErrors += s.errors.filter(e => e.type === 'forbidden').length;
    }
  });

  DOM.statsTotalStudents.textContent = totalStudentsCount;
  DOM.statsCheckedStudents.textContent = totalRecordsCount;
  DOM.statsTotalErrors.textContent = totalErrors;
  DOM.statsForbiddenErrors.textContent = forbiddenErrors;
  
  if (totalRecordsCount > 0) {
    DOM.btnExportExcel.style.display = 'inline-flex';
  } else {
    DOM.btnExportExcel.style.display = 'none';
  }
}

// 10. 학생 관리 테이블 렌더링
function renderStudentTable() {
  const body = DOM.studentTableBody;
  body.innerHTML = '';
  
  // 전체 선택 체크박스 초기화
  if (DOM.thSelectAll) DOM.thSelectAll.checked = false;
  toggleDeleteSelectedButton();

  // 필터링 적용 (검색어, 학년, 반, 과목 복합 필터)
  const filtered = state.students.filter(s => {
    // 1. 검색어 필터
    if (state.searchTerm) {
      const query = state.searchTerm.toLowerCase();
      const matchSearch = (
        s.name.toLowerCase().includes(query) ||
        s.sNum.toLowerCase().includes(query) ||
        s.subject.toLowerCase().includes(query) ||
        s.content.toLowerCase().includes(query)
      );
      if (!matchSearch) return false;
    }

    // 2. 학년 필터
    if (DOM.filterYear && DOM.filterYear.value !== 'all') {
      const { grade } = parseGradeAndClass(s.sNum);
      if (grade !== DOM.filterYear.value) return false;
    }

    // 3. 반 필터
    if (DOM.filterClass && DOM.filterClass.value !== 'all') {
      const { classVal } = parseGradeAndClass(s.sNum);
      if (classVal !== DOM.filterClass.value) return false;
    }

    // 4. 과목 필터
    if (DOM.filterSubject && DOM.filterSubject.value !== 'all') {
      if (s.subject !== DOM.filterSubject.value) return false;
    }

    return true;
  });

  // 정렬 적용
  const sortBy = DOM.sortCriteria ? DOM.sortCriteria.value : 'sNum-asc';
  filtered.sort((a, b) => {
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

  // 총 페이지 수 계산 및 보정
  const totalPages = Math.ceil(filtered.length / state.rowsPerPage) || 1;
  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }
  
  // 페이징 정보 UI 갱신
  if (DOM.txtPageInfo) {
    DOM.txtPageInfo.textContent = `${state.currentPage} / ${totalPages} 페이지`;
  }
  
  // 이전/다음 버튼 활성/비활성화 제어
  if (DOM.btnPrevPage) {
    DOM.btnPrevPage.disabled = state.currentPage === 1;
    DOM.btnPrevPage.style.opacity = state.currentPage === 1 ? '0.4' : '1';
    DOM.btnPrevPage.style.cursor = state.currentPage === 1 ? 'not-allowed' : 'pointer';
  }
  if (DOM.btnNextPage) {
    DOM.btnNextPage.disabled = state.currentPage === totalPages;
    DOM.btnNextPage.style.opacity = state.currentPage === totalPages ? '0.4' : '1';
    DOM.btnNextPage.style.cursor = state.currentPage === totalPages ? 'not-allowed' : 'pointer';
  }

  if (filtered.length === 0) {
    body.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; color: var(--text-secondary); padding: 32px 0;">
          검색 결과 조건에 맞는 학생이 없습니다.
        </td>
      </tr>
    `;
    return;
  }

  // 현재 페이지에 해당하는 데이터만 잘라내기
  const startIdx = (state.currentPage - 1) * state.rowsPerPage;
  const endIdx = startIdx + state.rowsPerPage;
  const pageData = filtered.slice(startIdx, endIdx);

  pageData.forEach((stud, fIdx) => {
    // 실제 학생 배열에서의 인덱스 찾기
    const actualIndex = state.students.findIndex(s => s.id === stud.id);
    
    const tr = document.createElement('tr');
    tr.setAttribute('data-id', stud.id);
    
    // 검출 오류 요약 뱃지들
    let errorBadgeHTML = '<span style="color: var(--color-success-text); font-weight:600;">정상</span>';
    if (stud.errors && stud.errors.length > 0) {
      const errTypes = {};
      stud.errors.forEach(e => {
        errTypes[e.label] = (errTypes[e.label] || 0) + 1;
      });
      
      errorBadgeHTML = Object.entries(errTypes)
        .map(([label, count]) => {
          let styleClass = 'color: #37352f; background-color: var(--bg-selected);';
          if (label.includes('맞춤법') || label.includes('기재 금지')) {
            styleClass = 'color: var(--color-spelling-text); background-color: var(--color-spelling-bg);';
          } else if (label.includes('은어')) {
            styleClass = 'color: var(--color-slang-text); background-color: var(--color-slang-bg);';
          }
          return `<span style="font-size: 11px; padding: 2px 5px; border-radius: 3px; font-weight:600; margin-right: 4px; ${styleClass}">${label} ${count}</span>`;
        })
        .join('');
    }

    tr.innerHTML = `
      <td style="text-align: center;"><input type="checkbox" class="td-select-row" data-id="${stud.id}"></td>
      <td class="editable-cell" contenteditable="true" data-field="type">${escapeHTML(stud.type)}</td>
      <td class="editable-cell" contenteditable="true" data-field="year">${escapeHTML(stud.year)}</td>
      <td class="editable-cell" contenteditable="true" data-field="term">${escapeHTML(stud.term)}</td>
      <td class="editable-cell" contenteditable="true" data-field="sNum">${escapeHTML(stud.sNum)}</td>
      <td class="editable-cell" contenteditable="true" data-field="name">${escapeHTML(stud.name)}</td>
      <td class="editable-cell" contenteditable="true" data-field="subject">${escapeHTML(stud.subject)}</td>
      <td class="editable-cell" contenteditable="true" data-field="content" style="text-align:left; cursor: pointer;" title="클릭하여 점검하기">${escapeHTML(stud.content)}</td>
      <td style="text-align: left;">${errorBadgeHTML}</td>
      <td>
        <div class="row-actions">
          <button class="action-icon-btn btn-inspect" title="점검하기">
            <i data-lucide="file-search" style="width: 14px; height: 14px;"></i>
          </button>
          <button class="action-icon-btn btn-delete" style="color: var(--color-spelling-text);" title="삭제">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </td>
    `;

    // 개별 체크박스 리스너 등록
    tr.querySelector('.td-select-row').addEventListener('change', () => {
      const allCbs = DOM.studentTableBody.querySelectorAll('.td-select-row');
      const checkedCbs = DOM.studentTableBody.querySelectorAll('.td-select-row:checked');
      if (DOM.thSelectAll) {
        DOM.thSelectAll.checked = allCbs.length > 0 && allCbs.length === checkedCbs.length;
      }
      toggleDeleteSelectedButton();
    });

    // 셀 수정(Notion DB 방식의 더블클릭/직접수정 감지)
    const editableCells = tr.querySelectorAll('.editable-cell');
    editableCells.forEach(cell => {
      cell.addEventListener('focus', () => {
        state.isEditingCell = true;
      });

      cell.addEventListener('blur', (e) => {
        state.isEditingCell = false;
        const field = cell.getAttribute('data-field');
        const newValue = cell.innerText.trim();
        
        // 바뀐 경우에만 저장
        if (state.students[actualIndex][field] !== newValue) {
          state.students[actualIndex][field] = newValue;
          runAnalysisOnStudent(actualIndex);
          saveStudentsToStorage();
          updateDashboardStats();
          // 주의: renderStudentTable을 블러 시 매번 다시 부르면 한글 입력 및 탭이탈 시 문제 생기므로 디비 갱신만 하고 마크업 갱신은 필요할 때만
        }
      });

      // 엔터키 누르면 포커스 아웃
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          cell.blur();
        }
      });
    });

    // 내용 셀 클릭 시 해당 학생 점검 페이지로 바로 이동
    tr.querySelector('td[data-field="content"]').addEventListener('click', () => {
      state.currentStudentIndex = actualIndex;
      loadStudentIntoEditor(actualIndex);
      switchTab('student-group-view');
    });

    // 행 작업 버튼 리스너
    tr.querySelector('.btn-inspect').addEventListener('click', () => {
      state.currentStudentIndex = actualIndex;
      loadStudentIntoEditor(actualIndex);
      switchTab('student-group-view');
    });

    tr.querySelector('.btn-delete').addEventListener('click', () => {
      if (confirm(`${stud.name} 학생 데이터를 삭제하시겠습니까?`)) {
        state.students.splice(actualIndex, 1);
        if (state.currentStudentIndex === actualIndex) {
          state.currentStudentIndex = state.students.length > 0 ? 0 : -1;
        } else if (state.currentStudentIndex > actualIndex) {
          state.currentStudentIndex--;
        }
        saveStudentsToStorage();
        updateDashboardStats();
        updateFilterDropdowns();
        renderStudentTable();
        showToast('학생 정보가 삭제되었습니다.');
      }
    });

    body.appendChild(tr);
  });
  
  lucide.createIcons();
}

// 새로운 학생 직접 추가
function addNewStudentRow() {
  const newStud = {
    id: 'stud_' + Date.now(),
    type: '세특',
    year: String(new Date().getFullYear()),
    term: '1학기',
    sNum: '',
    name: '새 학생',
    subject: '',
    content: '내용을 입력해 주세요.',
    errors: [],
    checked: false
  };
  state.students.push(newStud);
  const newIndex = state.students.length - 1;
  runAnalysisOnStudent(newIndex);
  saveStudentsToStorage();
  updateDashboardStats();
  updateFilterDropdowns();
  renderStudentTable();
  
  // 새로 추가된 행으로 즉시 스크롤 이동
  const tr = DOM.studentTableBody.querySelector(`tr[data-id="${newStud.id}"]`);
  if (tr) {
    tr.scrollIntoView({ behavior: 'smooth' });
    // 이름 편집 셀 포커스
    const nameCell = tr.querySelector('td[data-field="name"]');
    if (nameCell) nameCell.focus();
  }
  showToast('새 학생 행이 추가되었습니다. 더블클릭하여 작성해 주세요.');
}

// 11. 에디터 탭 컨트롤 및 동기화
function loadStudentIntoEditor(index) {
  if (index < 0 || index >= state.students.length) {
    clearEditor();
    return;
  }
  
  state.currentStudentIndex = index;
  const stud = state.students[index];
  
  // 2단 분할 에디터 활성화 토글
  if (DOM.editorEmptyState) DOM.editorEmptyState.style.display = 'none';
  if (DOM.editorActiveContainer) DOM.editorActiveContainer.style.display = 'flex';
  
  DOM.currentStudentName.textContent = stud.name || '이름 없음';
  DOM.currentStudentMeta.textContent = `[${stud.type}] ${stud.year}학년도 ${stud.term} - ${stud.sNum || '학번 없음'}`;
  
  // 과목 선택 드롭다운 옵션 동적 빌드 (전체 학생 과목 기반)
  if (DOM.editorSubjectSelect) {
    const subjects = new Set();
    state.students.forEach(s => {
      if (s.subject) subjects.add(s.subject);
    });
    
    DOM.editorSubjectSelect.innerHTML = '';
    
    // 과목명 가나다순 추가
    Array.from(subjects).sort().forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      DOM.editorSubjectSelect.appendChild(opt);
    });
    
    // 직접 입력 옵션 추가
    const directOpt = document.createElement('option');
    directOpt.value = '__direct__';
    directOpt.textContent = '[직접 입력...]';
    DOM.editorSubjectSelect.appendChild(directOpt);
    
    const currentSubject = stud.subject || '';
    if (subjects.has(currentSubject) || currentSubject === '') {
      DOM.editorSubjectSelect.value = currentSubject;
      DOM.editorSubjectSelect.style.display = 'block';
      DOM.editorSubjectDirectInput.style.display = 'none';
    } else {
      // 기존 목록에 과목명이 없을 때만 직접 입력 텍스트박스 노출
      DOM.editorSubjectSelect.value = '__direct__';
      DOM.editorSubjectSelect.style.display = 'none';
      DOM.editorSubjectDirectInput.style.display = 'block';
      DOM.editorSubjectDirectInput.value = currentSubject;
    }
  }
  
  // 에디터 내용 주입 (포커스 아닐 때만 전체 주입)
  DOM.editableContent.innerText = stud.content || '';
  
  // 점검 분석 실행 및 렌더링
  runAnalysisOnStudent(index);
  applyHighlightingToEditor();
  
  // 에디터 통계 & 결과 출력
  updateEditorFooterStats(stud.content);
  renderInspectionResults();
  updateDashboardStats();
  
  // 좌측 명부 스크롤 리스트 활성화 처리 동기화
  if (DOM.editorStudentListContainer) {
    const items = DOM.editorStudentListContainer.querySelectorAll('.editor-student-item');
    items.forEach(item => {
      const idx = parseInt(item.getAttribute('data-index'));
      if (idx === index) {
        item.classList.add('active');
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        item.classList.remove('active');
      }
    });
  }
}

function clearEditor() {
  state.currentStudentIndex = -1;
  if (DOM.editorEmptyState) DOM.editorEmptyState.style.display = 'flex';
  if (DOM.editorActiveContainer) DOM.editorActiveContainer.style.display = 'none';
  
  DOM.currentStudentName.textContent = '학생 데이터 없음';
  DOM.currentStudentMeta.textContent = '';
  DOM.editableContent.innerHTML = '';
  DOM.charCount.textContent = '0';
  DOM.byteCount.textContent = '0';
  DOM.byteCount.className = 'byte-badge';
  DOM.errorsCountBadge.textContent = '0';
  DOM.inspectionResultsList.innerHTML = `
    <div class="empty-state">
      <i data-lucide="info"></i>
      <h4>선택된 학생이 없습니다</h4>
      <p>'데이터 관리' 탭에서 학생을 선택하거나 엑셀을 업로드하세요.</p>
    </div>
  `;
  lucide.createIcons();
}

function navigateStudent(dir) {
  if (state.students.length === 0) return;
  let newIdx = state.currentStudentIndex + dir;
  if (newIdx < 0) newIdx = state.students.length - 1;
  if (newIdx >= state.students.length) newIdx = 0;
  loadStudentIntoEditor(newIdx);
}

function updateEditorFooterStats(text) {
  const chars = text.length;
  const bytes = window.calculateNEISBytes(text);
  
  DOM.charCount.textContent = chars;
  DOM.byteCount.textContent = bytes;
  
  // NEIS 세특 제한은 대략 과목별 1,500바이트(또는 500자)가 표준입니다.
  // 제한 바이트 초과 시 빨간색 경고
  if (bytes > 1500) {
    DOM.byteCount.className = 'byte-badge byte-warning';
  } else {
    DOM.byteCount.className = 'byte-badge';
  }
}

// 에디터 내부에 하이라이팅 HTML 태그 마킹 로직
// 커서 유지를 위해 contenteditable의 텍스트 노드 매핑 및 노션 스타일 렌더링 수행
function applyHighlightingToEditor() {
  const stud = state.students[state.currentStudentIndex];
  if (!stud) return;

  const text = stud.content || '';
  if (!stud.errors || stud.errors.length === 0) {
    DOM.editableContent.innerHTML = escapeHTML(text);
    return;
  }

  // 1. 서로 겹치는(Overlap) 에러 범위들을 사전에 필터링 (HTML 태그가 중간에 찢겨 깨지는 참사 방지)
  // 시작점 기준으로 정렬
  const sortedSpans = [...stud.errors].sort((a, b) => a.start - b.start);
  const activeErrors = [];
  let lastEnd = -1;
  
  sortedSpans.forEach(err => {
    // 이전 완료 지점 이후에 시작하는 에러(겹치지 않는 에러)만 렌더링 대상으로 수집
    if (err.start >= lastEnd) {
      activeErrors.push(err);
      lastEnd = err.end;
    }
  });

  // 2. 필터링된 겹치지 않는 에러들만 역순(뒤에서부터)으로 치환
  let html = text;
  const sortedErrors = activeErrors.sort((a, b) => b.start - a.start);

  sortedErrors.forEach(err => {
    const before = html.substring(0, err.start);
    const match = html.substring(err.start, err.end);
    const after = html.substring(err.end);
    
    // 각 에러 타입에 부합하는 span 래핑
    html = before + `<span class="hl-${err.type}" data-start="${err.start}" data-end="${err.end}" title="${escapeHTML(err.reason)}">${escapeHTML(match)}</span>` + after;
  });

  DOM.editableContent.innerHTML = html;
}

// 12. 우측 오류 검출 카드 렌더링
function renderInspectionResults() {
  const list = DOM.inspectionResultsList;
  list.innerHTML = '';

  if (state.currentStudentIndex === -1) return;
  const stud = state.students[state.currentStudentIndex];

  if (!stud.errors || stud.errors.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i data-lucide="check-circle" style="color: var(--color-success-text);"></i>
        <h4 style="color: var(--color-success-text);">완벽합니다!</h4>
        <p>검출된 생활기록부 맞춤법 및 지침 오류가 없습니다.</p>
      </div>
    `;
    DOM.errorsCountBadge.textContent = '0';
    lucide.createIcons();
    return;
  }

  DOM.errorsCountBadge.textContent = stud.errors.length;

  stud.errors.forEach((err, idx) => {
    const card = document.createElement('div');
    card.className = `error-card card-${err.type}`;
    card.setAttribute('data-start', err.start);
    
    // 아이콘 매핑
    let icon = 'alert-triangle';
    if (err.type === 'spelling') icon = 'spellcheck';
    if (err.type === 'slang') icon = 'message-square-warning';
    if (err.type === 'loanword') icon = 'globe';
    if (err.type === 'forbidden') icon = 'slash';
    if (err.type === 'spacing') icon = 'align-justify';
    if (err.type === 'endingDot') icon = 'circle-dot';
    if (err.type === 'nameCheck') icon = 'user-x';

    card.innerHTML = `
      <div class="error-card-icon">
        <i data-lucide="${icon}"></i>
      </div>
      <div class="error-card-content">
        <div class="error-card-label">${err.label}</div>
        <div class="error-card-match">
          <del>${escapeHTML(err.original)}</del> 
          <i data-lucide="arrow-right" style="width:12px; height:12px; vertical-align:middle; display:inline-block; margin: 0 4px;"></i> 
          <ins style="background-color: rgba(0,0,0,0.05); text-decoration:none;">${escapeHTML(err.replace)}</ins>
        </div>
        <div class="error-card-desc">${escapeHTML(err.reason)}</div>
        <div class="error-card-actions">
          <button class="btn btn-secondary btn-apply-fix" style="padding: 2px 8px; font-size: 11px;" data-idx="${idx}">수정 적용</button>
          <button class="btn btn-secondary btn-ignore-fix" style="padding: 2px 8px; font-size: 11px;" data-idx="${idx}">예외 추가</button>
        </div>
      </div>
    `;

    // 특정 카드 마우스를 올렸을 때 에디터 내 하이라이트 지점을 살짝 반짝이게 하는 반응 효과
    card.addEventListener('mouseenter', () => {
      const hlSpan = DOM.editableContent.querySelector(`span[data-start="${err.start}"]`);
      if (hlSpan) {
        hlSpan.style.outline = '2px solid var(--border-focus)';
      }
    });
    card.addEventListener('mouseleave', () => {
      const hlSpan = DOM.editableContent.querySelector(`span[data-start="${err.start}"]`);
      if (hlSpan) {
        hlSpan.style.outline = 'none';
      }
    });

    // 개별 수정 적용 클릭
    card.querySelector('.btn-apply-fix').addEventListener('click', (e) => {
      e.stopPropagation();
      applySingleFix(idx);
    });

    // 해당 오류 예외 단어로 추가 (내 사전에 추가)
    card.querySelector('.btn-ignore-fix').addEventListener('click', (e) => {
      e.stopPropagation();
      ignoreSingleError(err.original);
    });

    list.appendChild(card);
  });

  lucide.createIcons();
}

// 단일 오류 교정
function applySingleFix(errorIdx) {
  const stud = state.students[state.currentStudentIndex];
  if (!stud) return;

  const err = stud.errors[errorIdx];
  if (!err) return;

  // 텍스트 교정 실행
  const text = stud.content;
  const before = text.substring(0, err.start);
  const after = text.substring(err.end);
  const updatedText = before + err.replace + after;
  
  stud.content = updatedText;
  
  // 재분석 및 로드
  runAnalysisOnStudent(state.currentStudentIndex);
  saveStudentsToStorage();
  
  // 에디터 렌더링 유지
  DOM.editableContent.innerText = updatedText;
  applyHighlightingToEditor();
  updateEditorFooterStats(updatedText);
  renderInspectionResults();
  updateDashboardStats();
  
  showToast(`'${err.original}'가 '${err.replace}'로 수정되었습니다.`);
}

// 모든 제안 적용
function applyAllFixesForCurrentStudent() {
  const stud = state.students[state.currentStudentIndex];
  if (!stud || !stud.errors || stud.errors.length === 0) return;

  // 인덱스 오류 방지를 위해 뒤에서부터 교정
  let text = stud.content;
  const sortedErrors = [...stud.errors].sort((a, b) => b.start - a.start);

  sortedErrors.forEach(err => {
    const before = text.substring(0, err.start);
    const after = text.substring(err.end);
    text = before + err.replace + after;
  });

  stud.content = text;
  
  runAnalysisOnStudent(state.currentStudentIndex);
  saveStudentsToStorage();
  
  DOM.editableContent.innerText = text;
  applyHighlightingToEditor();
  updateEditorFooterStats(text);
  renderInspectionResults();
  updateDashboardStats();

  showToast('모든 제안 수정사항이 한 번에 적용되었습니다!');
}

// 사용자 예외 단어 등록 (이 단어 검사 안 함)
function ignoreSingleError(word) {
  if (state.customDictionary[word] === null) return;
  
  state.customDictionary[word] = { replace: word, reason: '사용자 지정 예외 단어 (검사하지 않음)' };
  saveDictToStorage();
  renderCustomDictionary();
  
  // 전체 재검사
  runAnalysisOnAllStudents();
  if (state.currentStudentIndex !== -1) {
    loadStudentIntoEditor(state.currentStudentIndex);
  }
  renderStudentTable();
  showToast(`'${word}' 단어가 검사 예외 목록에 추가되었습니다.`);
}

// 13. 설정 - 사용자 사전(Custom Dictionary) CRUD
function renderCustomDictionary() {
  const list = DOM.customDictionaryList;
  // 첫 번째 행(헤더)만 남겨두고 초기화
  const header = list.querySelector('.dictionary-row:first-child');
  list.innerHTML = '';
  list.appendChild(header);

  const dictEntries = Object.entries(state.customDictionary);
  
  if (dictEntries.length === 0) {
    const emptyRow = document.createElement('div');
    emptyRow.style.padding = '12px';
    emptyRow.style.textAlign = 'center';
    emptyRow.style.color = 'var(--text-secondary)';
    emptyRow.style.fontSize = '13px';
    emptyRow.textContent = '등록된 사용자 사전 규칙이 없습니다. [사전 항목 추가] 버튼을 눌러보세요.';
    list.appendChild(emptyRow);
    return;
  }

  dictEntries.forEach(([key, val]) => {
    const row = document.createElement('div');
    row.className = 'dictionary-row';
    row.setAttribute('data-word', key);
    
    // 예외 단어(스스로 치환)인 경우 처리
    const replaceVal = val.replace === key ? '' : val.replace;

    row.innerHTML = `
      <input type="text" class="dict-input-word" value="${escapeHTML(key)}" placeholder="오류 단어">
      <input type="text" class="dict-input-replace" value="${escapeHTML(replaceVal)}" placeholder="대체어 (비우면 예외처리)">
      <input type="text" class="dict-input-reason" value="${escapeHTML(val.reason || '')}" placeholder="수정 사유">
      <button class="action-icon-btn btn-delete-dict" style="color: var(--color-spelling-text);" title="규칙 삭제">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
    `;

    // 변경 감지 리스너
    const wordInput = row.querySelector('.dict-input-word');
    const replaceInput = row.querySelector('.dict-input-replace');
    const reasonInput = row.querySelector('.dict-input-reason');

    const updateDictEntry = () => {
      const newWord = wordInput.value.trim();
      const newReplace = replaceInput.value.trim();
      const newReason = reasonInput.value.trim() || '사용자 정의 규칙';

      if (!newWord) return;

      // 이전 키가 다르면 기존 데이터 삭제 후 새 키 등록
      if (newWord !== key) {
        delete state.customDictionary[key];
        key = newWord;
      }

      state.customDictionary[newWord] = {
        replace: newReplace || newWord, // 비어있으면 예외 단어 처리
        reason: newReason
      };
      
      saveDictToStorage();
      runAnalysisOnAllStudents();
    };

    wordInput.addEventListener('blur', updateDictEntry);
    replaceInput.addEventListener('blur', updateDictEntry);
    reasonInput.addEventListener('blur', updateDictEntry);

    row.querySelector('.btn-delete-dict').addEventListener('click', () => {
      delete state.customDictionary[key];
      saveDictToStorage();
      renderCustomDictionary();
      runAnalysisOnAllStudents();
      if (state.currentStudentIndex !== -1) {
        loadStudentIntoEditor(state.currentStudentIndex);
      }
      showToast(`'${key}' 사전 규칙이 삭제되었습니다.`);
    });

    list.appendChild(row);
  });

  lucide.createIcons();
}

function addNewDictionaryRow() {
  const tempKey = '새_단어_' + Math.random().toString(36).substr(2, 5);
  state.customDictionary[tempKey] = {
    replace: '',
    reason: '수정 사유 입력'
  };
  saveDictToStorage();
  renderCustomDictionary();
  
  // 새로 추가된 행 포커스
  const row = DOM.customDictionaryList.querySelector(`.dictionary-row[data-word="${tempKey}"]`);
  if (row) {
    const wordInput = row.querySelector('.dict-input-word');
    if (wordInput) {
      wordInput.focus();
      wordInput.select();
    }
  }
}

// 14. 점검 완료 데이터 다운로드 (XLSX 내보내기)
function exportCheckedDataToExcel() {
  if (state.students.length === 0) {
    showToast('다운로드할 데이터가 존재하지 않습니다.');
    return;
  }

  // 다운로드용 2차원 배열 데이터 구축
  const headers = ['구분', '학년도', '학기', '학번', '이름', '과목명 / 주제명', '수정 완료 내용', '남은 오류 개수'];
  const rows = [headers];

  state.students.forEach(s => {
    rows.push([
      s.type,
      s.year,
      s.term,
      s.sNum,
      s.name,
      s.subject,
      s.content,
      s.errors ? s.errors.length : 0
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "생활기록부_점검결과");
  
  // 저장 실행
  XLSX.writeFile(workbook, `생활기록부_점검_완료_${getFormattedDate()}.xlsx`);
  showToast('검사 완료된 생활기록부 엑셀 저장이 성공적으로 완료되었습니다.');
}

// 15. 샘플 다운로드 기능 (Dummy Data)
function downloadSampleExcel() {
  const sampleHeaders = ['구분', '학년도', '학기', '학번', '이름', '과목명/주제명', '내용 (생활기록부 세부 특기사항)'];
  const sampleRows = [
    sampleHeaders,
    ['세특', '2026', '1학기', '30101', '김철수', '물리학I', '수업 시간에 집중력이 매우 뛰어나며 모둠 활동에서 중추적 역활을 성실히 수행함  특히 물리 실험 시물레이션 프로그램을 제작년보다 훨씬 정교하게 구현하여 동료들의 극찬을 받음'],
    ['세특', '2026', '1학기', '30102', '이영희', '정보과학', '정보과학 교과의 알고리즘 설계 과정에서 개이득을 취하기 위해 꼼꼼이 준비함. 영희는 평소 영어 학습에도 흥미가 깊어 토익 시험을 꾸준히 준비함'],
    ['주제선택', '2026', '1학기', '30103', '박민수', '창의융합과학', '다양한 융합 실험을 기획하고 이끄는 역량이 탁월함. 탐구 결과 보고서를 작성하는 과정에서 띄어쓰기와 맞춤법을 정확히 준수하며 가짐으로 성숙한 학술적 태도가 됬다']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sampleRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "생기부_점검_샘플");
  
  XLSX.writeFile(workbook, "생기부_점검_테스트_샘플.xlsx");
  showToast('테스트용 샘플 엑셀 파일을 다운로드했습니다.');
}

// 16. 유틸리티 함수들
function initSettingsUI() {
  DOM.settingSpelling.checked = state.settings.spelling;
  DOM.settingSlang.checked = state.settings.slang;
  DOM.settingLoanword.checked = state.settings.loanword;
  DOM.settingSpacing.checked = state.settings.spacing;
  DOM.settingEndingDot.checked = state.settings.endingDot;
  DOM.settingForbidden.checked = state.settings.forbidden;
  DOM.settingNameCheck.checked = state.settings.nameCheck;
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getFormattedDate() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

// Toast 알림
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i data-lucide="info" style="width: 16px; height: 16px;"></i>
    <span>${message}</span>
  `;
  DOM.toastContainer.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.style.animation = 'slideIn 0.2s ease reverse forwards';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// contenteditable 커서 오프셋 측정 유틸리티
function getCaretCharacterOffsetWithin(element) {
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
}

// contenteditable 커서 위치 강제 복원 유틸리티
function setCaretPosition(element, offset) {
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
  
  // 노드를 찾지 못한 경우 텍스트 영역의 가장 끝으로 캐럿 고정
  if (!nodeToFocus) {
    nodeToFocus = element;
    // 텍스트 전체의 끝지점
    focusOffset = element.childNodes.length;
    // 만약 텍스트 노드가 있다면 그 끝
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
    console.warn("커서 복원 오류: ", e);
  }
}

// 선택 삭제 버튼 가시성 토글
function toggleDeleteSelectedButton() {
  if (!DOM.btnDeleteSelected) return;
  const checkedBoxes = DOM.studentTableBody.querySelectorAll('.td-select-row:checked');
  if (checkedBoxes.length > 0) {
    DOM.btnDeleteSelected.style.display = 'inline-flex';
  } else {
    DOM.btnDeleteSelected.style.display = 'none';
  }
}

// 학번 파싱 도우미 (예: "30102" -> 3학년 1반)
function parseGradeAndClass(sNum) {
  if (!sNum) return { grade: '기타 학년', classVal: '기타 반' };
  const num = String(sNum).trim();
  if (num.length === 5) {
    return {
      grade: num[0] + '학년',
      classVal: parseInt(num.substring(1, 3)) + '반'
    };
  } else if (num.length === 4) {
    return {
      grade: num[0] + '학년',
      classVal: parseInt(num[1]) + '반'
    };
  }
  return { grade: '기타 학년', classVal: '기타 반' };
}

// 필터 드롭다운 목록 동적 갱신 (전체 데이터 기반)
function updateFilterDropdowns() {
  const years = new Set();
  const classes = new Set();
  const subjects = new Set();
  
  state.students.forEach(s => {
    if (s.sNum) {
      const { grade, classVal } = parseGradeAndClass(s.sNum);
      years.add(grade);
      classes.add(classVal);
    }
    if (s.subject) {
      subjects.add(s.subject);
    }
  });

  rebuildSelect(DOM.filterYear, years, '학년');
  rebuildSelect(DOM.filterClass, classes, '반');
  rebuildSelect(DOM.filterSubject, subjects, '과목');
}

// 17. 학생별/과목별 그룹 확인 트리 렌더러
function createAccordion(title, badgeText = '') {
  const wrap = document.createElement('div');
  const actualTitle = title === 'all' || !title ? '전체' : title;
  wrap.className = 'group-accordion';
  
  let badgeHTML = '';
  if (badgeText) {
    badgeHTML = `<span class="accordion-header-badge">${badgeText}</span>`;
  }

  wrap.innerHTML = `
    <div class="accordion-header">
      <i data-lucide="chevron-right" class="chevron" style="width:16px; height:16px;"></i>
      <span>${escapeHTML(actualTitle)}</span>
      ${badgeHTML}
    </div>
    <div class="accordion-content"></div>
  `;
  
  const header = wrap.querySelector('.accordion-header');
  const content = wrap.querySelector('.accordion-content');
  
  header.addEventListener('click', (e) => {
    e.stopPropagation();
    header.classList.toggle('open');
    content.classList.toggle('open');
    
    // Lucide 아이콘이 동적 생성된 후 셰브론 상태 유지를 위해
    lucide.createIcons();
  });
  
  return {
    element: wrap,
    content: content
  };
}

function renderStudentGroupView() {
  const container = document.getElementById('student-hierarchy-tree');
  container.innerHTML = '';
  
  if (state.students.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="users"></i>
        <h4>표시할 학생 데이터가 없습니다</h4>
        <p>'데이터 관리' 탭에서 학생 데이터를 업로드하거나 추가해 주세요.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // 1. 트리 구조화 (학년 -> 반 -> 학생)
  const tree = {};
  state.students.forEach(s => {
    const { grade, classVal } = parseGradeAndClass(s.sNum);
    if (!tree[grade]) tree[grade] = {};
    if (!tree[grade][classVal]) tree[grade][classVal] = {};
    
    const studKey = `${s.sNum || '학번 없음'} ${s.name}`;
    if (!tree[grade][classVal][studKey]) tree[grade][classVal][studKey] = [];
    tree[grade][classVal][studKey].push(s);
  });

  // 2. DOM 빌드
  const sortedGrades = Object.keys(tree).sort();
  
  sortedGrades.forEach(grade => {
    // 학년별 총 학생 수 계산
    let studentCount = 0;
    Object.keys(tree[grade]).forEach(c => {
      studentCount += Object.keys(tree[grade][c]).length;
    });

    const gradeAcc = createAccordion(grade, `${Object.keys(tree[grade]).length}개 반 / ${studentCount}명`);
    container.appendChild(gradeAcc.element);
    
    const sortedClasses = Object.keys(tree[grade]).sort((a, b) => {
      const aNum = parseInt(a) || 0;
      const bNum = parseInt(b) || 0;
      return aNum - bNum;
    });

    sortedClasses.forEach(classVal => {
      const studentKeys = Object.keys(tree[grade][classVal]);
      const classAcc = createAccordion(classVal, `${studentKeys.length}명`);
      gradeAcc.content.appendChild(classAcc.element);
      
      const sortedStudents = studentKeys.sort();
      
      sortedStudents.forEach(studKey => {
        const records = tree[grade][classVal][studKey];
        // 학생별 총 에러 개수 계산
        let errCount = 0;
        records.forEach(r => { if (r.errors) errCount += r.errors.length; });
        const badgeMsg = errCount > 0 ? `오류 ${errCount}건` : '정상';
        
        const studAcc = createAccordion(studKey, badgeMsg);
        classAcc.content.appendChild(studAcc.element);
        
        // 학생 아코디언 배지의 색상 보정
        const badgeSpan = studAcc.element.querySelector('.accordion-header-badge');
        if (errCount > 0) {
          badgeSpan.style.backgroundColor = 'var(--color-spelling-bg)';
          badgeSpan.style.color = 'var(--color-spelling-text)';
          badgeSpan.style.fontWeight = '700';
        } else {
          badgeSpan.style.backgroundColor = 'var(--color-success-bg)';
          badgeSpan.style.color = 'var(--color-success-text)';
        }

        // 학생 폴더가 펼쳐졌을 때, 수강하는 과목 카드 리스트 배치
        const cardGrid = document.createElement('div');
        cardGrid.className = 'group-card-grid';
        studAcc.content.appendChild(cardGrid);
        
        records.forEach(r => {
          const card = document.createElement('div');
          card.className = 'group-student-card';
          
          const eCount = r.errors ? r.errors.length : 0;
          const statusTxt = eCount > 0 ? `오류 ${eCount}` : '정상';
          const statusStyle = eCount > 0 
            ? 'background-color: var(--color-spelling-bg); color: var(--color-spelling-text);'
            : 'background-color: var(--color-success-bg); color: var(--color-success-text);';

          card.innerHTML = `
            <div class="group-card-title">
              <span>${escapeHTML(r.subject || '과목 없음')}</span>
              <span style="font-size: 10px; padding: 1px 5px; border-radius: 3px; font-weight:600; ${statusStyle}">${statusTxt}</span>
            </div>
            <div class="group-card-desc">${escapeHTML(r.content || '내용 없음')}</div>
          `;
          
          // 카드 클릭 시 에디터로 연동 점프
          card.addEventListener('click', () => {
            const actualIndex = state.students.findIndex(s => s.id === r.id);
            if (actualIndex !== -1) {
              state.currentStudentIndex = actualIndex;
              loadStudentIntoEditor(actualIndex);
              switchTab('student-group-view');
              showToast(`'${r.name}' 학생의 '${r.subject}' 교정 화면으로 이동했습니다.`);
            }
          });
          
          cardGrid.appendChild(card);
        });
      });
    });
  });
  
  lucide.createIcons();
}

function renderSubjectGroupView() {
  const container = document.getElementById('subject-hierarchy-tree');
  container.innerHTML = '';
  
  if (state.students.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="book-open"></i>
        <h4>표시할 과목 데이터가 없습니다</h4>
        <p>'데이터 관리' 탭에서 데이터를 업로드해 주세요.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // 1. 과목별 그룹화
  const tree = {};
  state.students.forEach(s => {
    const sub = s.subject || '과목 없음';
    if (!tree[sub]) tree[sub] = [];
    tree[sub].push(s);
  });

  // 2. DOM 빌드
  const sortedSubjects = Object.keys(tree).sort();
  
  sortedSubjects.forEach(sub => {
    const records = tree[sub];
    
    // 과목의 총 오류 개수
    let totalErrors = 0;
    records.forEach(r => { if (r.errors) totalErrors += r.errors.length; });
    const badgeMsg = totalErrors > 0 ? `오류 ${totalErrors}건` : '정상';

    const subAcc = createAccordion(sub, `${records.length}명 / ${badgeMsg}`);
    container.appendChild(subAcc.element);
    
    // 과목 배지 컬러링
    const badgeSpan = subAcc.element.querySelector('.accordion-header-badge');
    if (totalErrors > 0) {
      badgeSpan.style.backgroundColor = 'var(--color-slang-bg)';
      badgeSpan.style.color = 'var(--color-slang-text)';
    } else {
      badgeSpan.style.backgroundColor = 'var(--color-success-bg)';
      badgeSpan.style.color = 'var(--color-success-text)';
    }

    // 펼쳤을 때 학생 목록 카드 그리드 배치
    const cardGrid = document.createElement('div');
    cardGrid.className = 'group-card-grid';
    subAcc.content.appendChild(cardGrid);
    
    // 학생 학번순 정렬
    const sortedRecords = [...records].sort((a, b) => String(a.sNum).localeCompare(String(b.sNum)));

    sortedRecords.forEach(r => {
      const card = document.createElement('div');
      card.className = 'group-student-card';
      
      const eCount = r.errors ? r.errors.length : 0;
      const statusTxt = eCount > 0 ? `오류 ${eCount}` : '정상';
      const statusStyle = eCount > 0 
        ? 'background-color: var(--color-spelling-bg); color: var(--color-spelling-text);'
        : 'background-color: var(--color-success-bg); color: var(--color-success-text);';

      const { grade, classVal } = parseGradeAndClass(r.sNum);
      const studentMeta = `${grade} ${classVal} - ${r.sNum || '학번 없음'}`;

      card.innerHTML = `
        <div class="group-card-title">
          <span>${escapeHTML(r.name)}</span>
          <span style="font-size: 10px; padding: 1px 5px; border-radius: 3px; font-weight:600; ${statusStyle}">${statusTxt}</span>
        </div>
        <div class="group-card-subtitle">${studentMeta}</div>
        <div class="group-card-desc">${escapeHTML(r.content || '내용 없음')}</div>
      `;
      
      // 카드 클릭 시 에디터 점프 연동
      card.addEventListener('click', () => {
        const actualIndex = state.students.findIndex(s => s.id === r.id);
        if (actualIndex !== -1) {
          state.currentStudentIndex = actualIndex;
          loadStudentIntoEditor(actualIndex);
          switchTab('student-group-view');
          showToast(`'${r.name}' 학생의 '${sub}' 교정 화면으로 이동했습니다.`);
        }
      });
      
      cardGrid.appendChild(card);
    });
  });
  
  rebuildSelect(DOM.filterYear, years, '학년');
  rebuildSelect(DOM.filterClass, classes, '반');
  rebuildSelect(DOM.filterSubject, subjects, '과목');
}

// 에디터 좌측 학생 명부 렌더링 함수
function renderEditorStudentList() {
  const container = DOM.editorStudentListContainer;
  if (!container) return;
  container.innerHTML = '';
  
  // 필터링 적용 (검색어, 학년, 반)
  const filtered = state.students.filter(s => {
    // 1. 검색어 필터
    if (state.editorFilters.searchTerm) {
      const query = state.editorFilters.searchTerm.toLowerCase();
      if (!s.name.toLowerCase().includes(query)) return false;
    }
    
    // 2. 학년 필터
    if (state.editorFilters.year !== 'all') {
      const { grade } = parseGradeAndClass(s.sNum);
      if (grade !== state.editorFilters.year) return false;
    }
    
    // 3. 반 필터
    if (state.editorFilters.class !== 'all') {
      const { classVal } = parseGradeAndClass(s.sNum);
      if (classVal !== state.editorFilters.class) return false;
    }
    
    return true;
  });

  // 학번순(오름차순) 정렬
  filtered.sort((a, b) => String(a.sNum).localeCompare(String(b.sNum)));

  // 명부 개수 표시
  if (DOM.editorStudentCount) {
    DOM.editorStudentCount.textContent = filtered.length;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; color: var(--text-secondary); padding: 24px 8px; font-size: 12px;">
        조건에 맞는 학생이 없습니다.
      </div>
    `;
    return;
  }

  filtered.forEach((stud, idx) => {
    // 실제 state.students 내의 전체 인덱스 탐색
    const actualIndex = state.students.findIndex(s => s.id === stud.id);
    
    const item = document.createElement('div');
    const isActive = (state.currentStudentIndex === actualIndex);
    item.className = `editor-student-item ${isActive ? 'active' : ''}`;
    item.setAttribute('data-index', actualIndex);
    
    const { grade, classVal } = parseGradeAndClass(stud.sNum);
    const errCount = stud.errors ? stud.errors.length : 0;
    
    // 에러 상태에 따른 아이콘 및 클래스
    const statusIcon = errCount > 0 
      ? '<i data-lucide="alert-circle" class="status-icon-warn" style="width:16px; height:16px;"></i>'
      : '<i data-lucide="check-circle" class="status-icon-ok" style="width:16px; height:16px;"></i>';

    item.innerHTML = `
      <span class="editor-student-item-idx">${idx + 1}</span>
      <div class="editor-student-item-info">
        <span class="editor-student-item-name">${escapeHTML(stud.name || '이름 없음')}</span>
        <span class="editor-student-item-meta">${grade} ${classVal} - ${escapeHTML(stud.sNum || '학번 없음')}</span>
      </div>
      <div class="editor-student-item-status">${statusIcon}</div>
    `;
    
    item.addEventListener('click', () => {
      loadStudentIntoEditor(actualIndex);
    });
    
    container.appendChild(item);
  });
  
  lucide.createIcons();
}

// 에디터 좌측 상단 학년/반 드롭다운 동적 채우기
function updateEditorFilterDropdowns() {
  const years = new Set();
  const classes = new Set();
  
  state.students.forEach(s => {
    if (s.sNum) {
      const { grade, classVal } = parseGradeAndClass(s.sNum);
      years.add(grade);
      classes.add(classVal);
    }
  });

  rebuildSelect(DOM.editorStudentFilterYear, years, '학년');
  rebuildSelect(DOM.editorStudentFilterClass, classes, '반');
}

// [공용 헬퍼] select 드롭다운 항목을 Set 데이터를 기반으로 동적 재생성하는 함수
function rebuildSelect(selectEl, set, prefix) {
  if (!selectEl) return;
  const currentVal = selectEl.value;
  selectEl.innerHTML = `<option value="all">${prefix}: 전체</option>`;
  
  Array.from(set).sort((a, b) => {
    const aNum = parseInt(a) || 0;
    const bNum = parseInt(b) || 0;
    if (aNum !== bNum) return aNum - bNum;
    return a.localeCompare(b);
  }).forEach(item => {
    const opt = document.createElement('option');
    opt.value = item;
    opt.textContent = item;
    selectEl.appendChild(opt);
  });
  
  if (Array.from(set).includes(currentVal)) {
    selectEl.value = currentVal;
  } else {
    selectEl.value = 'all';
  }
}
