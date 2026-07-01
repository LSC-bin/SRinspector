const fs = require('fs');
const path = require('path');

// 1. 샘플 데이터 생성을 위한 소스 데이터 정의
const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
const firstNames = ['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준우', '준서', '도현', '건우', '우진', '지훈', '서연', '서윤', '지우', '서현', '하은', '하윤', '민서', '지유', '윤서', '지민', '채원', '수아', '지아', '윤아', '서진'];

const subjects = [
  '국어', '수학I', '영어I', '한국사', '통합과학', '통합사회', 
  '정보과학', '물리학I', '화학I', '생명과학I', '지구과학I', '창의융합과학'
];

// 에러 패턴 템플릿 (의도적으로 맞춤법/지침 위반 요소를 삽입한 텍스트 템플릿들)
const contentTemplates = [
  // 맞춤법 오류 (역활, 됬다, 안되, 바램)
  (name, sub) => `${sub} 수업 시간에 뛰어난 집중력을 보이며 모둠의 조장으로서 중추적인 역활을 수행함. 탐구 발표 준비 시 적극적인 협조가 됬다. 스스로 노력하는 모습이 매우 기특하며 앞으로 큰 발전이 있기를 바램.`,
  // 비표준어/은어 오류 (킹받다, 개이득, 찐)
  (name, sub) => `${sub} 교과 탐구 프로젝트에서 매우 찐적인 탐구 태도로 주제를 발표함. 실험 과정에서 오류가 발생했을 때 킹받는 상황이었으나 침착하게 대안을 모색하여 결국 개이득인 실험 결과를 얻어냄.`,
  // 외래어 표기 오류 (시물레이션, 컨텐츠, 메세지)
  (name, sub) => `${sub} 실험 단원에서 컴퓨터 프로그램을 활용한 물리 현상 시물레이션을 설계함. 학급 동료들이 이해하기 쉬운 학습 컨텐츠를 제작하고 탐구 결과 메시지를 정확하게 전달하기 위해 성실히 기여함.`,
  // 띄어쓰기 2개 오류, 온점 누락 오류
  (name, sub) => `${sub} 수업에 매번 예습을 철저히  준비해 오는 성실한 학생임. 질문을 통해 개념을 확고히 다지며  문제를 스스로 해결함 탐구 보고서를 꼼꼼이 작성하고 기한 내에 제출하려 애씀`,
  // 기재 금지 키워드 (토익, 경시대회, 학원) 및 실명 노출
  (name, sub) => `${name} 학생은 ${sub} 학업 역량이 매우 뛰어나며 학원에서 배운 개념을 응용하여 심화 학습을 전개함. 교외 수학 경시대회 준비로 바쁜 와중에도 영어 토익 성적 향상을 위해 주도적으로 노력함.`,
  // 정상 텍스트 예시 (에러 없음)
  (name, sub) => `${sub} 과목에 깊은 관심과 흥미를 가지고 성실히 참여함. 어려운 개념도 끝까지 질문하여 완전히 자신의 것으로 만들며, 동료 학생들의 학습을 돕는 이타적인 태도가 돋보임.`,
  // 외래어/맞춤법 복합 오류
  (name, sub) => `${sub} 탐구 과제를 준비하면서 카테고리별로 자료를 분리하여 정리하는 능력이 우수함. 자료 부족 문제를 해결하기 위해 무릅쓰고 노력하였으며 결국 좋은 결과물이 나와 흡족하게 생각함.`
];

// 2. 100명의 학생 이름 생성 (중복 최소화)
const students = [];
for (let i = 0; i < 100; i++) {
  const lName = lastNames[i % lastNames.length];
  const fName1 = firstNames[i % firstNames.length];
  const fName2 = firstNames[(i + 7) % firstNames.length];
  const fullName = lName + fName1[0] + fName2[1];
  
  // 학번 생성 (3학년 1반 1번 ~ 100번 가상 번호 부여)
  const classNum = String(Math.floor(i / 30) + 1).padStart(2, '0');
  const studentNum = String((i % 30) + 1).padStart(2, '0');
  const studentId = `3${classNum}${studentNum}`;

  students.push({
    name: fullName,
    sNum: studentId
  });
}

// 3. 데이터 로우 작성 (100명 * 12과목 = 1,200행)
const csvRows = [];
// CSV 헤더
csvRows.push(['구분', '학년도', '학기', '학번', '이름', '과목명/주제명', '내용 (생활기록부 세부 특기사항)'].join(','));

students.forEach((stud) => {
  subjects.forEach((sub, subIdx) => {
    const type = subIdx % 6 === 5 ? '주제선택' : '세특';
    const year = '2026';
    const term = subIdx % 2 === 0 ? '1학기' : '2학기';
    
    // 학생별 & 과목별로 템플릿 무작위 매칭
    const templateIdx = (parseInt(stud.sNum) + subIdx) % contentTemplates.length;
    let content = contentTemplates[templateIdx](stud.name, sub);
    
    // CSV 내 쉼표, 개행, 따옴표 예외 처리
    // 큰따옴표 감싸기 및 내부 큰따옴표 이스케이프
    content = `"${content.replace(/"/g, '""')}"`;
    
    const row = [
      type,
      year,
      term,
      stud.sNum,
      stud.name,
      sub,
      content
    ].join(',');
    
    csvRows.push(row);
  });
});

// 4. UTF-8 BOM을 붙여 CSV 파일 저장 (엑셀 한글 깨짐 방지)
const outputFilePath = path.join(__dirname, 'student_large_sample.csv');
const bom = '\ufeff';
fs.writeFileSync(outputFilePath, bom + csvRows.join('\n'), 'utf8');

console.log(`성공적으로 대용량 샘플 데이터를 생성했습니다: ${outputFilePath}`);
console.log(`총 생성 행수: ${csvRows.length - 1}개`);
