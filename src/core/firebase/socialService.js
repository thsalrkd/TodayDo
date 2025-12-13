import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    query,
    collection,
    where,
    getDocs,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './config';

class SocialService {
    /**
     * 이메일로 사용자 검색
     */
    async searchUserByEmail(email) {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email));
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                return null;
            }
            
            const userDoc = snapshot.docs[0];
            return {
                id: userDoc.id,
                email: userDoc.data().email,
                nickname: userDoc.data().nickname,
                level: userDoc.data().level
            };
        } catch (error) {
            console.error('❌ Search user error:', error);
            throw error;
        }
    }

    /**
     * 친구 요청 보내기
     */
    async sendFriendRequest(fromUserId, toUserEmail) {
        try {
            // 상대방 찾기
            const targetUser = await this.searchUserByEmail(toUserEmail);
            
            if (!targetUser) {
                throw new Error('사용자를 찾을 수 없습니다.');
            }
            
            if (targetUser.id === fromUserId) {
                throw new Error('자기 자신에게 친구 요청을 보낼 수 없습니다.');
            }
            
            // 이미 친구인지 확인
            const fromUserDoc = await getDoc(doc(db, 'users', fromUserId));
            const friends = fromUserDoc.data()?.friends || [];
            
            if (friends.includes(targetUser.id)) {
                throw new Error('이미 친구입니다.');
            }
            
            // 요청 보낸 목록에 추가
            await updateDoc(doc(db, 'users', fromUserId), {
                friendRequestsSent: arrayUnion(targetUser.id),
                updatedAt: serverTimestamp()
            });
            
            // 상대방의 받은 요청 목록에 추가
            await updateDoc(doc(db, 'users', targetUser.id), {
                friendRequestsReceived: arrayUnion(fromUserId),
                updatedAt: serverTimestamp()
            });
            
            console.log('✅ Friend request sent');
            return { success: true, targetUser };
            
        } catch (error) {
            console.error('❌ Send friend request error:', error);
            throw error;
        }
    }

    /**
     * 친구 요청 수락
     */
    async acceptFriendRequest(userId, requesterId) {
        try {
            // 양방향 친구 추가
            await updateDoc(doc(db, 'users', userId), {
                friends: arrayUnion(requesterId),
                friendRequestsReceived: arrayRemove(requesterId),
                updatedAt: serverTimestamp()
            });
            
            await updateDoc(doc(db, 'users', requesterId), {
                friends: arrayUnion(userId),
                friendRequestsSent: arrayRemove(userId),
                updatedAt: serverTimestamp()
            });
            
            console.log('✅ Friend request accepted');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Accept friend request error:', error);
            throw error;
        }
    }

    /**
     * 친구 요청 거절
     */
    async rejectFriendRequest(userId, requesterId) {
        try {
            await updateDoc(doc(db, 'users', userId), {
                friendRequestsReceived: arrayRemove(requesterId),
                updatedAt: serverTimestamp()
            });
            
            await updateDoc(doc(db, 'users', requesterId), {
                friendRequestsSent: arrayRemove(userId),
                updatedAt: serverTimestamp()
            });
            
            console.log('✅ Friend request rejected');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Reject friend request error:', error);
            throw error;
        }
    }

    /**
     * 친구 요청 취소 (보낸 요청)
     */
    async cancelFriendRequest(userId, targetUserId) {
        try {
            await updateDoc(doc(db, 'users', userId), {
                friendRequestsSent: arrayRemove(targetUserId),
                updatedAt: serverTimestamp()
            });
            
            await updateDoc(doc(db, 'users', targetUserId), {
                friendRequestsReceived: arrayRemove(userId),
                updatedAt: serverTimestamp()
            });
            
            console.log('✅ Friend request cancelled');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Cancel friend request error:', error);
            throw error;
        }
    }

    /**
     * 친구 삭제
     */
    async removeFriend(userId, friendId) {
        try {
            await updateDoc(doc(db, 'users', userId), {
                friends: arrayRemove(friendId),
                updatedAt: serverTimestamp()
            });
            
            await updateDoc(doc(db, 'users', friendId), {
                friends: arrayRemove(userId),
                updatedAt: serverTimestamp()
            });
            
            console.log('✅ Friend removed');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Remove friend error:', error);
            throw error;
        }
    }

    /**
     * 친구 목록 조회 (상세 정보 포함)
     */
    async getFriendsList(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            const friendIds = userDoc.data()?.friends || [];
            
            if (friendIds.length === 0) {
                return [];
            }
            
            // 친구들의 상세 정보 가져오기
            const friendsData = await Promise.all(
                friendIds.map(async (friendId) => {
                    const friendDoc = await getDoc(doc(db, 'users', friendId));
                    if (friendDoc.exists()) {
                        return {
                            id: friendDoc.id,
                            email: friendDoc.data().email,
                            nickname: friendDoc.data().nickname,
                            level: friendDoc.data().level,
                            title: friendDoc.data().title
                        };
                    }
                    return null;
                })
            );
            
            return friendsData.filter(f => f !== null);
            
        } catch (error) {
            console.error('❌ Get friends list error:', error);
            throw error;
        }
    }

    /**
     * 받은 친구 요청 목록 조회
     */
    async getReceivedRequests(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            const requestIds = userDoc.data()?.friendRequestsReceived || [];
            
            if (requestIds.length === 0) {
                return [];
            }
            
            const requestsData = await Promise.all(
                requestIds.map(async (requesterId) => {
                    const requesterDoc = await getDoc(doc(db, 'users', requesterId));
                    if (requesterDoc.exists()) {
                        return {
                            id: requesterDoc.id,
                            email: requesterDoc.data().email,
                            nickname: requesterDoc.data().nickname,
                            level: requesterDoc.data().level
                        };
                    }
                    return null;
                })
            );
            
            return requestsData.filter(r => r !== null);
            
        } catch (error) {
            console.error('❌ Get received requests error:', error);
            throw error;
        }
    }

    /**
     * 보낸 친구 요청 목록 조회
     */
    async getSentRequests(userId) {
        try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            const requestIds = userDoc.data()?.friendRequestsSent || [];
            
            if (requestIds.length === 0) {
                return [];
            }
            
            const requestsData = await Promise.all(
                requestIds.map(async (targetId) => {
                    const targetDoc = await getDoc(doc(db, 'users', targetId));
                    if (targetDoc.exists()) {
                        return {
                            id: targetDoc.id,
                            email: targetDoc.data().email,
                            nickname: targetDoc.data().nickname,
                            level: targetDoc.data().level
                        };
                    }
                    return null;
                })
            );
            
            return requestsData.filter(r => r !== null);
            
        } catch (error) {
            console.error('❌ Get sent requests error:', error);
            throw error;
        }
    }

    /**
     * 친구의 통계 조회 (비교용)
     */
    async getFriendStats(friendId) {
        try {
            const friendDoc = await getDoc(doc(db, 'users', friendId));
            
            if (!friendDoc.exists()) {
                throw new Error('Friend not found');
            }
            
            const data = friendDoc.data();
            return {
                nickname: data.nickname,
                level: data.level,
                title: data.title,
                stats: data.stats
            };
            
        } catch (error) {
            console.error('❌ Get friend stats error:', error);
            throw error;
        }
    }
}

export default new SocialService();