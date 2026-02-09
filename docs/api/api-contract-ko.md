# Arcstride API 계약서 (v0.1, JWT 기반)

본 문서는 Arcstride 백엔드 API의 **초기 계약(Endpoints + DTO + 규칙)**을 정의합니다.  
데이터 모델 스펙 v0.6을 기반으로 하며, 프론트/백이 동시에 개발할 수 있도록 “응답 형태”를 고정합니다.

- 인증 방식: **JWT (Bearer)**
- Memo 기본 공개 범위: **PRIVATE**
- Guide 기본 공개 범위: **PUBLIC**
- Title/Unit/Character 생성: **로그인 필요**
- 조회 정책(권장):
  - Title 목록/검색/상세 조회는 **비로그인도 허용**
  - 개인화 데이터(내 진행도/내 메모/내 소장/내 리뷰)는 **로그인 필요**

---

## 0. 공통 규칙

### 0.1 Base URL

- `/api`

### 0.2 Auth Header

- `Authorization: Bearer <access_token>`

### 0.3 Content-Type

- 요청/응답: `application/json; charset=utf-8`

### 0.4 ID 타입

- 모든 ID는 `number`(BIGINT)로 전달

### 0.5 날짜/시간 포맷

- `releaseDate`: `"YYYY-MM-DD"`
- `createdAt`, `updatedAt`: ISO-8601 `"YYYY-MM-DDTHH:mm:ss"` (서버 로컬 또는 UTC, 한 가지로 통일)

### 0.6 점수 스케일

- 클라이언트 입력/출력: `0.0 ~ 10.0`, `0.5` 단위
- 서버 내부 저장: `x2 정수(0~20)`로 저장하되, API에는 **float(0~10)**로 노출

### 0.7 unit_key 정규화

- 서버는 `unitKey`로 입력받아 `normalizedUnitKey`를 계산/저장
- 규칙: `trim + lower + 공백축약`

### 0.8 표준 에러 응답

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "설명",
    "details": [
      { "field": "unitKey", "reason": "required" }
    ]
  }
}
```

- HTTP 400: 유효성/형식 오류
- HTTP 401: 인증 실패(토큰 없음/만료/부적절)
- HTTP 403: 권한 없음(예: 숨김/삭제 리소스 접근)
- HTTP 404: 리소스 없음
- HTTP 409: 유니크 충돌(중복 등록)

---

## 1. 인증(Auth)

### 1.1 회원가입

- `POST /api/auth/signup`

```json
{
  "username": "bm",
  "email": "bm@example.com",
  "password": "plain-password"
}
```

응답 `201`

```json
{
  "userId": 1,
  "username": "bm",
  "email": "bm@example.com",
  "createdAt": "2026-02-09T15:30:00"
}
```

### 1.2 로그인

- `POST /api/auth/login`

```json
{
  "email": "bm@example.com",
  "password": "plain-password"
}
```

응답 `200`

```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresInSec": 3600
}
```

### 1.3 내 정보 조회

- `GET /api/users/me` (Auth)
  응답 `200`

```json
{
  "userId": 1,
  "username": "bm",
  "email": "bm@example.com",
  "profilePictureUrl": null,
  "createdAt": "2026-02-09T15:30:00"
}
```

---

## 2. Title(작품) — 공개 조회 + 로그인 생성

### 2.1 Title 생성 (로그인 필요)

- `POST /api/titles`

```json
{
  "type": "GAME",
  "originalTitle": "Some VN",
  "koreanTitle": "어떤 미연시",
  "releaseDate": "2020-01-15",
  "coverUrl": "https://...",
  "summary": "요약",
  "isExplicit": false
}
```

응답 `201`

```json
{
  "titleId": 10
}
```

에러

- 400: 필드 누락/형식
- 401: 미인증

### 2.2 Title 목록(페이지) (공개)

- `GET /api/titles?page=0&size=20&sort=createdAt,desc`
  응답 `200`

```json
{
  "page": { "number": 0, "size": 20, "totalElements": 120, "totalPages": 6 },
  "items": [
    {
      "titleId": 10,
      "type": "GAME",
      "originalTitle": "Some VN",
      "koreanTitle": "어떤 미연시",
      "releaseDate": "2020-01-15",
      "coverUrl": "https://...",
      "isExplicit": false,
      "stats": {
        "avgGraphics": 7.5,
        "avgStory": 8.0,
        "avgMusic": 6.5,
        "avgEtc": 7.0,
        "reviewCount": 12,
        "commentCount": 5
      }
    }
  ]
}
```

### 2.3 Title 검색 (공개)

- `GET /api/titles/search?q=검색어&type=GAME&page=0&size=20`
- 검색 대상: `originalTitle`, `koreanTitle`, `alias`
  응답은 2.2와 동일 형태

### 2.4 Title 상세 (공개)

- `GET /api/titles/{titleId}`
  응답 `200`

```json
{
  "titleId": 10,
  "type": "GAME",
  "originalTitle": "Some VN",
  "koreanTitle": "어떤 미연시",
  "releaseDate": "2020-01-15",
  "coverUrl": "https://...",
  "summary": "요약",
  "isExplicit": false,
  "aliases": ["SVN", "SomeVisualNovel"],
  "tags": [
    { "tagId": 1, "name": "Romance", "tagType": "GENRE" }
  ],
  "series": [
    { "seriesId": 2, "name": "Some Series", "seriesOrder": 1 }
  ],
  "stats": {
    "avgGraphics": 7.5,
    "avgStory": 8.0,
    "avgMusic": 6.5,
    "avgEtc": 7.0,
    "reviewCount": 12,
    "commentCount": 5
  }
}
```

### 2.5 Title 수정/숨김/삭제 (관리자 전용은 추후)

- MVP에서는 생략(필요 시 추후 추가)

---

## 3. Alias(별칭) — 로그인 필요(Title 생성자/관리자 정책은 추후)

### 3.1 별칭 추가 (로그인 필요)

- `POST /api/titles/{titleId}/aliases`

```json
{ "aliasText": "SVN" }
```

응답 `201`

```json
{ "aliasId": 100 }
```

에러

- 409: 동일 별칭 중복

### 3.2 별칭 삭제 (로그인 필요)

- `DELETE /api/titles/{titleId}/aliases/{aliasId}`
  응답 `204`

---

## 4. Unit(권/화/루트) — 공개 조회 + 로그인 생성

### 4.1 Unit 생성 (로그인 필요)

- `POST /api/titles/{titleId}/units`

```json
{
  "unitType": "EPISODE",
  "unitKey": "OVA 1",
  "displayName": "OVA 1",
  "sortOrder": 999,
  "releaseDate": "2019-12-31",
  "characterId": null
}
```

응답 `201`

```json
{ "unitId": 200 }
```

에러

- 409: `(titleId, unitType, normalizedUnitKey)` 유니크 충돌

### 4.2 Title별 Unit 목록 (공개)

- `GET /api/titles/{titleId}/units?unitType=EPISODE`
  응답 `200`

```json
{
  "items": [
    {
      "unitId": 200,
      "unitType": "EPISODE",
      "unitKey": "OVA 1",
      "displayName": "OVA 1",
      "sortOrder": 999,
      "releaseDate": "2019-12-31",
      "characterId": null,
      "createdAt": "2026-02-09T15:30:00"
    }
  ]
}
```

### 4.3 Unit 정렬값(sortOrder) 수정 (로그인 필요)

- `PATCH /api/units/{unitId}`

```json
{ "sortOrder": 10 }
```

응답 `200`

```json
{ "unitId": 200, "sortOrder": 10 }
```

---

## 5. Character(GAME 전용) — 공개 조회 + 로그인 생성

### 5.1 캐릭터 생성 (로그인 필요)

- `POST /api/titles/{titleId}/characters`

```json
{
  "originalName": "Hina",
  "koreanName": "히나",
  "characterImageUrl": "https://...",
  "isExplicit": false
}
```

응답 `201`

```json
{ "characterId": 300 }
```

에러

- 409: 동일 타이틀 내 이름 중복(정규화 기준)

### 5.2 Title별 캐릭터 목록 (공개)

- `GET /api/titles/{titleId}/characters`
  응답 `200`

```json
{
  "items": [
    {
      "characterId": 300,
      "originalName": "Hina",
      "koreanName": "히나",
      "characterImageUrl": "https://...",
      "isExplicit": false
    }
  ]
}
```

---

## 6. Progress(진행도) — 개인화(로그인 필요)

### 6.1 내 Unit 진행도 저장/수정 (로그인 필요)

- `PUT /api/me/progress/units/{unitId}`

```json
{
  "status": "DONE",
  "startedAt": "2026-02-01T10:00:00",
  "finishedAt": "2026-02-09T11:00:00"
}
```

응답 `200`

```json
{
  "unitId": 200,
  "status": "DONE",
  "startedAt": "2026-02-01T10:00:00",
  "finishedAt": "2026-02-09T11:00:00",
  "updatedAt": "2026-02-09T15:31:00"
}
```

### 6.2 Title별 내 진행도 요약 (로그인 필요)

- `GET /api/me/progress/titles/{titleId}`
  응답 `200`

```json
{
  "titleId": 10,
  "derivedStatus": "PROGRESS",
  "unitSummary": { "total": 12, "none": 4, "progress": 2, "done": 6 }
}
```

### 6.3 Title의 Unit별 내 진행도 조회 (로그인 필요)

- `GET /api/me/progress/titles/{titleId}/units`
  응답 `200`

```json
{
  "items": [
    { "unitId": 200, "status": "DONE" },
    { "unitId": 201, "status": "NONE" }
  ]
}
```

---

## 7. Review(리뷰/평점) — 개인화 쓰기 + 공개 읽기

### 7.1 내 리뷰 작성/수정 (로그인 필요)

- `PUT /api/titles/{titleId}/my-review`

```json
{
  "graphics": 7.5,
  "story": 8.0,
  "music": 6.5,
  "etc": 7.0,
  "reviewText": "좋았음",
  "spoilerFlag": false
}
```

응답 `200`

```json
{
  "titleId": 10,
  "userId": 1,
  "graphics": 7.5,
  "story": 8.0,
  "music": 6.5,
  "etc": 7.0,
  "reviewText": "좋았음",
  "spoilerFlag": false,
  "updatedAt": "2026-02-09T15:32:00"
}
```

### 7.2 내 리뷰 삭제 (로그인 필요)

- `DELETE /api/titles/{titleId}/my-review`
  응답 `204`

### 7.3 Title 리뷰 목록(공개) (페이지)

- `GET /api/titles/{titleId}/reviews?page=0&size=20`
  응답 `200`

```json
{
  "page": { "number": 0, "size": 20, "totalElements": 12, "totalPages": 1 },
  "items": [
    {
      "user": { "userId": 1, "username": "bm" },
      "graphics": 7.5,
      "story": 8.0,
      "music": 6.5,
      "etc": 7.0,
      "reviewText": "좋았음",
      "spoilerFlag": false,
      "createdAt": "2026-02-09T15:32:00"
    }
  ]
}
```

---

## 8. Memo(개인 메모) — 로그인 필요

### 8.1 메모 생성 (로그인 필요)

- `POST /api/me/memos`

```json
{
  "target": { "type": "UNIT", "id": 200 },
  "memoText": "여기 중요",
  "spoilerFlag": false,
  "visibility": "PRIVATE"
}
```

응답 `201`

```json
{ "memoId": 400 }
```

### 8.2 내 메모 목록 (로그인 필요)

- `GET /api/me/memos?targetType=UNIT&targetId=200`
  응답 `200`

```json
{
  "items": [
    {
      "memoId": 400,
      "target": { "type": "UNIT", "id": 200 },
      "memoText": "여기 중요",
      "spoilerFlag": false,
      "visibility": "PRIVATE",
      "updatedAt": "2026-02-09T15:33:00"
    }
  ]
}
```

### 8.3 메모 수정/삭제 (로그인 필요)

- `PATCH /api/me/memos/{memoId}`
- `DELETE /api/me/memos/{memoId}`

※ DB는 title_id/unit_id XOR 구조지만, API에서는 `target`을 통일된 형태로 제공(클라 편의).

---

## 9. Guide(공략) — 로그인 쓰기 + 공개 읽기

### 9.1 공략 생성 (로그인 필요, 기본 PUBLIC)

- `POST /api/guides`

```json
{
  "target": { "type": "TITLE", "id": 10 },
  "title": "초반 루트 가이드",
  "content": "내용...",
  "visibility": "PUBLIC"
}
```

응답 `201`

```json
{ "guideId": 500 }
```

### 9.2 공략 목록(공개)

- `GET /api/guides?targetType=TITLE&targetId=10&page=0&size=20`
  응답 `200`

```json
{
  "page": { "number": 0, "size": 20, "totalElements": 1, "totalPages": 1 },
  "items": [
    {
      "guideId": 500,
      "author": { "userId": 1, "username": "bm" },
      "target": { "type": "TITLE", "id": 10 },
      "title": "초반 루트 가이드",
      "visibility": "PUBLIC",
      "createdAt": "2026-02-09T15:34:00"
    }
  ]
}
```

### 9.3 공략 상세(공개)

- `GET /api/guides/{guideId}`

### 9.4 내 공략 수정/삭제 (로그인 필요)

- `PATCH /api/guides/{guideId}`
- `DELETE /api/guides/{guideId}`
  권한: 작성자만 가능(403)

---

## 10. Comment(댓글) — 공개 읽기 + 로그인 쓰기

### 10.1 댓글 작성 (로그인 필요)

- `POST /api/titles/{titleId}/comments`

```json
{ "body": "재밌다", "spoilerFlag": false, "parentId": null }
```

응답 `201`

```json
{ "commentId": 600 }
```

### 10.2 댓글 목록(공개)

- `GET /api/titles/{titleId}/comments?page=0&size=50`
  응답 `200`

```json
{
  "page": { "number": 0, "size": 50, "totalElements": 5, "totalPages": 1 },
  "items": [
    {
      "commentId": 600,
      "user": { "userId": 1, "username": "bm" },
      "body": "재밌다",
      "spoilerFlag": false,
      "createdAt": "2026-02-09T15:35:00"
    }
  ]
}
```

### 10.3 내 댓글 삭제 (로그인 필요)

- `DELETE /api/comments/{commentId}`
  응답 `204`
  권한: 작성자만(403)

---

## 11. Library(소장/구독) — 개인화(로그인 필요)

### 11.1 내 소장 상태 upsert (로그인 필요)

- `PUT /api/me/library/titles/{titleId}`

```json
{
  "storeId": 1,
  "acquisitionType": "SUBSCRIPTION",
  "note": "넷플릭스"
}
```

응답 `200`

```json
{
  "titleId": 10,
  "storeId": 1,
  "acquisitionType": "SUBSCRIPTION",
  "note": "넷플릭스",
  "updatedAt": "2026-02-09T15:36:00"
}
```

### 11.2 내 소장 상태 조회 (로그인 필요)

- `GET /api/me/library/titles/{titleId}`
- `GET /api/me/library?type=VIDEO&page=0&size=20`

---

## 12. Stores (마스터) — 공개 조회

### 12.1 스토어 목록

- `GET /api/stores`
  응답 `200`

```json
{
  "items": [
    { "storeId": 1, "name": "Steam", "storeType": "DIGITAL", "url": "https://..." }
  ]
}
```

---

## 13. Notes (MVP 구현 순서 제안)

1) Auth(JWT) + users
2) Title 등록/목록/검색/상세 (+ alias)
3) Unit 등록/목록/정렬
4) Progress(내 진행도)
5) Review(내 리뷰 + 공개 목록) + stats 집계(일단 조회시 계산 → 나중에 캐시)
6) Memo(개인)
7) Library(현재 상태)
8) Comment
9) Guide(공개)

---

문서 끝.
