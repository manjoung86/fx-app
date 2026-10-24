# 환율 웹앱 결정 노트

## 2026-10-24

- **네이티브 iOS 앱 대신 웹앱.** 이 맥에 Xcode가 없고, 무료 Apple ID로 설치한 앱은 7일마다 재설치해야 하며 계속 쓰려면 연 $99가 든다. 유료 결제를 피하려는 목적과 맞지 않는다. 사용자가 웹앱을 선택했다.
- **데이터는 Frankfurter v2 (`https://api.frankfurter.dev/v2/rates`).** 가입·키가 필요 없고 `access-control-allow-origin: *`라 브라우저에서 바로 호출된다. v1은 응답에 `deprecation` 헤더가 붙어 있어 쓰지 않는다.
  - 응답 형식: `[{date, base, quote, rate}, ...]`
  - 기간 조회: `from=YYYY-MM-DD`, 1년치 일별이 약 366개. `group=week|month`로 줄일 수 있다.
  - 통화 목록: `/v2/currencies` (165개, `iso_code`, `name`, `symbol`)
  - 은행 고시환율이 아니라 국제 기준환율이라 은행 창구 환율(수수료 포함)과는 차이가 있다. 사용자가 이 기준을 선택했다.
- **즐겨찾기 시세는 한 번의 요청으로 받는다.** 필요한 통화를 모두 EUR 기준으로 받아 교차환율(대상/기준)을 계산한다. 최근 7일치를 받아 마지막 두 날짜로 전일 대비 변동을 구한다.
- **엔·동·루피아는 100단위로 표시한다** (`UNIT`). 국내 은행 고시가 "100엔 = 842.90원" 형식이라 1엔 기준(8.429)은 낯설다. 저장하는 시계열 값에 단위를 곱해 두고, 계산기는 `currentRate()`에서 다시 나눠 1단위 환율을 쓴다. 통화를 바꾸면 계산기 기본값도 그 단위(100)로 맞춘다.
- **즐겨찾기는 같은 기준 통화끼리 묶어 요청한다.** 처음 계획한 EUR 경유 교차환율보다 단순하고 값이 API와 그대로 일치한다.
- ~~그래프 툴팁은 그래프 위쪽에 비워 둔 자리(48px)에 띄운다.~~ → 10-24 추이 카드 개편으로 대체.
- **추이 카드는 Currency 앱 차트 화면 형태 (10-24 개편).** 사용자 요청. 위에 "1 USD당 KRW" 제목, 큰 값, 기간 변동률, 기간 날짜. 축·눈금 없이 선(2.5px)과 그라데이션 면만 카드 끝까지 그리고, 기간 버튼(1주·1달·3달·6달·1년·2년)은 그래프 아래. 터치하면 점 바로 위에 날짜·환율 툴팁이 뜨고 위쪽 큰 값도 그 날짜 값(기간 시작 대비 변동률)으로 바뀐다. 축이 없어진 대신 기간 최고·최저와 날짜별 표는 남겼다.
  - ~~"1일"은 넣지 않았다.~~ → 1시간 환율 도입 후 추가 (아래).
- **1일 그래프 (10-24 추가).** OXR 무료는 과거 시간별 기록을 주지 않아서, Worker가 매시간 받은 전체 환율을 KV `history`에 48시간치 쌓고 `/history?base=&quote=`로 그 통화쌍의 [{t, rate}]만 돌려준다. 그래서 처음엔 점이 적고 24시간 뒤부터 하루 전체가 찬다. 첫 기록은 배포 시점의 `latest`(20:00)로 수동으로 넣었다. KV 쓰기는 시간당 2회(latest+history)로 무료 하루 1,000회 안이다.
  - 앱은 `state.hourly`({ts, rate})를 따로 들고, 1일일 때만 그걸로 그린다. 시간별 점 라벨은 `ptLabel`이 "10월 24일 21:00"으로 만든다. 점이 2개 미만이면 "모으는 중" 안내를 띄운다.
- **그래프 높이 240→170px (10-24).** 기간 버튼을 그래프 아래에 두되(사용자 선택) 아이폰 첫 화면에 들어오도록 낮췄다. 390×844에서 버튼 아래끝 736px. 화면이 작은 아이폰(SE 등)은 여전히 스크롤해야 할 수 있다.
  - 2년 기간 때문에 통화쌍을 열 때 731일치(약 730개 점)를 받는다.
- **로컬 확인은 `.claude/launch.json`의 `fx-app` 서버(python http.server, 8765)로 한다.** 파일을 직접 열면 data: 주소가 되어 localStorage가 막힌다. 이때도 앱은 저장만 안 될 뿐 정상 동작하는 것을 확인했다.
- **배포는 GitHub Pages** (`manjoung86/fx-app`, main 브랜치 루트, https://manjoung86.github.io/fx-app/). 무료이고 HTTPS라 홈 화면 앱으로 쓰기 좋다. 무료 Pages는 공개 저장소가 필요해서, 커밋 작성자 이메일을 GitHub 비공개 주소(`283163056+manjoung86@users.noreply.github.com`)로 바꿨다. 이 저장소의 로컬 git 설정에만 적용했다.
  - gh 로그인은 Claude 앱 내장 브라우저에서 Google 패스키가 동작하지 않아, 평소 쓰는 Chrome에서 기기 코드로 승인했다.
  - 푸시는 전역 git 설정을 건드리지 않도록 `git -c 'credential.helper=!gh auth git-credential' push`로 한다.
- **아이콘은 초록 배경에 지폐 세 장을 부채꼴로 펼친 디자인 (10-24 교체).** 사용자가 다른 앱("Currency")의 아이콘 느낌을 원했다. 남의 아이콘을 복제하지 않도록 같은 분위기로 새로 그렸다. 맨 앞 지폐는 ₩, 뒤 두 장은 €·$이고, 뒤 지폐는 아래 끝을 축으로 ±32° 펼치고 기호를 위쪽에 둬서 가려지지 않게 했다. 원본은 `icon.svg`, `qlmanage`로 512px 렌더 후 `sips`로 180px을 만든다.
  - 아이폰은 홈 화면에 추가하는 순간의 아이콘을 저장하므로, 아이콘을 바꾸면 홈 화면 아이콘을 지우고 다시 추가해야 반영된다.
- **최신 환율은 Open Exchange Rates 무료(1시간 갱신) + Cloudflare Workers 중계 (10-24 결정).** 사용자 요청으로 무료 API를 조사했고, 무료이면서 화면 표시가 허용되는 실시간(분 단위) 서비스는 찾지 못했다. Twelve Data 무료는 실시간이지만 약관이 "internal non-display usage only"라 제외했다.
  - 키는 앱(공개 저장소)에 넣지 않고 Worker 비밀 값(`OXR_APP_ID`)으로만 둔다. 앱 코드는 브라우저로 내려가므로 저장소를 비공개로 해도 키가 보인다.
  - Worker는 Cron(매시 5분)으로만 외부 API를 불러 KV(`latest`)에 저장하고, 요청에는 KV 값을 돌려준다. 하루 24회·한 달 약 744회로 무료 1,000회 안에 든다. workers.dev 주소에서는 Cache API가 동작하지 않는 것으로 알고 있어 KV를 썼다.
  - 허용 Origin은 `manjoung86.github.io`와 로컬 미리보기(`localhost:8765`)뿐이다. 브라우저 차원의 가벼운 제한이고, 남이 직접 호출해도 KV 값만 돌려주므로 한도가 닳지 않는다.
  - 앱은 일별 시계열의 마지막 날을 최신 값으로 바꾸거나(같은 날짜) 오늘 날짜로 덧붙인다(`mergeLive`). 응답이 USD 기준이라 교차 환율 = quote/base. 중계가 실패하면 조용히 일별 기준환율만 쓴다. `LIVE_API`가 빈 문자열이면 기능이 꺼진다.
  - 추이 그래프(1주~2년)는 그대로 Frankfurter 일별 데이터다.
  - 배포: Worker `fx-rates` → https://fx-rates.fx-rates-worker.workers.dev , KV `RATES`(id는 wrangler.toml), 비밀 값 `OXR_APP_ID`. Cloudflare·OXR 계정은 manjoung86@gmail.com. Workers는 Cloudflare 이메일 인증 전에는 배포가 거절된다(code 10034).
  - 다시 배포: `cd worker && npx wrangler deploy` (Node는 Homebrew로 설치, wrangler는 worker/node_modules). 키를 바꾸려면 `npx wrangler secret put OXR_APP_ID`를 사용자가 터미널에서 직접 입력.
- **파일 하나(index.html)에 CSS·JS를 모두 넣는다.** 외부 라이브러리 없이 그래프도 SVG로 직접 그린다. 설정(즐겨찾기, 마지막 통화쌍)은 localStorage에 저장한다.
