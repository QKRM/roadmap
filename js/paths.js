/* 추천 경로 — 50개 주제를 어떤 순서로 밟을지에 대한 제안.
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
        items: ['heap-graph', 'graph-search', 'oop', 'testing']
      },
      {
        label: '5단계 · 시스템 3종',
        sub: '3학년 1학기 — 전공의 핵심 구간',
        goal: '운영체제·네트워크·데이터베이스를 동시에 올린다. 면접 질문의 절대다수가 여기서 나온다.',
        items: ['process-thread', 'layers', 'http-web', 'sql', 'scheduling', 'modeling']
      },
      {
        label: '6단계 · 깊이 들어가기',
        sub: '3학년 2학기',
        goal: '각 과목의 어려운 절반을 넘긴다. 동시성·가상 메모리·인덱스·동적계획법.',
        items: ['sync', 'virtual-memory', 'tcp-ip', 'index-plan', 'dp', 'isa']
      },
      {
        label: '7단계 · 하나로 묶기',
        sub: '3학년 겨울 ~ 4학년',
        goal: '흩어진 지식을 하나의 산출물로 묶는다. 이력서에 쓸 것이 여기서 나온다.',
        items: ['project-cycle', 'design-pattern', 'ps-training', 'transaction']
      },
      {
        label: '8단계 · 선택 심화',
        sub: '4학년 — 전부 할 필요는 없다',
        goal: '여기서부터는 고르는 구간이다. 끌리는 것 한둘만 깊게 판다. 이 중 하나가 대학원이나 첫 직장의 방향이 된다.',
        items: ['cpu-pipeline', 'build-cpu', 'filesystem', 'automata', 'compiler', 'crypto-theory', 'security', 'graphics']
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
        items: ['sql', 'modeling', 'array-list', 'hash']
      },
      {
        label: '3단계 · 통신 이해하기',
        sub: '요청이 어떻게 도착하는가',
        goal: 'HTTP와 TCP를 알고 서버를 직접 띄워 본다.',
        items: ['http-web', 'layers', 'tcp-ip', 'socket']
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
        items: ['testing', 'project-cycle', 'distributed', 'nosql', 'net-security']
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
        goal: '행렬 연산과 확률을 코드로 다룰 수 있게 된다.',
        items: ['discrete', 'linear-prob', 'complexity']
      },
      {
        label: '3단계 · 데이터 준비',
        sub: '모델보다 데이터가 성능을 정한다',
        goal: '데이터를 저장하고 뽑아내는 경로를 스스로 만든다.',
        items: ['sql', 'modeling', 'hash', 'sorting']
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
        items: ['deep-learning', 'memory-hierarchy', 'distributed', 'project-cycle']
      }
    ]
  },
  {
    id: 'interview',
    label: '취업 준비 단기 코스',
    tag: '코딩테스트와 기술면접에 직결되는 것만',
    color: '#facc15',
    forWhom: '취업이 1년 안쪽으로 다가온 사람. 전공 복습을 압축해야 하는 경우',
    span: '5~6개월 분량',
    stages: [
      {
        label: '1단계 · 코딩테스트 기초',
        sub: '가장 먼저 통과해야 하는 관문',
        goal: '복잡도를 계산하고 기본 유형을 시간 안에 푼다.',
        items: ['complexity', 'sorting', 'array-list', 'stack-queue']
      },
      {
        label: '2단계 · 빈출 알고리즘',
        sub: '출제 비중이 가장 큰 구간',
        goal: '탐색과 동적계획법을 손에 익힌다.',
        items: ['tree-bst', 'hash', 'graph-search', 'dp', 'ps-training']
      },
      {
        label: '3단계 · 면접 단골 · 운영체제',
        sub: '거의 매번 나온다',
        goal: '프로세스·스레드·동기화·가상 메모리를 설명할 수 있게 된다.',
        items: ['process-thread', 'sync', 'virtual-memory', 'scheduling']
      },
      {
        label: '4단계 · 면접 단골 · 네트워크와 DB',
        sub: '나머지 절반',
        goal: 'HTTP와 TCP, 인덱스와 트랜잭션을 근거와 함께 말한다.',
        items: ['http-web', 'tcp-ip', 'sql', 'index-plan', 'transaction']
      },
      {
        label: '5단계 · 보여 줄 것 만들기',
        sub: '말할 경험이 없으면 답변이 비어 있다',
        goal: '끝까지 완성한 프로젝트 하나와 그 과정을 설명할 문서를 남긴다.',
        items: ['git', 'testing', 'project-cycle']
      }
    ]
  }
];
