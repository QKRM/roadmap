/* 추천 경로 — 60개 주제를 어떤 순서로 밟을지에 대한 제안.
 *
 * 로드맵 자체는 순서를 강제하지 않지만, "그래서 뭐부터?"에 답이 없으면
 * 대부분 첫 화면에서 멈춘다. 그 답을 네 갈래로 나눠 둔다.
 *
 * 경로 한 건의 형태:
 * {
 *   id, label, tag, color,
 *   forWhom,        누구에게 맞는 경로인가
 *   span,           대략의 기간
 *   stages[]: { label, sub, goal, items[주제 id] }
 * }
 *
 * items 의 id 는 ROADMAP 안에 실재해야 한다 (app.js 가 진입 시 검증한다).
 */

const PATHS = [
  {
    id: 'core',
    label: '전공 정석 코스',
    tag: '학과 커리큘럼 순서대로, 빠뜨리는 것 없이',
    color: '#818cf8',
    forWhom: '진로를 아직 안 정했고 전공 과목을 순서대로 소화하고 싶은 사람',
    span: '3~4학기 분량',
    stages: [
      {
        label: '1단계 · 도구와 언어',
        sub: '전공 진입 직후',
        goal: '코드를 쓰고, 저장하고, 서버에서 돌릴 수 있는 최소 환경을 몸에 붙인다.',
        items: ['python-basics', 'git', 'linux-cli', 'discrete']
      },
      {
        label: '2단계 · 기계에 가까이',
        sub: '1학년 2학기 ~ 2학년 1학기',
        goal: 'C와 포인터를 넘긴다. 여기가 전공의 첫 관문이고, 넘기면 나머지가 열린다.',
        items: ['c-memory', 'pointer-alloc', 'number-logic', 'array-list']
      },
      {
        label: '3단계 · 자료구조와 복잡도',
        sub: '2학년 1학기',
        goal: '데이터를 담는 모양을 고르고, 그 선택의 비용을 계산할 수 있게 된다.',
        items: ['stack-queue', 'tree-bst', 'hash', 'complexity', 'sorting']
      },
      {
        label: '4단계 · 알고리즘과 설계',
        sub: '2학년 2학기',
        goal: '문제를 보고 유형을 알아보고, 코드가 길어져도 무너지지 않게 구조를 잡는다.',
        items: ['heap-graph', 'graph-search', 'greedy', 'oop', 'types', 'testing']
      },
      {
        label: '5단계 · 시스템 3종',
        sub: '3학년 1학기 — 전공의 핵심 구간',
        goal: '운영체제·네트워크·데이터베이스를 동시에 올린다. 면접 질문의 절대다수가 여기서 나온다.',
        items: ['process-thread', 'io-interrupt', 'layers', 'http-web', 'sql', 'scheduling', 'modeling']
      },
      {
        label: '6단계 · 깊이 들어가기',
        sub: '3학년 2학기',
        goal: '각 과목의 어려운 절반을 넘긴다. 동시성·가상 메모리·인덱스·동적계획법.',
        items: ['sync', 'virtual-memory', 'tcp-ip', 'web-auth', 'index-plan', 'dp', 'union-segment', 'isa']
      },
      {
        label: '7단계 · 하나로 묶기',
        sub: '3학년 겨울 ~ 4학년',
        goal: '흩어진 지식을 하나의 산출물로 묶는다. 이력서에 쓸 것이 여기서 나온다.',
        items: ['project-cycle', 'design-pattern', 'cicd', 'orm', 'ps-training', 'transaction']
      },
      {
        label: '8단계 · 선택 심화',
        sub: '4학년 — 전부 할 필요는 없다',
        goal: '여기서부터는 고르는 구간이다. 끌리는 것 한둘만 깊게 판다. 이 중 하나가 대학원이나 첫 직장의 방향이 된다.',
        items: ['cpu-pipeline', 'build-cpu', 'filesystem', 'container', 'automata', 'compiler', 'optimization', 'crypto-theory', 'security', 'graphics', 'data-eng']
      }
    ]
  },
  {
    id: 'backend',
    label: '백엔드 · 서버 개발',
    tag: '서비스를 굴리는 쪽으로 방향을 잡았다면',
    color: '#2dd4bf',
    forWhom: '웹 서비스 백엔드나 인프라 쪽 취업을 목표로 하는 사람',
    span: '2~3학기 분량',
    stages: [
      {
        label: '1단계 · 기반 다지기',
        sub: '무엇을 하든 먼저',
        goal: '언어 하나와 서버 조작, 버전 관리를 확실히 한다.',
        items: ['python-basics', 'linux-cli', 'git']
      },
      {
        label: '2단계 · 데이터 다루기',
        sub: '백엔드의 절반은 데이터베이스다',
        goal: 'SQL을 자유롭게 쓰고, 스키마를 근거 있게 설계한다.',
        items: ['sql', 'modeling', 'orm', 'array-list', 'hash']
      },
      {
        label: '3단계 · 통신 이해하기',
        sub: '요청이 어떻게 도착하는가',
        goal: 'HTTP와 TCP를 알고 서버를 직접 띄워 보고, 로그인 상태를 안전하게 유지한다.',
        items: ['http-web', 'layers', 'tcp-ip', 'socket', 'web-auth']
      },
      {
        label: '4단계 · 동시성과 성능',
        sub: '사용자가 늘어날 때 생기는 문제',
        goal: '동시에 들어오는 요청과 느린 쿼리를 다룰 수 있게 된다.',
        items: ['process-thread', 'sync', 'index-plan', 'transaction']
      },
      {
        label: '5단계 · 운영까지',
        sub: '만드는 것과 굴리는 것은 다르다',
        goal: '배포하고 여러 대로 늘리고 장애를 관측한다.',
        items: ['testing', 'cicd', 'container', 'project-cycle', 'distributed', 'nosql', 'net-security']
      }
    ]
  },
  {
    id: 'ai',
    label: '인공지능 · 데이터',
    tag: '모델을 다루는 쪽. 수학을 건너뛰면 흉내만 남는다',
    color: '#f472b6',
    forWhom: '머신러닝·데이터 분석 방향을 보고 있는 사람',
    span: '2~3학기 분량',
    stages: [
      {
        label: '1단계 · 언어와 도구',
        sub: '파이썬이 사실상 표준',
        goal: '데이터를 읽고 가공하는 코드를 막힘없이 쓴다.',
        items: ['python-basics', 'git', 'linux-cli']
      },
      {
        label: '2단계 · 수학 기반',
        sub: '여기를 건너뛰면 전부 공식 암기가 된다',
        goal: '행렬 연산과 확률을 코드로 다루고, 무엇을 최소화하는 문제인지 정식화한다.',
        items: ['discrete', 'linear-prob', 'optimization', 'complexity']
      },
      {
        label: '3단계 · 데이터 준비',
        sub: '모델보다 데이터가 성능을 정한다',
        goal: '데이터를 저장하고 뽑아내는 경로를 스스로 만든다. 실무 시간의 대부분이 여기 들어간다.',
        items: ['sql', 'modeling', 'data-eng', 'hash', 'sorting']
      },
      {
        label: '4단계 · 학습 사이클',
        sub: '한 바퀴를 제대로 돌린다',
        goal: '전처리부터 평가까지 스스로 하고, 과적합을 진단한다.',
        items: ['ml', 'functional', 'testing']
      },
      {
        label: '5단계 · 딥러닝과 규모',
        sub: '층을 쌓고 자원을 쓴다',
        goal: '신경망을 직접 구현해 보고, 큰 계산을 감당하는 환경을 이해한다.',
        items: ['deep-learning', 'memory-hierarchy', 'container', 'distributed', 'project-cycle']
      }
    ]
  },
  {
    id: 'practical',
    label: '실무에 필요한 것',
    tag: '학교에서 잘 안 가르치는데 현업 첫날부터 쓰는 것들',
    color: '#facc15',
    forWhom: '인턴·신입으로 일을 시작하는 사람, 또는 전공 복습을 실무 기준으로 압축하고 싶은 사람',
    span: '5~6개월 분량',
    stages: [
      {
        label: '1단계 · 협업 도구',
        sub: '첫 주에 바로 필요한 것',
        goal: '남과 같은 저장소에서 일하고, 서버에 붙어 로그를 읽을 수 있게 된다.',
        items: ['git', 'linux-cli', 'testing']
      },
      {
        label: '2단계 · 코딩테스트 통과',
        sub: '채용 절차의 첫 관문',
        goal: '복잡도를 계산하고 빈출 유형을 시간 안에 푼다.',
        items: ['complexity', 'sorting', 'array-list', 'hash', 'graph-search', 'greedy', 'dp', 'ps-training']
      },
      {
        label: '3단계 · 서비스를 만드는 최소 세트',
        sub: '실제로 굴러가는 것을 만든다',
        goal: '데이터를 저장하고 요청을 받아 응답하는 서버를 로그인까지 붙여 완성한다.',
        items: ['sql', 'modeling', 'orm', 'http-web', 'web-auth']
      },
      {
        label: '4단계 · 배포와 장애 대응',
        sub: '만든 것을 내보내고 지키는 일',
        goal: '자동으로 배포하고, 느려지거나 죽었을 때 원인을 층별로 좁힌다.',
        items: ['cicd', 'container', 'process-thread', 'sync', 'index-plan', 'transaction', 'tcp-ip']
      },
      {
        label: '5단계 · 보여 줄 것 만들기',
        sub: '말할 경험이 없으면 면접 답변이 비어 있다',
        goal: '끝까지 완성한 프로젝트 하나와 그 과정을 설명할 문서를 남긴다. 면접의 재료는 전부 여기서 나온다.',
        items: ['design-pattern', 'virtual-memory', 'project-cycle']
      }
    ]
  }
];
