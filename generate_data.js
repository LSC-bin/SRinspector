const fs = require('fs');
const path = require('path');

// 1. 샘플 데이터 생성을 위한 소스 데이터 정의
const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '전', '홍'];
const firstNames = ['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준우', '준서', '도현', '건우', '우진', '지훈', '서연', '서윤', '지우', '서현', '하은', '하윤', '민서', '지유', '윤서', '지민', '채원', '수아', '지아', '윤아', '서진'];

const subjects = [
  '국어', '수학I', '영어I', '한국사', '통합과학', '통합사회', 
  '정보과학', '물리학I', '화학I', '생명과학I', '지구과학I', '창의융합과학'
];

// 에러 패턴 템플릿
const contentTemplates = [
  (name, sub) => `${sub} 수업 시간에 뛰어난 집중력을 보이며 모둠의 조장으로서 중추적인 역활을 수행함. 탐구 발표 준비 시 적극적인 협조가 됬다. 스스로 노력하는 모습이 매우 기특하며 앞으로 큰 발전이 있기를 바램.`,
  (name, sub) => `${sub} 교과 탐구 프로젝트에서 매우 찐적인 탐구 태도로 주제를 발표함. 실험 과정에서 오류가 발생했을 때 킹받는 상황이었으나 침착하게 대안을 모색하여 결국 개이득인 실험 결과를 얻어냄.`,
  (name, sub) => `${sub} 실험 단원에서 컴퓨터 프로그램을 활용한 물리 현상 시물레이션을 설계함. 학급 동료들이 이해하기 쉬운 학습 컨텐츠를 제작하고 탐구 결과 메시지를 정확하게 전달하기 위해 성실히 기여함.`,
  (name, sub) => `${sub} 수업에 매번 예습을 철저히  준비해 오는 성실한 학생임. 질문을 통해 개념을 확고히 다지며  문제를 스스로 해결함 탐구 보고서를 꼼꼼이 작성하고 기한 내에 제출하려 애씀`,
  (name, sub) => `${name} 학생은 ${sub} 학업 역량이 매우 뛰어나며 학원에서 배운 개념을 응용하여 심화 학습을 전개함. 교외 수학 경시대회 준비로 바쁜 와중에도 영어 토익 성적 향상을 위해 주도적으로 노력함.`,
  (name, sub) => `${sub} 과목에 깊은 관심과 흥미를 가지고 성실히 참여함. 어려운 개념도 끝까지 질문하여 완전히 자신의 것으로 만들며, 동료 학생들의 학습을 돕는 이타적인 태도가 돋보임.`,
  (name, sub) => `${sub} 탐구 과제를 준비하면서 카테고리별로 자료를 분리하여 정리하는 능력이 우수함. 자료 부족 문제를 해결하기 위해 무릅쓰고 노력하였으며 결국 좋은 결과물이 나와 흡족하게 생각함.`
];

// 2. 100명의 학생 이름 및 학년/반/번호 정보 생성
const students = [];
for (let i = 0; i < 100; i++) {
  const lName = lastNames[i % lastNames.length];
  const fName1 = firstNames[i % firstNames.length];
  const fName2 = firstNames[(i + 7) % firstNames.length];
  const fullName = lName + fName1[0] + fName2[1];
  
  // 학년, 반, 번호 가상 분리
  const grade = String((i % 3) + 1); // 1~3학년
  const ban = String(Math.floor(i / 20) + 1); // 1~5반
  const num = String((i % 20) + 1); // 1~20번

  students.push({
    name: fullName,
    grade,
    ban,
    num
  });
}

// 3. 데이터 로우 작성 (신규 9열 규격 대응)
const csvRows = [];
// CSV 헤더
csvRows.push(['학년도', '학기', '학년', '반', '번호', '성명', '구분', '과목', '내용'].join(','));

students.forEach((stud, idx) => {
  subjects.forEach((sub, subIdx) => {
    const year = '2026';
    const term = subIdx % 2 === 0 ? '1학기' : '2학기';
    const type = subIdx % 6 === 5 ? '주제선택' : '세특';
    
    // 학생별 & 과목별로 템플릿 무작위 매칭
    const templateIdx = (idx + subIdx) % contentTemplates.length;
    let content = contentTemplates[templateIdx](stud.name, sub);
    
    // CSV 내 쉼표, 개행, 따옴표 예외 처리
    content = `"${content.replace(/"/g, '""')}"`;
    
    const row = [
      year,
      term,
      stud.grade,
      stud.ban,
      stud.num,
      stud.name,
      type,
      sub,
      content
    ].join(',');
    
    csvRows.push(row);
  });
});

// 4. UTF-8 BOM을 붙여 CSV 파일 저장
const outputFilePath = path.join(__dirname, 'student_large_sample.csv');
const bom = '\ufeff';
fs.writeFileSync(outputFilePath, bom + csvRows.join('\n'), 'utf8');

console.log(`성공적으로 대용량 샘플 CSV 데이터를 생성했습니다: ${outputFilePath}`);
console.log(`총 생성 행수: ${csvRows.length - 1}개`);
