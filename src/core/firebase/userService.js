import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    increment,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

class UserService {
    /**
     * 사용자 프로필 생성 (회원가입 시)
     */
    async createUserProfile(userId, email, nickname) {
        try {
            const userDoc = {
                email,
                nickname,
                level: 1,
                exp: 0,
                maxExp: 300,
                // title: '처음 날개 단 병아리!',
                
                // 통계
                stats: {
                    totalTodosCompleted: 0,
                    totalRoutinesCompleted: 0,
                    totalRecordsCompleted: 0,
                    todayStreak: 0,
                    maxStreak: 0,
                    lastActiveDate: new Date().toISOString().split('T')[0]
                },
                
                // 친구 관계
                friends: [],
                friendRequestsSent: [],
                friendRequestsReceived: [],
                
                // 메타데이터
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await setDoc(doc(db, 'users', userId), userDoc);
            console.log('✅ User profile created:', userId);
            return userDoc;
        } catch (error) {
            console.error('❌ Create user profile error:', error);
            throw error;
        }
    }

    /**
     * 사용자 프로필 조회
     */
    async getUserProfile(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            
            if (!userDoc.exists()) {
                throw new Error('User profile not found');
            }
            
            return {
                id: userDoc.id,
                ...userDoc.data()
            };
        } catch (error) {
            console.error('❌ Get user profile error:', error);
            throw error;
        }
    }

    /**
     * 닉네임 업데이트
     */
    async updateNickname(userId, newNickname) {
        try {
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                nickname: newNickname,
                updatedAt: serverTimestamp()
            });
            
            console.log('✅ Nickname updated:', newNickname);
            return true;
        } catch (error) {
            console.error('❌ Update nickname error:', error);
            throw error;
        }
    }

    /**
     * 경험치 추가 (레벨업 자동 처리)
     */
    async addExp(userId, expAmount) {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                throw new Error('User not found');
            }
            
            const userData = userSnap.data();
            let { exp, maxExp, level } = userData;
            
            // 경험치 추가
            exp += expAmount;
            
            // 레벨업
            while (exp >= maxExp) {
                exp -= maxExp;
                level += 1;
                maxExp += 200; // (임의)레벨당 200씩 증가
            }
            
            // 업데이트
            await updateDoc(userRef, {
                exp,
                level,
                maxExp,
                updatedAt: serverTimestamp()
            });
            
            console.log(`✅ Added ${expAmount} exp. New level: ${level}`);
            return { exp, level, maxExp, leveledUp: level > userData.level };
            
        } catch (error) {
            console.error('❌ Add exp error:', error);
            throw error;
        }
    }

    /**
     * Todo 완료 통계 업데이트
     */
    async incrementTodoStats(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                'stats.totalTodosCompleted': increment(1),
                updatedAt: serverTimestamp()
            });
            
            // 경험치 추가 (20exp)
            await this.addExp(userId, 20);
            
            console.log('✅ Todo stats incremented');
        } catch (error) {
            console.error('❌ Increment todo stats error:', error);
            throw error;
        }
    }

    /**
     * Routine 완료 통계 업데이트
     */
    async incrementRoutineStats(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                'stats.totalRoutinesCompleted': increment(1),
                updatedAt: serverTimestamp()
            });
            
            // 경험치 추가 (20exp)
            await this.addExp(userId, 20);
            
            console.log('✅ Routine stats incremented');
        } catch (error) {
            console.error('❌ Increment routine stats error:', error);
            throw error;
        }
    }

    /**
     * Record 작성 통계 업데이트
     */
    async incrementRecordStats(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                'stats.totalRecordsCompleted': increment(1),
                updatedAt: serverTimestamp()
            });
            
            // 경험치 추가 (10exp)
            await this.addExp(userId, 10);
            
            console.log('✅ Record stats incremented');
        } catch (error) {
            console.error('❌ Increment record stats error:', error);
            throw error;
        }
    }

    /**
     * 연속 달성 일수 업데이트 : 테스트되지 않음
     */
    async updateStreak(userId) {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) return;
            
            const userData = userSnap.data();
            const today = new Date().toISOString().split('T')[0];
            const lastActiveDate = userData.stats?.lastActiveDate;
            
            // 날짜 계산
            const lastDate = new Date(lastActiveDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
            
            let newStreak = userData.stats?.todayStreak || 0;
            
            if (diffDays === 1) {
                // 연속 달성
                newStreak += 1;
            } else if (diffDays > 1) {
                // 연속 끊김
                newStreak = 1;
            }
            // diffDays === 0이면 오늘 이미 업데이트됨 (유지)
            
            const maxStreak = Math.max(newStreak, userData.stats?.maxStreak || 0);
            
            await updateDoc(userRef, {
                'stats.todayStreak': newStreak,
                'stats.maxStreak': maxStreak,
                'stats.lastActiveDate': today,
                updatedAt: serverTimestamp()
            });
            
            console.log(`✅ Streak updated: ${newStreak} days`);
            return { todayStreak: newStreak, maxStreak };
            
        } catch (error) {
            console.error('❌ Update streak error:', error);
            throw error;
        }
    }

    /**
     * 칭호 업데이트
     */
    async updateTitle(userId, newTitle) {
        try {
            const userRef = doc(db, 'users', userId);
            
            await updateDoc(userRef, {
                title: newTitle,
                updatedAt: serverTimestamp()
            });
            
            console.log('✅ Title updated:', newTitle);
            return true;
        } catch (error) {
            console.error('❌ Update title error:', error);
            throw error;
        }
    }

    /**
     * 전체 통계 조회
     */
    async getUserStats(userId) {
        try {
            const userProfile = await this.getUserProfile(userId);
            return {
                level: userProfile.level,
                exp: userProfile.exp,
                maxExp: userProfile.maxExp,
                title: userProfile.title,
                stats: userProfile.stats
            };
        } catch (error) {
            console.error('❌ Get user stats error:', error);
            throw error;
        }
    }
}

export default new UserService();