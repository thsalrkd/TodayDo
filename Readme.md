# 프로젝트 설명: 오늘Do - 루틴 관리 애플리케이션

## 프로젝트 이름

오늘Do


## 프로젝트 설명

사용자의 Todo, 반복 루틴, 한 줄 기록 기능을 하나로 통합하여 일상의 흐름을 체계적으로 관리하고, 달성률 시각화 및 보상 시스템을 통해 지속적인 동기를 부여하는 통합형 루틴 관리 애플리케이션이다.


## 주요 기능 요약

- 계정 및 소셜: 회원가입/로그인/로그아웃, 친구 관리(신청/목록)
- Todo/루틴: 목록/개별 항목 관리, 정렬 및 필터링
- 기록: 한 줄 기록 작성, 일자별 기록 관리
- 피드백: 보상 시스템(경험치/레벨, 칭호), 달성률 시각화
- 알림: 푸시알림, 알람 기능 제공


## 기술 스택

| 구분 | 기술 스택 |
|---|---|
| 프론트엔드 | ReactNative + Expo-CLI |
| 언어 | JavaScript |
| 백엔드 | Firebase |


## 폴더 구조 및 주요 파일 설명

### 폴더 구조

```src
src
├── components
├── core
│   ├── context
│   ├── firebase
│   └── storage
├── images
├── navigation
└── screens

```


### 주요 폴더 설명

| 폴더 | 파일역할 |
|---|---|
| src/ | 앱의 주요 소스 코드 (React Native/JavaScript)
| src/screens/ | 각 네비게이션 경로에 매핑되는 주요 화면 컴포넌트 (Home, Todo, Record, Mypage 등) |
| src/components/ | 재사용 가능한 UI 요소 및 작은 로직 컴포넌트 |
| src/core/ | 앱에 필요한 데이터를 관리하고, 서버(Firebase)와 통신하는 기능 모음 |
| src/navigation/ | Stack 및 Tab Navigator 등 화면 간의 이동 구조 정의 |


## 주요 화면/기능 소개

홈 탭
- 메인 화면: 사용자 프로필 표시(닉네임, 칭호, 경험치), 달력, 통계, 오늘 일정 표시

Todo 탭
- 할 일 목록 화면: 할 일 목록 표시, 정렬 및 필터링, 개별 항목 상세 관리

루틴 탭
- 루틴 목록 화면: 루틴 목록 표시, 정렬 및 필터링, 개별 항목 상세 관리

한 줄 기록 탭
- 월/일별 기록 목록: 일자별 한 줄 기록 확인/작성/수정, 오늘의 색 설정, 월별 기록 목록 보기

마이페이지 탭
- 마이페이지: 프로필 편집, 친구 관리, 통계, 리워드 확인, 계정 관리 및 로그아웃


## 실행 순서

1. 사전 준비
- Node.js 설치
- 모바일 기기에 Expo Go 앱 설치
- PC 실행 시 Android Studio(Emulator) 또는 Xcode(Simulator) 필요

2. 프로젝트 설정
- npm install: 프로젝트 폴더로 이동 후 패키지 설치

3. 앱 실행
- npx expo start: 개발 서버 실행

4. 테스트
- 스마트폰 카메라 또는 Expo Go 앱으로 QR 코드 스캔
- 터미널에 a(Android) 또는 i(iOS) 누르기


## 팀원

| 이름 | 학번 | 깃허브 |
|---|---|---|
| 김지민 | 2291147 | [rwajm](https://github.com/rwajm/TodayDo) |
| 김채현 | 2371114 | [KCH-ddar](https://github.com/KCH-ddar/TodayDo_App) |
| 손미강 | 2271101 | [thsalrkd](https://github.com/thsalrkd/TodayDo) |
| 홍수현 | 2171267 |  |

최종 작성일: 2025-12-14