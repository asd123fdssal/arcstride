# Arcstride

서브컬쳐 소비자를 위한 미디어 진행도 관리 서비스

## 모노레포 구조

```
arcstride/
├── docs/                    # 문서
│   ├── specs/               # 데이터모델 스펙, ERD
│   └── api/                 # API 계약서
├── db/
│   └── mysql/
│       └── schema.sql       # DDL (reset-first, 개발용)
├── apps/
│   ├── backend/             # Spring Boot (Java 21)
│   │   ├── build.gradle
│   │   └── src/
│   └── frontend/            # Next.js (React)
│       └── (추후)
├── .gitignore
└── README.md
```

## 기술 스택

| Layer    | Tech                              |
|----------|-----------------------------------|
| Backend  | Java 21 + Spring Boot 3.4.x      |
| Frontend | Next.js (React) — 추후 구현      |
| DB       | MySQL 8.x                        |

## 로컬 개발

### Backend

```bash
cd apps/backend
./gradlew bootRun
```

- API Base: `http://localhost:8080/api`
- MySQL: `localhost:3306/arcstride`

### DB 초기화

```bash
mysql -u root -p < db/mysql/schema.sql
```
