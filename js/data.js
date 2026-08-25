/* 컴퓨터공학 자습 로드맵 — 코어
 *
 * 실제 내용은 js/domains/*.js 에 분야 단위로 나뉘어 있고,
 * 각 파일이 defineDomain({...}) 으로 아래 배열에 자기 자신을 밀어 넣는다.
 * (스크립트 로드 순서 = 마인드맵에서 시계 방향 배치 순서)
 *
 * 주제 한 건의 형태:
 * {
 *   id, name, level(1~3),
 *   check,     이걸 답할 수 있으면 안다 — 한 줄 자가진단 질문
 *   tag,       한 줄 설명
 *   why,       왜 배우나 — 동기
 *   goal,      무엇을 할 수 있으면 끝인가 — 한 문단
 *   deliver[], 완료 판정 체크리스트 (이게 다 되면 끝)
 *   focus[],   { t: 중점 포인트, d: 왜 그런지 }
 *   concepts[],{ t: 같이 볼 개념, d: 한 줄 정의 }
 *   stack[], steps[], next[], note?
 * }
 */

const LEVELS = {
  1: { label: '입문', color: '#4ade80', desc: '선행 지식 거의 없이 바로 시작 가능' },
  2: { label: '중급', color: '#facc15', desc: '전공 필수 과목과 함께 가는 구간' },
  3: { label: '심화', color: '#f87171', desc: '여러 과목을 조합해야 넘어가는 구간' }
};

const ROADMAP = {
  center: {
    id: 'root',
    label: '컴퓨터공학\n자습 로드맵',
    desc: '전공 과목은 서로 얽혀 있다. 순서보다 "무엇을 할 수 있으면 끝인지"를 먼저 정하고 파고든다.'
  },
  domains: []
};

function defineDomain(d) {
  ROADMAP.domains.push(d);
}
