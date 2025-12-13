import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    updatePassword,
    onAuthStateChanged
} from 'firebase/auth';
import { auth } from './config';
import userService from './userService';

class AuthService {
    /**
     * 회원가입
     */
    async signUp(email, password, nickname) {
        try {
            // 1. Firebase Auth 계정 생성
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. 프로필 업데이트 (displayName)
            await updateProfile(user, {
                displayName: nickname
            });

            // 3. Firestore에 사용자 프로필 생성 (userService 사용)
            await userService.createUserProfile(user.uid, email, nickname);

            return {
                uid: user.uid,
                email: user.email,
                nickname: nickname
            };
        } catch (error) {
            console.error('SignUp Error:', error);
            const errorMessage = this._handleAuthError(error);
            throw new Error(errorMessage);
        }
    }

    /**
     * 로그인
     */
    async signIn(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Firestore에서 사용자 프로필 가져오기 (userService 사용)
            const userProfile = await userService.getUserProfile(user.uid);

            return {
                uid: user.uid,
                email: user.email,
                nickname: userProfile.nickname,
                level: userProfile.level,
                exp: userProfile.exp,
                maxExp: userProfile.maxExp,
                title: userProfile.title
            };
        } catch (error) {
            console.error('SignIn Error:', error);
            const errorMessage = this._handleAuthError(error);
            throw new Error(errorMessage);
        }
    }

    /**
     * 로그아웃
     */
    async logOut() {
        try {
            await signOut(auth);
        } catch (error) {
            console.error('LogOut Error:', error);
            throw new Error('로그아웃에 실패했습니다.');
        }
    }

    /**
     * 비밀번호 재설정 이메일 전송
     */
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (error) {
            console.error('Reset Password Error:', error);
            const errorMessage = this._handleAuthError(error);
            throw new Error(errorMessage);
        }
    }

    /**
     * 비밀번호 변경 (로그인 상태에서)
     */
    async changePassword(newPassword) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('로그인이 필요합니다.');

            await updatePassword(user, newPassword);
            console.log('✅ Password changed successfully');
        } catch (error) {
            console.error('Change Password Error:', error);
            const errorMessage = this._handleAuthError(error);
            throw new Error(errorMessage);
        }
    }

    /**
     * 현재 사용자 가져오기
     */
    getCurrentUser() {
        return auth.currentUser;
    }

    /**
     * 닉네임 업데이트 (Auth + Firestore)
     */
    async updateNickname(newNickname) {
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('로그인이 필요합니다.');

            // Auth displayName 업데이트
            await updateProfile(user, {
                displayName: newNickname
            });

            // Firestore 업데이트 (userService 사용)
            await userService.updateNickname(user.uid, newNickname);

            return {
                uid: user.uid,
                email: user.email,
                nickname: newNickname
            };
        } catch (error) {
            console.error('Update nickname error:', error);
            throw error;
        }
    }

    /**
     * 인증 상태 변경 리스너
     */
    onAuthStateChanged(callback) {
        return onAuthStateChanged(auth, callback);
    }

    /**
     * 에러 처리
     */
    _handleAuthError(error) {
        const errorCode = error.code;

        switch (errorCode) {
            // 공통
            case 'auth/invalid-email':
                return '유효하지 않은 이메일 형식입니다.';
            case 'auth/missing-password':
                return '비밀번호를 입력해주세요.';

            // 회원가입 관련
            case 'auth/email-already-in-use':
                return '이미 사용 중인 이메일입니다.';
            case 'auth/password-does-not-meet-requirements':
                return '비밀번호는 6~32자의 영문/숫자/특수문자의 조합이어야 합니다.';
            case 'auth/weak-password':
                return '비밀번호는 최소 6자 이상이어야 합니다.';

            // 로그인 관련
            case 'auth/user-disabled':
                return '비활성화된 계정입니다. 관리자에게 문의해주세요.';
            case 'auth/invalid-credential':
                return '이메일 또는 비밀번호를 확인해주세요.';
            case 'auth/invalid-login-credentials':
                return '로그인 정보가 올바르지 않습니다.';
            case 'auth/user-not-found':
                return '존재하지 않는 계정입니다.';
            case 'auth/wrong-password':
                return '비밀번호가 올바르지 않습니다.';

            // 보안 관련
            case 'auth/too-many-requests':
                return '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
            case 'auth/user-token-expired':
                return '인증이 만료되었습니다. 다시 로그인해주세요.';
            case 'auth/invalid-user-token':
                return '유효하지 않은 인증 정보입니다. 다시 로그인해주세요.';
            case 'auth/requires-recent-login':
                return '보안을 위해 다시 로그인이 필요합니다.';

            // 기타
            case 'auth/network-request-failed':
                return '네트워크 연결을 확인해주세요.';

            default:
                console.error('Unhandled auth error:', errorCode, error.message);
                return '인증 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
    }
}

export default new AuthService();