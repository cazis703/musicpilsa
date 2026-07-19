# SDD (Spec-Driven Development) 시스템

"AI에게 '만들어줘'가 아닌 '이 스펙대로 만들어줘'가 정답이다."

프롬프트를 치는 대신 **시스템을 구축**한다. Claude Code 위에 Skills, Sub-agents, Commands라는 3가지 구성요소를 조합하여, 자연어 한 마디로 기획부터 코드 검증까지 자동으로 돌아가는 개발 파이프라인을 만든다.

---

## 3가지 핵심 구성요소

| 구분 | 역할 | 비유 | 파일 위치 |
|------|------|------|----------|
| **Skills** | 도구, 템플릿 | 문서 양식 | `.claude/skills/<name>/SKILL.md` |
| **Sub-agents** | 전문가, 역할 | 담당자 | `.claude/agents/<name>.md` |
| **Commands** | 트리거 | 시작 버튼 | `.claude/commands/<name>.md` |

- **Skills**는 "어떻게 쓰는가"에 대한 양식/규칙이다. 결과물 포맷과 작성 규칙을 정의한다.
- **Sub-agents**는 "누가 쓰는가"에 대한 페르소나다. 해당 Skill을 활용하는 전문가 역할을 정의한다.
- **Commands**는 "언제 시작하는가"에 대한 트리거다. 적절한 Sub-agent를 호출해 워크플로우를 시작한다.

### 핵심 플로우

```
[자연어 입력] → /sdd:auto → 자동 라우팅
                    ↓
            ┌──────┴──────┐
            ↓             ↓
    [전제조건 체크]   [키워드 분석]
            ↓             ↓
    [자동 단계 유도]  [적절한 워크플로우 선택]
            ↓
    plan → design → build → review
```

---

## `.claude/` 시스템 구조

```
.claude/
├── skills/
│   ├── prd-writer/SKILL.md         # PRD 작성 템플릿
│   ├── tech-spec-writer/SKILL.md   # 기술스펙 템플릿
│   ├── code-generator/SKILL.md     # 코드 생성 규칙
│   └── spec-validator/SKILL.md     # 스펙 검증 체크리스트
│
├── agents/
│   ├── planner.md                  # 10년차 PM 페르소나
│   ├── architect.md                # 시스템 아키텍트
│   ├── developer.md                # 시니어 개발자
│   └── reviewer.md                 # 품질 검증 전문가
│
└── commands/
    ├── sdd-init.md                 # 폴더 구조 생성
    ├── sdd-plan.md                 # PRD 작성
    ├── sdd-design.md               # TECH_SPEC 작성
    ├── sdd-build.md                # 코드 구현
    ├── sdd-review.md               # 스펙 검증
    └── sdd-auto.md                 # ⭐ 자동 라우팅 (핵심)
```

---

## Skills (도구)

| Skill | 책임 | 활성화 키워드 |
|-------|------|---------------|
| `prd-writer` | PRD 템플릿과 작성 규칙 (기능 3개 이내 원칙) | "PRD 작성", "요구사항 문서화", "기획서 작성" |
| `tech-spec-writer` | 기술스펙 템플릿 (PRD 1:1 매핑) | "기술스펙", "아키텍처 설계", "구현 명세" |
| `code-generator` | PRD+TECH_SPEC 기반 코드 생성 규칙 (스펙 무시 금지) | "코드 구현", "컴포넌트 생성", "개발" |
| `spec-validator` | PRD/TECH_SPEC vs 코드 대조 체크리스트, 리포트 포맷 | "스펙 검증", "코드 리뷰", "QA" |

Skill 작성 시 `description` 필드 키워드가 자동 활성화를 좌우한다. 구체적으로 쓸수록 올바르게 트리거된다.

---

## Sub-agents (전문가)

| Agent | 페르소나 | 주 사용 Skill |
|-------|----------|---------------|
| `@planner` | 10년차 PM. 사용자 질문 3개 이상으로 요구사항 구체화 | `prd-writer` |
| `@architect` | 시스템 아키텍트. PRD를 기술 구조로 변환 | `tech-spec-writer` |
| `@developer` | 시니어 개발자. 스펙 기반 구현 | `code-generator` |
| `@reviewer` | 품질 검증 전문가. 스펙 일치 여부 대조 | `spec-validator` |

각 에이전트 파일의 `skills:` frontmatter로 어떤 Skill을 활용할지 명시한다.

---

## Commands (트리거)

| 명령어 | 설명 | 전제조건 | 호출 체인 |
|--------|------|----------|----------|
| `/sdd:init` | 폴더 구조 생성 | 없음 | — |
| `/sdd:plan [아이디어]` | PRD 작성 | 없음 | Command → @planner → prd-writer |
| `/sdd:design` | TECH_SPEC 작성 | PRD.md | Command → @architect → tech-spec-writer |
| `/sdd:build` | 코드 구현 | PRD + TECH_SPEC | Command → @developer → code-generator |
| `/sdd:review` | 스펙 검증 | PRD + TECH_SPEC + src/ | Command → @reviewer → spec-validator |
| `/sdd:auto` ⭐ | **자동 라우팅** | 없음 (자연어로 시작) | 키워드 분석 후 위 4개 중 선택 |

---

## ⭐ `/sdd:auto` 자동 라우팅

커맨드를 외울 필요 없이 자연어로 말하면 시스템이 적절한 단계를 선택한다.

### 키워드 매핑

| 타겟 | 인식 키워드 |
|------|-------------|
| plan | "기획", "요구사항", "PRD", "MVP", "시작", "만들고 싶어" |
| design | "기술스펙", "아키텍처", "DB", "API 설계", "구조" |
| build | "구현", "코드", "컴포넌트", "개발", "만들어" |
| review | "검증", "리뷰", "QA", "체크", "확인", "제대로" |

### 동작 방식

| 상황 | 동작 |
|------|------|
| 명시 커맨드 입력 (`/sdd:build`) | 그대로 실행 (최우선) |
| 자연어 프롬프트 | 자동 라우팅 → plan/design/build/review 분기 |
| 전제조건 미충족 | 자동으로 앞 단계로 유도 또는 안내 후 중단 |
| 확신이 낮은 경우 | 드라이런: "추천 커맨드: /sdd:design, 실행할까요?" |

---

## 파일 위치 규칙

| 구분 | 개인 (모든 프로젝트) | 프로젝트 (해당 저장소만) |
|------|---------------------|------------------------|
| Skills | `~/.claude/skills/` | `.claude/skills/` |
| Agents | `~/.claude/agents/` | `.claude/agents/` |
| Commands | `~/.claude/commands/` | `.claude/commands/` |

프로젝트 위치가 개인 위치보다 우선한다. 프로젝트 내 `.claude/`가 있으면 그 정의가 적용된다.

---

## 트러블슈팅

| 문제 | 해결 |
|------|------|
| 스킬 활성화 안됨 | `description` 키워드 구체화 ("문서 작성" → "PRD 작성, 요구사항 문서화, 기획서 작성") |
| 에이전트가 스킬 무시 | 에이전트 파일의 `skills:` frontmatter 확인 |
| `/sdd:auto` 잘못된 라우팅 | 키워드 매핑 확인, 모호하면 명시적 커맨드 사용 |
| PRD 내용 빈약 | `@planner`에 "질문 3개 이상 후 작성" 지시 |
| 코드가 스펙 무시 | `code-generator`에 "스펙 무시 금지" 규칙 강화 |
| `/sdd:review` 결과 부실 | `spec-validator` 체크리스트 항목 추가, 리포트 포맷 강제 |

---

## 핵심 원칙

- **문서가 코드보다 먼저다** — PRD → TECH_SPEC → 코드 → 검증 순서를 지킨다.
- **Skills는 양식, Sub-agents는 사람, Commands는 버튼** — 역할을 섞지 않는다.
- **스펙 없는 구현 금지** — `/sdd:build`는 PRD와 TECH_SPEC이 둘 다 있을 때만 동작한다.
- **검증은 대조다** — `/sdd:review`는 코드를 평가하지 않고, 스펙과의 일치 여부를 대조한다.
- **자연어가 시작점** — `/sdd:auto`가 있으면 커맨드를 외울 필요가 없다.
