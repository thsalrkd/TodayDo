import {
    collection,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    getDocs,
    doc,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';
import { db } from './config';

class RecordService {
    // 사용자의 records 서브컬렉션 참조
    getRecordsCollection(userId) {
        return collection(db, 'users', userId, 'records');
    }

    /**
     * 실시간 구독: userId의 모든 Record
     */
    subscribeRecords(userId, callback) {
        const q = query(this.getRecordsCollection(userId));
        return onSnapshot(
            q,
            (snapshot) => {
                const records = snapshot.docs.map(doc => ({
                    id: doc.id,
                    date: doc.id, // id와 date 일치 보장
                    ...doc.data()
                }));
                callback(records);
            },
            (error) => console.error('Subscribe records error:', error)
        );
    }

    /**
     * 모든 Record 가져오기 (동기화용)
     */
    async getAllByUser(userId) {
        try {
            const q = query(this.getRecordsCollection(userId));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                date: doc.id, // id와 date 일치 보장
                ...doc.data()
            }));
        } catch (error) {
            console.error('Get records error:', error);
            return [];
        }
    }

    /**
     * 월별 Record 가져오기
     */
    async getRecordsByMonth(userId, year, month) {
        try {
            const records = await this.getAllByUser(userId);
            const monthStr = month.toString().padStart(2, '0');
            const yearStr = year.toString();

            return records.filter(record => {
                if (!record.id) return false;
                const [y, m] = record.id.split('.');
                return y === yearStr && m === monthStr;
            });
        } catch (error) {
            console.error('Get records by month error:', error);
            return [];
        }
    }

    /**
     * Record 생성 (신규 추가)
     * id = date 형식 (예: "2024.03.15")
     */
    async create(userId, recordData) {
        try {
            // date를 id로 사용
            const recordId = recordData.date || recordData.id;
            
            if (!recordId) {
                throw new Error('Record date is required');
            }

            const docRef = doc(db, 'users', userId, 'records', recordId);
            
            // date 필드는 일관성을 위해 저장
            const { id, ...dataWithoutId } = recordData;
            
            await setDoc(docRef, {
                ...dataWithoutId,
                date: recordId, // date 명시적 저장
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });
            
            console.log('Record created:', recordId);
            return recordId;
        } catch (error) {
            console.error('Create record error:', error);
            throw error;
        }
    }

    /**
     * Record 업데이트 (기존 항목 수정)
     * id = date 이므로, date 변경은 불가 (삭제 후 재생성 필요)
     */
    async update(userId, recordData) {
        try {
            const recordId = recordData.date || recordData.id;
            
            if (!recordId) {
                throw new Error('Record date/id is required');
            }

            const docRef = doc(db, 'users', userId, 'records', recordId);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                throw new Error('Record not found');
            }

            // id, date, createdAt 제외하고 업데이트
            const { id, date, createdAt, ...updateData } = recordData;
            
            await updateDoc(docRef, {
                ...updateData,
                date: recordId, // date 유지
                updatedAt: Timestamp.now()
            });
            
            console.log('Record updated:', recordId);
            return recordId;
        } catch (error) {
            console.error('Update record error:', error);
            throw error;
        }
    }

    /**
     * Record 삭제 (ID로 - date와 동일)
     */
    async delete(userId, recordId) {
        try {
            await deleteDoc(doc(db, 'users', userId, 'records', recordId));
            console.log('Record deleted:', recordId);
        } catch (error) {
            console.error('Delete record error:', error);
            throw error;
        }
    }

    /**
     * 여러 Record 삭제 (ID 배열)
     */
    async deleteMany(userId, recordIds) {
        try {
            await Promise.all(
                recordIds.map(id => this.delete(userId, id))
            );
        } catch (error) {
            console.error('Delete many records error:', error);
            throw error;
        }
    }

    /**
     * 사용자의 모든 Record 삭제
     */
    async deleteAllByUser(userId) {
        try {
            const records = await this.getAllByUser(userId);
            await this.deleteMany(userId, records.map(r => r.id));
        } catch (error) {
            console.error('Delete all records error:', error);
            throw error;
        }
    }
}

export default new RecordService();