import os
import re

app_path = "C:/Users/82102/Desktop/workspace/SRinspector/app.js"
with open(app_path, "r", encoding="utf-8") as f:
    code = f.read()

new_func = """function renderSubjectGroupView() {
  const sidebarList = document.getElementById('subject-list-container');
  const countSpan = document.getElementById('subject-list-count');
  const emptyState = document.getElementById('subject-empty-state');
  const activeContainer = document.getElementById('subject-active-container');
  const titleSpan = document.getElementById('current-subject-title');
  const metaSpan = document.getElementById('current-subject-meta');
  const cardsContainer = document.getElementById('subject-student-cards-container');
  
  if (!sidebarList) return;
  sidebarList.innerHTML = '';
  
  if (state.students.length === 0) {
    if (countSpan) countSpan.textContent = '0';
    if (emptyState) emptyState.style.display = 'flex';
    if (activeContainer) activeContainer.style.display = 'none';
    return;
  }
  
  // 1. 과목별 그룹화
  const tree = {};
  state.students.forEach(s => {
    const sub = s.subject || '미분류';
    if (!tree[sub]) tree[sub] = [];
    tree[sub].push(s);
  });
  
  const sortedSubjects = Object.keys(tree).sort();
  if (countSpan) countSpan.textContent = sortedSubjects.length;
  
  let firstSubjectItem = null;

  sortedSubjects.forEach(sub => {
    const records = tree[sub];
    let totalErrors = 0;
    records.forEach(r => { if (r.errors) totalErrors += r.errors.length; });
    
    // 좌측 사이드바 아이템 생성
    const item = document.createElement('div');
    item.className = 'editor-student-item';
    item.dataset.subject = sub;
    
    const iconColor = totalErrors > 0 ? 'var(--color-slang-text)' : 'var(--color-success-text)';
    const iconType = totalErrors > 0 ? 'alert-circle' : 'check-circle';
    
    item.innerHTML = 
      <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
        <span style="font-weight: 600; font-size: 13px; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">
          
        </span>
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 11px; color: var(--text-secondary); background: var(--bg-secondary); padding: 2px 6px; border-radius: 10px;">명</span>
          <i data-lucide="" style="width: 14px; height: 14px; color: ;"></i>
        </div>
      </div>
    ;
    
    item.addEventListener('click', () => {
      // 사이드바 활성화 처리
      Array.from(sidebarList.children).forEach(child => child.classList.remove('active'));
      item.classList.add('active');
      
      // 우측 영역 갱신
      if (emptyState) emptyState.style.display = 'none';
      if (activeContainer) activeContainer.style.display = 'flex';
      if (titleSpan) titleSpan.textContent = sub;
      if (metaSpan) metaSpan.textContent = 학생 명 / 총 오류 건;
      
      // 우측 카드 그리드 생성
      if (cardsContainer) {
        cardsContainer.innerHTML = '';
        const cardGrid = document.createElement('div');
        cardGrid.className = 'group-card-grid';
        cardsContainer.appendChild(cardGrid);
        
        const sortedRecords = [...records].sort((a, b) => String(a.sNum).localeCompare(String(b.sNum)));
        
        sortedRecords.forEach(r => {
          const card = document.createElement('div');
          card.className = 'group-student-card';
          
          const eCount = r.errors ? r.errors.length : 0;
          const statusTxt = eCount > 0 ? 오류  : '통과';
          const statusStyle = eCount > 0 
            ? 'background-color: var(--color-spelling-bg); color: var(--color-spelling-text);'
            : 'background-color: var(--color-success-bg); color: var(--color-success-text);';
            
          const sNumStr = r.sNum ? r.sNum.toString() : '';
          const grade = sNumStr.length >= 1 ? sNumStr.substring(0, 1) + '학년' : '';
          const classVal = sNumStr.length >= 3 ? sNumStr.substring(1, 3) + '반' : '';
          const studentMeta = sNumStr ? ${grade}  -  : '학번 없음';
          
          card.innerHTML = 
            <div class="group-card-title">
              <span></span>
              <span style="font-size: 10px; padding: 1px 5px; border-radius: 3px; font-weight:600; "></span>
            </div>
            <div class="group-card-subtitle"></div>
            <div class="group-card-desc"></div>
          ;
          
          card.addEventListener('click', () => {
            const actualIndex = state.students.findIndex(s => s.id === r.id);
            if (actualIndex !== -1) {
              state.currentStudentIndex = actualIndex;
              loadStudentIntoEditor(actualIndex);
              switchTab('student-group-view');
              showToast('' 학생의 상세 화면으로 이동했습니다.);
            }
          });
          
          cardGrid.appendChild(card);
        });
        lucide.createIcons();
      }
    });
    
    if (!firstSubjectItem) firstSubjectItem = item;
    sidebarList.appendChild(item);
  });
  
  // 첫 번째 항목 자동 선택
  if (firstSubjectItem) {
    firstSubjectItem.click();
  }
  
  lucide.createIcons();
}"""

old_func_pattern = r"function renderSubjectGroupView\(\) \{[\s\S]*?(?=\n\nfunction|\n//|\n$)"
code = re.sub(old_func_pattern, new_func, code, count=1)

with open(app_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Patch applied for subject view")
