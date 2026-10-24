# 환율 웹앱 체크리스트

## 계획
유료 앱 대신 아이폰 홈 화면에 추가해서 쓰는 개인용 환율 웹앱을 만든다.
데이터는 Frankfurter v2 API(무료, 키 없음)를 쓰고, 파일 하나(index.html)로 끝낸다.

## 할 일
- [x] 환율 API 확인 (Frankfurter v2, KRW 지원, CORS 허용)
- [x] 화면 뼈대와 아이폰 홈 화면용 설정 (manifest, 아이콘, 노치 여백)
- [x] 통화쌍 지정 조회 (기준 통화 ↔ 대상 통화, 뒤집기 버튼)
- [x] 금액 계산기 (양방향 입력)
- [x] 추이 그래프 (1주, 1개월, 3개월, 1년, 터치로 날짜별 값 보기)
- [x] 즐겨찾기 통화쌍 (추가·삭제, 전일 대비 변동)
- [x] 아이폰 크기에서 브라우저로 검증 (라이트·다크 모드)
- [x] 아이폰에 올릴 방법 결정과 배포 (GitHub Pages)
- [x] 아이폰 Safari에서 실제 화면 확인 (사용자, 10-24)
## 1시간 단위 최신 환율 (Open Exchange Rates + Cloudflare Workers)
- [x] 무료 API 조사와 방식 결정
- [x] 중계 서버 코드 (`worker/`), 시험 빌드, 가짜 키로 오류·Origin 처리 확인
- [x] 앱 연결 코드 (`LIVE_API`), 가짜 응답·실패 상황 시험
- [x] Open Exchange Rates 가입·App ID 발급 (사용자)
- [x] Cloudflare 가입·이메일 인증 (사용자)
- [x] wrangler 로그인, KV 생성, 키 등록(사용자가 터미널에 직접), 배포 → https://fx-rates.fx-rates-worker.workers.dev
- [x] `LIVE_API`에 Worker 주소 넣고 실제 값 확인 후 배포

## 기존
- [x] 아이폰 홈 화면에 아이콘 추가 (iPhone 미러링으로 진행, 웹 앱으로 열기 켬, 주소창 없이 열리는 것 확인)
- [x] 아이폰 Safari에서 계산기 입력칸이 카드 밖으로 넘치던 문제 수정
