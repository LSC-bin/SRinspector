/**
 * 생활기록부 점검 규칙 엔진 (Student Record Checker Engine)
 */

// 1. 사전 데이터 정의
const CHECKER_DICTIONARY = {
  // 맞춤법 및 흔한 오탈자 (오류 단어 : { replace: '대체단어', reason: '이유' })
  spelling: {
    '역활': { replace: '역할', reason: '‘역할’이 올바른 표기입니다.' },
    '됬다': { replace: '됐다', reason: '‘되었다’의 준말이므로 ‘됐다’가 맞습니다.' },
    '됬고': { replace: '됐고', reason: '‘됐고’가 올바른 표기입니다.' },
    '됬을': { replace: '됐을', reason: '‘됐을’이 올바른 표기입니다.' },
    '됬던': { replace: '됐던', reason: '‘됐던’이 올바른 표기입니다.' },
    '안되': { replace: '안 돼', reason: '어간 ‘안되-’ 뒤에 어미 ‘-어’가 붙어 ‘안 돼’가 됩니다.' },
    '않하고': { replace: '안 하고', reason: '부정 부사 ‘안’을 사용해야 합니다.' },
    '않돼': { replace: '안 돼', reason: '부정 부사 ‘안’을 사용해야 합니다.' },
    '않된다': { replace: '안 된다', reason: '부정 부사 ‘안’을 사용해야 합니다.' },
    '바램': { replace: '바람', reason: '‘바라다’에서 온 명사는 ‘바람’이 맞습니다.' },
    '문안하다': { replace: '무난하다', reason: '어렵지 않고 평범하다는 뜻은 ‘무난(無難)하다’입니다.' },
    '제작년': { replace: '재작년', reason: '지난해의 바로 전 해는 ‘재작년(再昨年)’입니다.' },
    '일일히': { replace: '일일이', reason: '‘일일이’가 올바른 부사 표기입니다.' },
    '틈틈히': { replace: '틈틈이', reason: '‘틈틈이’가 올바른 부사 표기입니다.' },
    '깨끗히': { replace: '깨끗이', reason: '‘깨끗이’가 올바른 부사 표기입니다.' },
    '꼼꼼이': { replace: '꼼꼼히', reason: '‘꼼꼼히’가 올바른 부사 표기입니다.' },
    '어의없다': { replace: '어이없다', reason: '일이 너무 뜻밖이어서 황당하다는 뜻은 ‘어이없다’입니다.' },
    '금새': { replace: '금세', reason: '‘금시에’가 줄어든 말이므로 ‘금세’가 맞습니다.' },
    '요세': { replace: '요새', reason: '‘요사이’의 준말이므로 ‘요새’가 맞습니다.' },
    '몇일': { replace: '며칠', reason: '‘며칠’이 표준어이며 어원이 불분명하여 소리 나는 대로 적습니다.' },
    '설레임': { replace: '설렘', reason: '‘설레다’의 명사형은 ‘설렘’입니다.' },
    '구절판': { replace: '구절판', reason: '밀전병과 8가지 재료를 담는 그릇/음식은 ‘구절판’이 맞습니다.' },
    '가짐으로': { replace: '가짐으로써', reason: '수단이나 도구를 나타낼 때는 조사 ‘-써’를 붙여 ‘가짐으로써’로 씁니다.' },
    '대물림': { replace: '물림', reason: '‘대물림’보다 ‘물림’ 또는 ‘상속’ 등으로 순화하여 적습니다.' },
    '치뤄': { replace: '치러', reason: '‘치르다’의 어미 활용은 ‘치러’가 맞습니다.' },
    '치뤘다': { replace: '치렀다', reason: '‘치렀다’가 맞습니다.' },
    '잠궈': { replace: '잠가', reason: '‘잠그다’의 어미 활용은 ‘잠가’가 맞습니다.' },
    '잠궜다': { replace: '잠갔다', reason: '‘잠갔다’가 맞습니다.' },
    '들어나다': { replace: '드러나다', reason: '보이지 않던 것이 보이게 되는 것은 ‘드러나다’입니다.' },
    '맞춤법': { replace: '맞춤법', reason: '‘맞춤법’이 올바른 표기입니다.' },
    '무릅쓰고': { replace: '무릅쓰고', reason: '힘든 일을 참아낸다는 뜻은 ‘무릅쓰다’입니다.' },
    '구비하다': { replace: '갖추다', reason: '‘구비하다’는 ‘갖추다’로 순화하는 것이 좋습니다.' },
    '가르키다': { replace: '가리키다', reason: '손가락 등으로 방향을 지목할 때는 ‘가리키다’가 맞습니다.' },
    '가르치다': { replace: '가르치다', reason: '지식이나 기능을 습득하게 할 때는 ‘가르치다’가 맞습니다.' }
  },

  // 비표준어 및 청소년 은어/비속어
  slang: {
    '개이득': { replace: '큰 성과', reason: '학생의 품위를 떨어뜨리는 속어 사용을 금지합니다.' },
    '킹받다': { replace: '자극을 받다', reason: '학생의 품위를 떨어뜨리는 신조어/은어 사용을 금지합니다.' },
    '킹받는': { replace: '자극을 주는', reason: '학생의 품위를 떨어뜨리는 신조어/은어 사용을 금지합니다.' },
    '잼민이': { replace: '어린이/학생', reason: '인터넷 비하적 은어로 사용되는 단어이므로 표준어를 사용해야 합니다.' },
    '개꿀': { replace: '매우 유익함', reason: '품격 없는 비속어 표현을 금지합니다.' },
    '개사기': { replace: '매우 뛰어남', reason: '품격 없는 비속어 표현을 금지합니다.' },
    '찐': { replace: '진짜/실제', reason: '구어적 표현이나 신조어 대신 격식 있는 단어를 사용해야 합니다.' },
    '존맛': { replace: '매우 뛰어난 맛', reason: '상스러운 비속어 표현이므로 생기부에 절대 기재할 수 없습니다.' },
    '노답': { replace: '해결책이 없음', reason: '인터넷 은어 대신 격식 있는 표준어를 사용하십시오.' },
    '뇌피셜': { replace: '주관적인 추정', reason: '인터넷 은어 대신 격식 있는 전문 용어 또는 쉬운 우리말을 사용하십시오.' },
    '솔까': { replace: '솔직히 말하면', reason: '채팅 축약어는 생활기록부에 기재할 수 없습니다.' },
    '현타': { replace: '허탈감', reason: '인터넷 신조어 대신 표준어 표현을 권장합니다.' },
    '케바케': { replace: '경우에 따름', reason: '외래어 축약어 및 은어 대신 ‘경우에 따라 다름’으로 순화하십시오.' },
    '사바사': { replace: '사람에 따름', reason: '은어 대신 ‘개인별 편차가 있음’ 등으로 순화하십시오.' },
    '어쩔티비': { replace: '상대방의 의견을 무시함', reason: '학생 품위에 어긋나는 유행어는 절대 기재할 수 없습니다.' },
    '생얼': { replace: '민낯', reason: '속어 대신 표준어인 ‘민낯’을 권장합니다.' },
    '야자': { replace: '야간 자율학습', reason: '축약어 대신 정식 명칭을 권장합니다.' }
  },

  // 외래어 표기 교정
  loanword: {
    '시물레이션': { replace: '시뮬레이션', reason: 'Simulation의 표준 외래어 표기는 ‘시뮬레이션’입니다.' },
    '컨텐츠': { replace: '콘텐츠', reason: 'Contents의 표준 외래어 표기는 ‘콘텐츠’입니다.' },
    '메세지': { replace: '메시지', reason: 'Message의 표준 외래어 표기는 ‘메시지’입니다.' },
    '카테고리': { replace: '범주', reason: '외래어 표기보다 쉬운 우리말인 ‘범주’를 사용하는 것을 권장합니다.' },
    '리포트': { replace: '보고서', reason: '외래어 표기보다 쉬운 우리말인 ‘보고서’를 사용하는 것을 권장합니다.' },
    '타겟': { replace: '타깃', reason: 'Target의 표준 외래어 표기는 ‘타깃’입니다.' },
    '팜플렛': { replace: '팸플릿', reason: 'Pamphlet의 표준 외래어 표기는 ‘팸플릿’입니다.' },
    '브로셔': { replace: '브로슈어', reason: 'Brochure의 표준 외래어 표기는 ‘브로슈어’입니다.' },
    '비젼': { replace: '비전', reason: 'Vision의 표준 외래어 표기는 ‘비전’입니다.' },
    '맴버': { replace: '멤버', reason: 'Member의 표준 외래어 표기는 ‘멤버’입니다.' },
    '엑티비티': { replace: '액티비티', reason: 'Activity의 표준 외래어 표기는 ‘액티비티’입니다.' },
    '바디': { replace: '바디/신체', reason: 'Body의 표준 외래어 표기는 ‘보디’이나 교육용어상 ‘신체’ 등으로 순화 가능합니다.' },
    '알고리즘': { replace: '알고리즘', reason: 'Algorithm의 표준 외래어 표기는 ‘알고리즘’입니다.' },
    '네비게이션': { replace: '내비게이션', reason: 'Navigation의 표준 외래어 표기는 ‘내비게이션’입니다.' },
    '어플': { replace: '애플리케이션(앱)', reason: '축약어 ‘어플’ 대신 ‘애플리케이션’ 또는 ‘앱’을 사용해야 합니다.' },
    '어플리케이션': { replace: '애플리케이션', reason: 'Application의 표준 외래어 표기는 ‘애플리케이션’입니다.' }
  },

  // 생기부 기재 금지 키워드 (오류 어구 : { replace: '경고', reason: '이유' })
  forbidden: {
    '토익': { replace: '[기재 금지]', reason: '공인어학성적(TOEIC)은 학교생활기록부 기재 금지 사항입니다.' },
    'TOEIC': { replace: '[기재 금지]', reason: '공인어학성적(TOEIC)은 학교생활기록부 기재 금지 사항입니다.' },
    '토플': { replace: '[기재 금지]', reason: '공인어학성적(TOEFL)은 학교생활기록부 기재 금지 사항입니다.' },
    'TOEFL': { replace: '[기재 금지]', reason: '공인어학성적(TOEFL)은 학교생활기록부 기재 금지 사항입니다.' },
    '텝스': { replace: '[기재 금지]', reason: '공인어학성적(TEPS)은 학교생활기록부 기재 금지 사항입니다.' },
    'TEPS': { replace: '[기재 금지]', reason: '공인어학성적(TEPS)은 학교생활기록부 기재 금지 사항입니다.' },
    'HSK': { replace: '[기재 금지]', reason: '공인어학성적(HSK)은 학교생활기록부 기재 금지 사항입니다.' },
    'JLPT': { replace: '[기재 금지]', reason: '공인어학성적(JLPT)은 학교생활기록부 기재 금지 사항입니다.' },
    '올림피아드': { replace: '[기재 금지]', reason: '교외 대회 관련 용어 및 실적은 학교생활기록부 기재 금지 사항입니다.' },
    '경시대회': { replace: '[기재 금지]', reason: '교외 대회 및 경시대회 참가 사실은 학교생활기록부 기재 금지 사항입니다.' },
    '교외수상': { replace: '[기재 금지]', reason: '교외 수상 실적은 학교생활기록부 기재 금지 사항입니다.' },
    '학원': { replace: '[기재 금지]', reason: '사설 학원 및 교외 교육기관명 언급은 기재 금지 사항입니다.' },
    '과외': { replace: '[기재 금지]', reason: '사설 교육 및 과외 언급은 기재 금지 사항입니다.' },
    '영재학급': { replace: '[기재 금지]', reason: '영재교육원 및 영재학급 이수 사실은 생기부 기재 금지 사항입니다.' },
    '영재교육원': { replace: '[기재 금지]', reason: '영재교육원 및 영재학급 이수 사실은 생기부 기재 금지 사항입니다.' },
    '논문': { replace: '[기재 금지]', reason: '학회지/논문 등 등재 및 사설 실적은 기재 금지 사항입니다.' },
    '도서 출판': { replace: '[기재 금지]', reason: '도서 출판 및 저서 활동은 기재 금지 사항입니다.' },
    '도서 출간': { replace: '[기재 금지]', reason: '도서 출판 및 저서 활동은 기재 금지 사항입니다.' },
    '특허': { replace: '[기재 금지]', reason: '특허 출원 및 발명 실적 관련은 기재 금지 사항입니다.' },
    '자격증': { replace: '[기재 금지]', reason: '기술/사설 자격증 취득 사실은 기재 금지 사항입니다.' },
    '컴퓨터활용능력': { replace: '[기재 금지]', reason: '국가기술자격증 등의 생기부 본문 기재는 금지되어 있습니다.' },
    '워드프로세서': { replace: '[기재 금지]', reason: '국가기술자격증 등의 생기부 본문 기재는 금지되어 있습니다.' },
    '모의고사': { replace: '[기재 금지]', reason: '모의고사 및 성적 실적은 학교생활기록부 기재 금지 사항입니다.' },
    '전국연합평가': { replace: '[기재 금지]', reason: '전국연합평가 및 모의고사 사실은 학교생활기록부 기재 금지 사항입니다.' },
    '장학생': { replace: '[기재 금지]', reason: '장학생 및 장학금 수혜 사실은 학교생활기록부 기재 금지 사항입니다.' },
    '장학금': { replace: '[기재 금지]', reason: '장학생 및 장학금 수혜 사실은 학교생활기록부 기재 금지 사항입니다.' },
    '해외 활동': { replace: '[기재 금지]', reason: '해외 봉사 및 연수 활동은 학교생활기록부 기재 금지 사항입니다.' },
    '해외 연수': { replace: '[기재 금지]', reason: '해외 봉사 및 연수 활동은 학교생활기록부 기재 금지 사항입니다.' },
    '해외 봉사': { replace: '[기재 금지]', reason: '해외 봉사 및 연수 활동은 학교생활기록부 기재 금지 사항입니다.' },
    
    // 기재 불가 상호명 순화 (가이드라인 준수)
    '구글': { replace: '포털사이트', reason: '특정 상호명(구글) 대신 일반 명사(포털사이트)를 사용해야 합니다.' },
    '네이버': { replace: '포털사이트', reason: '특정 상호명(네이버) 대신 일반 명사(포털사이트)를 사용해야 합니다.' },
    '다음': { replace: '포털사이트', reason: '특정 상호명(다음) 대신 일반 명사(포털사이트)를 사용해야 합니다.' },
    '네이버 밴드': { replace: '교육 플랫폼', reason: '특정 상호명(네이버 밴드) 대신 일반 명사(교육 플랫폼)를 사용해야 합니다.' },
    '네이버밴드': { replace: '교육 플랫폼', reason: '특정 상호명(네이버 밴드) 대신 일반 명사(교육 플랫폼)를 사용해야 합니다.' },
    '구글 클래스룸': { replace: '교육 플랫폼', reason: '특정 상호명(구글 클래스룸) 대신 일반 명사(교육 플랫폼)를 사용해야 합니다.' },
    '구글클래스룸': { replace: '교육 플랫폼', reason: '특정 상호명(구글 클래스룸) 대신 일반 명사(교육 플랫폼)를 사용해야 합니다.' },
    '온라인 클래스': { replace: '교육 플랫폼', reason: '특정 상호명(온라인 클래스) 대신 일반 명사(교육 플랫폼)를 사용해야 합니다.' },
    '온라인클래스': { replace: '교육 플랫폼', reason: '특정 상호명(온라인 클래스) 대신 일반 명사(교육 플랫폼)를 사용해야 합니다.' },
    '유튜브': { replace: '동영상 공유 플랫폼', reason: '특정 상호명(유튜브) 대신 일반 명사(동영상 공유 플랫폼 / 동영상)를 사용해야 합니다.' },
    '유튜버': { replace: '동영상 크리에이터', reason: '특정 상호명(유튜버) 대신 일반 명사(동영상 크리에이터 / 개인 미디어 제작자)를 사용해야 합니다.' },
    '카카오톡': { replace: 'SNS 메신저', reason: '특정 서비스명(카카오톡) 대신 일반 명사(SNS 메신저)를 사용해야 합니다.' },
    '카톡': { replace: 'SNS 메신저', reason: '특정 서비스명(카톡) 대신 일반 명사(SNS 메신저)를 사용해야 합니다.' },
    '인스타그램': { replace: 'SNS', reason: '특정 상호명(인스타그램) 대신 일반 명사(SNS / 소셜 네트워킹 서비스)를 사용해야 합니다.' },
    '페이스북': { replace: 'SNS', reason: '특정 상호명(페이스북) 대신 일반 명사(SNS / 소셜 네트워킹 서비스)를 사용해야 합니다.' },
    '메타': { replace: '소셜 네트워킹 서비스', reason: '특정 상호명 대신 일반 명사(SNS / 소셜 네트워킹 서비스)를 사용해야 합니다.' },
    '게더타운': { replace: '메타버스 플랫폼', reason: '특정 상호명(게더타운) 대신 일반 명사(메타버스 플랫폼)를 사용해야 합니다.' },
    '이프랜드': { replace: '메타버스 플랫폼', reason: '특정 상호명(이프랜드) 대신 일반 명사(메타버스 플랫폼)를 사용해야 합니다.' },
    '패들렛': { replace: '온라인 협업 플랫폼', reason: '특정 상호명(패들렛) 대신 일반 명사(온라인 협업 플랫폼)를 사용해야 합니다.' },
    '띵커벨': { replace: '온라인 협업 플랫폼', reason: '특정 상호명(띵커벨) 대신 일반 명사(온라인 협업 플랫폼)를 사용해야 합니다.' },
    '미리캔버스': { replace: '온라인 디자인 도구', reason: '특정 상호명(미리캔버스) 대신 일반 명사(온라인 디자인 도구)를 사용해야 합니다.' },
    '캔바': { replace: '온라인 디자인 도구', reason: '특정 상호명(캔바) 대신 일반 명사(온라인 디자인 도구)를 사용해야 합니다.' },
    '커리어넷': { replace: '진로 정보 사이트', reason: '특정 상호명(커리어넷) 대신 일반 명사(진로 정보 사이트)를 사용해야 합니다.' },
    '메이저맵': { replace: '진로 정보 사이트', reason: '특정 상호명(메이저맵) 대신 일반 명사(진로 정보 사이트)를 사용해야 합니다.' },

    // 기재 불가 기관명 및 영어 약칭 순화
    'TED 영상': { replace: '온라인 강연회 영상', reason: '특정 브랜드명(TED 영상) 대신 일반 명사(온라인 강연회 영상)를 사용해야 합니다.' },
    'TED': { replace: '온라인 강연회 영상', reason: '특정 브랜드명(TED) 대신 일반 명사(온라인 강연회 영상)를 사용해야 합니다.' },
    '유네스코': { replace: '국제 기구', reason: '기재 불가 기관(유네스코) 대신 일반 명사(국제 기구)를 사용해야 합니다.' },
    'UNESCO': { replace: '국제 기구', reason: '기재 불가 기관(UNESCO) 대신 일반 명사(국제 기구)를 사용해야 합니다.' },
    'WTO': { replace: '국제 기구', reason: '기재 불가 기관(WTO) 대신 일반 명사(국제 기구)를 사용해야 합니다.' },
    'OECD': { replace: '국제 기구', reason: '기재 불가 기관(OECD) 대신 일반 명사(국제 기구)를 사용해야 합니다.' },
    '유엔': { replace: '국제 기구', reason: '기재 불가 기관(유엔) 대신 일반 명사(국제 기구)를 사용해야 합니다.' },
    'UN': { replace: '국제 기구', reason: '기재 불가 기관(UN) 대신 일반 명사(국제 기구)를 사용해야 합니다.' },
    'EU': { replace: '국제 기구', reason: '기재 불가 기관(EU) 대신 일반 명사(국제 기구)를 사용해야 합니다.' },
    'WHO': { replace: '국제 기구', reason: '기재 불가 기관(WHO) 대신 일반 명사(국제 기구)를 사용해야 합니다.' },
    'IMF': { replace: '국제 기구', reason: '기재 불가 기관(IMF) 대신 일반 명사(국제 기구)를 사용해야 합니다.' },
    '통계청': { replace: '국가 통계 기관', reason: '기재 불가 기관명(통계청) 대신 일반 명사로 순화하여 작성하십시오.' },
    '금융감독원': { replace: '금융 관리 기관', reason: '기재 불가 기관명(금융감독원) 대신 일반 명사로 순화하여 작성하십시오.' },
    '금감원': { replace: '금융 관리 기관', reason: '기재 불가 기관명(금감원) 대신 일반 명사로 순화하여 작성하십시오.' },
    'KTX': { replace: '고속 열차', reason: '영어 약어(KTX) 대신 한글 순화어(고속 열차)를 사용해야 합니다.' },
    'SRT': { replace: '고속 열차', reason: '영어 약어(SRT) 대신 한글 순화어(고속 열차)를 사용해야 합니다.' },
    'CCD': { replace: '전하 결합 소자', reason: '영어 약어(CCD) 대신 한글 순화어(전하 결합 소자)를 사용해야 합니다.' },
    '체육대회': { replace: '스포츠 페스티벌', reason: '생활기록부 기재 가이드라인상 "체육대회" 단어는 직접적인 기재가 금지되어 있습니다. 대체 표현(스포츠 페스티벌, 체육 한마당 등)으로 순화하십시오.' }
  },

  // 학생 시점 주관적 서술 ➡️ 교사 관찰 시점 서술로 교정 유도 (Yellow Highlight 연동)
  perspective: {
    '라고 느낌': { replace: '라고 느낀 점을 서술함 / 발표함', reason: '학생 입장의 주관적 느낌 서술 대신, 교사가 관찰한 구체적 행위(발표함, 서술함)로 서술해야 합니다.' },
    '라고 생각함': { replace: '라는 견해를 밝힘 / 발표함', reason: '학생 입장의 주관적 생각 서술 대신, 교사가 관찰한 구체적 행위(견해를 밝힘, 발표함)로 서술해야 합니다.' },
    '생각해 봄': { replace: '생각해 보고 발표함', reason: '학생 입장의 심리 서술 대신, 교사가 관찰한 행위(발표함)로 서술해야 합니다.' },
    '라고 다짐함': { replace: '라는 포부를 밝힘', reason: '학생 입장의 다짐 서술 대신, 교사가 관찰한 행위(포부를 밝힘)로 서술해야 합니다.' },
    '을 배움': { replace: '을 탐구함 / 학습함', reason: '학생 시점의 배움 서술 대신, 교사가 관찰한 탐구 과정(탐구함, 학습함)으로 서술해야 합니다.' },
    '을 알게 됨': { replace: '을 탐구하여 이해함', reason: '학생 시점의 인지 서술 대신, 교사가 관찰한 탐구 과정으로 서술해야 합니다.' },
    '을 이해함': { replace: '을 탐구하여 분석함', reason: '학생 시점의 인지 서술 대신, 교사가 관찰한 탐구 및 분석 과정으로 서술해야 합니다.' },
    '라고 느꼈음': { replace: '라고 느낀 점을 서술함', reason: '학생 입장의 주관적 느낌 서술 대신, 교사가 관찰한 행위로 서술해야 합니다.' },
    '라고 느꼈다': { replace: '라고 느낀 점을 발표함', reason: '학생 입장의 주관적 느낌 서술 대신, 교사가 관찰한 행위로 서술해야 합니다.' },
    '생각했음': { replace: '견해를 밝힘', reason: '학생 입장의 주관적 생각 서술 대신, 교사가 관찰한 행위로 서술해야 합니다.' },
    '생각했다': { replace: '견해를 서술함', reason: '학생 입장의 주관적 생각 서술 대신, 교사가 관찰한 행위로 서술해야 합니다.' },
    '배웠다': { replace: '학습함', reason: '학생 시점의 배움 서술 대신, 교사가 관찰한 탐구 과정으로 서술해야 합니다.' },
    '알게 되었다': { replace: '이해함', reason: '학생 시점의 인지 서술 대신, 교사가 관찰한 탐구 과정으로 서술해야 합니다.' },
    '이해했다': { replace: '분석함', reason: '학생 시점의 인지 서술 대신, 교사가 관찰한 탐구 과정으로 서술해야 합니다.' }
  }
};

/**
 * NEIS 기준 바이트 계산
 */
function calculateNEISBytes(text) {
  if (!text) return 0;
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const code = char.charCodeAt(0);
    
    if (char === '\n') {
      bytes += 2;
    } else if (code <= 127) {
      bytes += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * 생기부 텍스트 검사 엔진
 */
function inspectStudentRecord(text, studentName = '', customConfig = {}) {
  const errors = [];
  if (!text || typeof text !== 'string') return errors;

  const config = {
    spelling: customConfig.spelling !== false,
    slang: customConfig.slang !== false,
    loanword: customConfig.loanword !== false,
    spacing: customConfig.spacing !== false,
    endingDot: customConfig.endingDot !== false,
    forbidden: customConfig.forbidden !== false,
    nameCheck: customConfig.nameCheck !== false,
    customDictionary: customConfig.customDictionary || {}
  };

  const runKeywordMatch = (dict, type, label) => {
    for (const [key, value] of Object.entries(dict)) {
      if (config.customDictionary[key] === null) continue;
      
      let index = text.indexOf(key);
      while (index !== -1) {
        errors.push({
          type: type,
          label: label,
          start: index,
          end: index + key.length,
          original: key,
          replace: config.customDictionary[key]?.replace || value.replace,
          reason: config.customDictionary[key]?.reason || value.reason
        });
        index = text.indexOf(key, index + 1);
      }
    }
  };

  // 맞춤법 검사
  if (config.spelling) {
    runKeywordMatch(CHECKER_DICTIONARY.spelling, 'spelling', '맞춤법/오탈자');
  }

  // 비표준어/은어 검사
  if (config.slang) {
    runKeywordMatch(CHECKER_DICTIONARY.slang, 'slang', '비표준어/은어');
  }

  // 외래어 표기 검사
  if (config.loanword) {
    runKeywordMatch(CHECKER_DICTIONARY.loanword, 'loanword', '외래어 표기');
  }

  // 기재 금지 키워드 검사
  if (config.forbidden) {
    runKeywordMatch(CHECKER_DICTIONARY.forbidden, 'forbidden', '기재 금지');
  }

  // 학생 시점 서술 검사 (노란색 하이라이터 매핑을 위해 type 'ai' 사용)
  if (config.spelling) {
    runKeywordMatch(CHECKER_DICTIONARY.perspective, 'ai', '학생 시점 서술');
  }

  // 커스텀 단어 사전 검사
  if (config.customDictionary) {
    const userDict = {};
    for (const [key, value] of Object.entries(config.customDictionary)) {
      if (value && value.replace) {
        userDict[key] = value;
      }
    }
    runKeywordMatch(userDict, 'custom', '사용자 정의');
  }

  // 3. 학생 실명 노출 검사
  if (config.nameCheck && studentName && studentName.trim().length >= 2) {
    const sName = studentName.trim();
    const namesToSearch = [sName];
    
    if (sName.length >= 3) {
      namesToSearch.push(sName.substring(1));
    }

    namesToSearch.forEach(name => {
      let index = text.indexOf(name);
      while (index !== -1) {
        errors.push({
          type: 'nameCheck',
          label: '실명 노출 주의',
          start: index,
          end: index + name.length,
          original: name,
          replace: '이 학생 / 학습자',
          reason: `생활기록부 본문에는 학생의 실명(${name}) 대신 ‘이 학생’, ‘학습자’ 등으로 표기하는 것을 권장합니다.`
        });
        index = text.indexOf(name, index + 1);
      }
    });
  }

  // 4. 띄어쓰기 연속 공백 검사 (2개 이상 연속된 공백)
  if (config.spacing) {
    const spacingRegex = / {2,}/g;
    let match;
    while ((match = spacingRegex.exec(text)) !== null) {
      errors.push({
        type: 'spacing',
        label: '연속 띄어쓰기',
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        replace: ' ',
        reason: '2개 이상의 연속적인 공백(띄어쓰기)이 발견되었습니다.'
      });
    }
  }

  // 5. 문장 종결 온점 및 명사형 종결 어미 검사
  if (config.endingDot) {
    const lines = text.split('\n');
    let offset = 0;
    
    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0) {
        // 1) 마침표(온점) 누락 점검
        const lastChar = trimmedLine.slice(-1);
        const validEndingChars = ['.', '!', '?', '"', '”', ')', ']'];
        
        if (!validEndingChars.includes(lastChar)) {
          const lastCharIndex = offset + line.lastIndexOf(lastChar);
          errors.push({
            type: 'endingDot',
            label: '온점 누락',
            start: lastCharIndex,
            end: lastCharIndex + 1,
            original: lastChar,
            replace: lastChar + '.',
            reason: '문장의 끝이 마침표(.)로 끝나지 않았습니다. 생활기록부 지침상 마침표 마무리를 확인하십시오.'
          });
        }

        // 2) 명사형 어미 종결 검사 (현재형/명사형 종결 규정 준수)
        // 문장의 실질적인 끝 글자(한글 형태소) 찾기 (구두점/공백 제외)
        let lastLetter = '';
        let lastLetterIdx = -1;
        for (let i = line.length - 1; i >= 0; i--) {
          const char = line[i];
          if (!['.', '!', '?', '"', '”', ')', ']', ' ', '\r', '\t'].includes(char)) {
            lastLetter = char;
            lastLetterIdx = offset + i;
            break;
          }
        }

        if (lastLetter && lastLetterIdx !== -1) {
          const code = lastLetter.charCodeAt(0);
          if (code >= 0xAC00 && code <= 0xD7A3) {
            const jong = (code - 0xAC00) % 28;
            const isNoun = (jong === 16 || jong === 10); // 16: ㅁ, 10: ㄻ
            if (!isNoun) {
              errors.push({
                type: 'endingDot',
                label: '종결 어미 오류',
                start: lastLetterIdx,
                end: lastLetterIdx + 1,
                original: lastLetter,
                replace: lastLetter + '함',
                reason: `문장이 명사형 어미(‘-함’, ‘-임’, ‘-됨’ 등)로 종결되지 않았습니다. 현재형/명사형 종결 지침을 확인하세요. (‘${lastLetter}’ ➡️ 명사형 종결 권장)`
              });
            }
          }
        }
      }
      offset += line.length + 1; // \n 길이 포함
    });
  }

  // 6. 대학명 기재 금지 정규식 감지
  if (config.forbidden) {
    const univRegex = /([가-힣]{2,10}(대학교|대학원|전문대|전문대학))|([서연고]대|서울대|연세대|고려대|서강대|성균관대|한양대|이화여대|중앙대|경희대|한국외대|서울시립대|카이스트|포스텍|디지스트|유니스트|지스트)/g;
    let match;
    while ((match = univRegex.exec(text)) !== null) {
      errors.push({
        type: 'forbidden',
        label: '대학명 기재 금지',
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        replace: '[기재 금지]',
        reason: `특정 대학명칭 및 약칭(${match[0]})은 학교생활기록부 기재 금지 조항에 해당합니다.`
      });
    }
  }

  // 7. 강사명/교수 실명 기재 금지 정규식 감지
  if (config.forbidden) {
    const lecturerRegex = /([가-힣]{2,4})\s*(강사|교수|박사|연구원)/g;
    let match;
    while ((match = lecturerRegex.exec(text)) !== null) {
      errors.push({
        type: 'forbidden',
        label: '강사명 기재 금지',
        start: match.index,
        end: match.index + match[0].length,
        original: match[0],
        replace: '전문가 / 관련 분야 종사자',
        reason: `외부 특강 강사 및 교수 등의 실명 기재(${match[0]})는 생활기록부 기재 금지 조항에 해당합니다.`
      });
    }
  }

  // 8. 영어 알파벳 단어 단독 기재 주의
  if (config.forbidden) {
    const englishRegex = /[a-zA-Z]{2,}/g;
    let match;
    while ((match = englishRegex.exec(text)) !== null) {
      const word = match[0];
      const isKnownForbidden = ['TOEIC', 'TOEFL', 'TEPS', 'HSK', 'JLPT', 'UNESCO', 'WTO', 'OECD', 'UN', 'OpenAI', 'Gemini', 'ChatGPT'].includes(word);
      if (!isKnownForbidden) {
        errors.push({
          type: 'forbidden',
          label: '외국어 단독 표기 주의',
          start: match.index,
          end: match.index + word.length,
          original: word,
          replace: '한글 음차 표기 권장',
          reason: `생활기록부는 한글 기재가 원칙입니다. 외국어 표기(${word}) 대신 한글 표기 또는 한글 음차 표기(예: Python -> 파이썬)를 권장합니다.`
        });
      }
    }
  }

  errors.sort((a, b) => a.start - b.start);

  const uniqueErrors = [];
  errors.forEach(err => {
    const isDuplicate = uniqueErrors.some(u => 
      u.start === err.start && u.end === err.end && u.type === err.type
    );
    if (!isDuplicate) {
      uniqueErrors.push(err);
    }
  });

  return uniqueErrors;
}

export { CHECKER_DICTIONARY, calculateNEISBytes, inspectStudentRecord };
