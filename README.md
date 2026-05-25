# 어디:가 (ODI:GA)

내가 가는 길 중에, 누군가를 돕는 경로 기반 심부름 매칭 웹앱입니다. Helper는 이동 경로를 등록하고, Requester는 픽업/전달 요청을 등록하며, Supabase와 PostGIS로 경로 근처 요청을 매칭합니다.

## 기술 스택

- Next.js 14 App Router, TypeScript
- Supabase Auth, Database, Storage, Realtime 준비
- Tailwind CSS, Pretendard 폰트 스택
- next-intl 한국어/영어 메시지
- Google Maps JavaScript API + Places API
- PWA manifest

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

`.env.local`에 아래 값을 입력합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_GOOGLE_MAPS_KEY=
```

브라우저에서 `http://localhost:3000`을 엽니다.

## Supabase 설정

1. Supabase 프로젝트를 생성합니다.
2. `supabase/schema.sql`을 SQL Editor에서 실행합니다.
3. Authentication Providers에서 Google, Kakao를 활성화합니다.
4. Kakao/Google OAuth redirect URL에 Supabase callback URL을 등록합니다.
5. 사진 업로드를 사용하려면 `errand-photos` Storage bucket을 생성합니다.

## Google Maps 설정

1. Google Cloud Console에서 Maps JavaScript API와 Places API를 활성화합니다.
2. API 키를 생성하고 `.env.local`의 `NEXT_PUBLIC_GOOGLE_MAPS_KEY`에 입력합니다.
3. HTTP referrer 제한에 `http://localhost:3000/*`와 배포 도메인을 등록합니다.
