# zetrun

zetrun은 **100% 클라이언트(로컬) 동작** 기반의 비행기 레이스 웹앱입니다.

- 레이스/순위/장애물/카메라 로직: 브라우저 내부 처리
- 저장: `localStorage` (비행기 이름/설정)
- 서버 DB/로그인/백엔드 저장: 사용 안 함
- UI: Tailwind + shadcn/ui 스타일 컴포넌트

## 실행

```bash
npm install
npm run dev
```

빌드:

```bash
npm run build
```

## 라우트

- `/` 홈
- `/game` 게임
- `/guide` 가이드/FAQ
- `/policies` 개인정보처리방침/이용약관/광고 운영 원칙

## AdSense 연결

1. `.env.example`를 참고해 `.env` 생성
2. 아래 값 입력

```bash
VITE_ADSENSE_CLIENT=ca-pub-xxxxxxxxxxxxxxxx
VITE_ADSENSE_SLOT=1234567890
```

3. 승인 전/미설정 상태에서는 광고 슬롯에 안내 placeholder가 표시됩니다.

## SEO/품질 파일

- `index.html` 메타 설명, canonical, OG, 구조화데이터(WebSite)
- `public/robots.txt`
- `public/sitemap.xml`
- `public/favicon.svg`

## 심사 품질 체크 포인트

- 정책/문의/서비스 정보 페이지 명시
- 광고와 콘텐츠 영역 명확 분리
- 과도한 광고 배치/클릭 유도 문구 미사용
- 탐색 가능한 메뉴 구조와 원본 텍스트 콘텐츠 제공

> 참고: 광고 승인 여부는 최종적으로 Google 정책 심사 결과에 따라 결정됩니다.
