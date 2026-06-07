# ODI:GA MVP Test Checklist

실제 테스트 배포 전에 아래 순서대로 확인한다. 기준은 의뢰인 1명과 헬퍼 1명이 로그인해서 의뢰 등록, 수락, 채팅, 진행, 완료, 리뷰까지 끝낼 수 있는 상태다.

## 1. Local Build

- [ ] `npm.cmd run lint` 통과
- [ ] `npm.cmd run build` 통과
- [ ] `.env.local`에 아래 값 존재
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_GOOGLE_MAPS_KEY`

## 2. Supabase SQL

- [ ] Supabase SQL Editor에서 `supabase/p0_mvp_permissions.sql` 실행
- [ ] `public.match_errands(route_id uuid, radius_m integer)` 함수 확인
- [ ] `public.accept_errand(p_errand_id uuid, p_route_id uuid)` 함수 확인
- [ ] `public.advance_errand_status(p_errand_id uuid, p_next_status text)` 함수 확인
- [ ] authenticated role에 위 함수 execute 권한 확인

## 3. Supabase Auth

- [ ] Google provider enabled
- [ ] Kakao provider enabled
- [ ] Local redirect URL 등록: `http://localhost:3000/auth/callback`
- [ ] 배포 redirect URL 등록: `https://YOUR_DOMAIN/auth/callback`
- [ ] 신규 로그인 시 `public.users` row 생성 확인

## 4. Supabase Storage

- [ ] `errand-photos` bucket 생성
- [ ] 앱에서 사진 업로드 가능
- [ ] 업로드 후 의뢰 상세에서 이미지 표시
- [ ] 공개 bucket 또는 읽기 policy가 앱 요구사항과 일치

## 5. Google Maps

- [ ] Maps JavaScript API enabled
- [ ] Places API enabled
- [ ] API key HTTP referrer 제한에 local URL 추가
- [ ] API key HTTP referrer 제한에 배포 도메인 추가
- [ ] 지도 로딩 실패 시 fallback 메시지 확인
- [ ] 위치 권한 거부 시 장소 검색 입력 가능

## 6. Two Account E2E

의뢰인 계정 A와 헬퍼 계정 B를 사용한다.

- [ ] A로 로그인
- [ ] 홈에서 실제 데이터 영역 표시 확인
- [ ] A가 의뢰 등록
- [ ] A의 활동 페이지에 요청한 의뢰 표시
- [ ] A의 의뢰 상세에서 상태가 `요청됨`인지 확인
- [ ] A의 의뢰 상세에서 매칭 전 채팅 버튼 비활성화 확인
- [ ] B로 로그인
- [ ] B가 경로 등록
- [ ] B의 매칭 페이지에 A의 의뢰 표시
- [ ] B가 A의 의뢰 수락
- [ ] B의 활동 페이지에 맡은 의뢰 표시
- [ ] A의 활동 페이지에 매칭된 의뢰 표시
- [ ] A와 B 모두 채팅방 진입 가능
- [ ] A가 메시지 전송
- [ ] B가 메시지 확인
- [ ] B가 메시지 전송
- [ ] A가 메시지 확인
- [ ] B가 `픽업 완료` 클릭
- [ ] A와 B 상세 화면에서 상태가 `진행중`인지 확인
- [ ] B가 `전달 완료` 클릭
- [ ] A와 B 상세 화면에서 상태가 `완료`인지 확인
- [ ] A가 리뷰 작성
- [ ] B 프로필의 평점 또는 완료 도움 수 반영 확인

## 7. Permission Checks

- [ ] A가 자기 의뢰를 헬퍼로 수락할 수 없음
- [ ] 이미 매칭된 의뢰를 다른 계정 C가 수락할 수 없음
- [ ] 매칭된 헬퍼가 아닌 사용자는 상태를 변경할 수 없음
- [ ] 참여자가 아닌 사용자는 채팅방을 볼 수 없음
- [ ] 매칭 전 의뢰는 채팅 입력이 비활성화됨

## 8. Mobile QA

- [ ] Android Chrome에서 로그인 가능
- [ ] Android Chrome에서 위치 권한 허용 후 현재 위치 사용 가능
- [ ] Android Chrome에서 사진 촬영 업로드 가능
- [ ] iOS Safari 또는 iOS Chrome에서 로그인 가능
- [ ] iOS에서 위치 권한 허용/거부 케이스 확인
- [ ] iOS에서 사진 촬영 업로드 가능
- [ ] 하단 내비게이션이 입력창/버튼을 가리지 않음
- [ ] 지도와 장소 검색이 모바일에서 사용 가능

## 9. Release Gate

- [ ] local E2E 1회 통과
- [ ] 배포 URL E2E 1회 통과
- [ ] README의 설정 설명이 현재 환경변수와 일치
- [ ] Supabase production project와 local/dev project 구분
- [ ] Google Maps key와 OAuth client가 production domain으로 제한됨
- [ ] 테스트 사용자에게 알려줄 계정 생성/로그인 방법 정리
