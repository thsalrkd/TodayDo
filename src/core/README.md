# Core 폴더 구조 및 설명

## 폴더 구조

```
core/
├── context/          # React Context (전역 상태 관리)
│   ├── authContext.js
│   ├── dataContext.js
│   └── userContext.js
├── firebase/         # Firebase 서비스 레이어
│   ├── config.js
│   ├── authService.js
│   ├── userService.js
│   ├── todoService.js
│   ├── routineService.js
│   ├── recordService.js
│   ├── tagService.js
│   ├── socialService.js
│   └── sessionManager.js
└── storage/          # 로컬 스토리지 레이어
    ├── todoStorage.js
    ├── routineStorage.js
    ├── recordStorage.js
    ├── tagStorage.js
    └── notificationService.js
```

---

## 보안 규칙

### 1. 인증 상태 검증
모든 Firebase 작업은 사용자 인증 후에만 가능합니다.

```javascript
// 잘못된 예시
await todoService.create(todoData);

// 올바른 예시
const { user } = useAuth();
if (user) {
  await todoService.create(user.uid, todoData);
}
```

### 2. 세션 관리 (단일 기기 로그인)
- 한 계정당 하나의 활성 세션만 허용
- 다른 기기에서 로그인 시 기존 세션 자동 종료
- 세션 충돌 감지 시 사용자에게 알림 후 강제 로그아웃

```javascript
// sessionManager가 자동으로 처리
await sessionManager.startSession(userId);  // 로그인 시
await sessionManager.endSession(userId);    // 로그아웃 시
```

### 3. 데이터 접근 권한
- 사용자는 본인의 데이터만 CRUD 가능
- Firestore Security Rules로 서버 레벨에서 강제

```javascript
// Firestore db 보안 규칙
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId);
      allow update: if isOwner(userId) 
        || (isSignedIn() && (
          // 친구가 나를 friends 배열에 추가하는 경우
          request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['friends', 'updatedAt']) ||
          // 친구 요청 관련 업데이트
          request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['friendRequestsReceived', 'friendRequestsSent', 'updatedAt'])
        ));
      allow delete: if isOwner(userId);
      
      match /session/{sessionDoc} {
        allow read, write: if isOwner(userId);
      }
      
      match /todos/{todoId} {
        allow read, write: if isOwner(userId);
      }
      
      match /routines/{routineId} {
        allow read, write: if isOwner(userId);
      }
      
      match /records/{recordId} {
        allow read, write: if isOwner(userId);
      }
      match /tags/{tagId} {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

---

## Context 사용 방법

### AuthContext
인증 상태 및 사용자 정보 관리

```javascript
import { useAuth } from '@/core/context/authContext';

function MyComponent() {
  const {
    user,           // 현재 로그인된 사용자 { uid, email, nickname }
    loading,        // 인증 상태 로딩 여부
    createAccount,  // 1단계: 계정 생성 (이메일/비밀번호)
    checkEmailVerification,  // 2단계: 이메일 인증 확인
    resendVerificationEmail, // 인증 이메일 재발송
    completeSignUp, // 3단계: 닉네임 설정 및 가입 완료
    signIn,         // 로그인
    logOut,         // 로그아웃
    resetPassword,  // 비밀번호 재설정 이메일 발송
    updateNickname  // 닉네임 변경
  } = useAuth();

  // 사용 예시
  const handleLogin = async () => {
    try {
      await signIn(email, password);
    } catch (error) {
      console.error(error.message);
    }
  };
}
```

### DataContext
Todo, Routine, Record, Tag 데이터 관리 (실시간 동기화)

```javascript
import { useData } from '@/core/context/dataContext';

function MyComponent() {
  const {
    todos,        // 모든 Todo 배열
    routines,     // 모든 Routine 배열
    records,      // 모든 Record 배열
    tags,         // 모든 Tag 배열
    syncing,      // 동기화 진행 중 여부
    syncStatus,   // 동기화 상태 { lastSyncTime, pendingCount, failedItems }
    user,         // 현재 사용자 (authContext의 user)
    saveData,     // 데이터 추가/생성
    deleteData,   // 데이터 삭제
    updateData,   // 데이터 수정
    refreshData   // 수동 새로고침
  } = useData();

  // 사용 예시
  const handleAddTodo = async () => {
    try {
      await saveData('todo', {
        title: 'New Todo',
        date: '2024.03.15',
        time: '14:00'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateTodo = async (id) => {
    try {
      await updateData('todo', id, { completed: true });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      await deleteData('todo', id);
    } catch (error) {
      console.error(error);
    }
  };
}
```

### UserContext
사용자 프로필 및 레벨/경험치 실시간 구독

```javascript
import { useUser } from '@/core/context/userContext';

function MyComponent() {
  const {
    userProfile,  // { uid, email, nickname, level, exp, maxExp, title, stats, friends, ... }
    loading       // 프로필 로딩 여부
  } = useUser();

  return (
    <div>
      <p>닉네임: {userProfile?.nickname}</p>
      <p>레벨: {userProfile?.level}</p>
      <p>경험치: {userProfile?.exp} / {userProfile?.maxExp}</p>
      <p>칭호: {userProfile?.title}</p>
    </div>
  );
}
```