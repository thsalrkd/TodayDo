import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'records';

class RecordStorage {
  /**
   * 모든 Record 가져오기
   */
  async getAll() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting records:', error);
      return [];
    }
  }

  /**
   * ID로 Record 찾기 (id와 date는 동일)
   */
  async getById(id) {
    try {
      const records = await this.getAll();
      return records.find(record => record.id === id) || null;
    } catch (error) {
      console.error('Error getting record by id:', error);
      return null;
    }
  }

  /**
   * 날짜로 Record 찾기 (id와 date는 동일)
   */
  async getByDate(date) {
    try {
      const records = await this.getAll();
      return records.find(record => record.id === date) || null;
    } catch (error) {
      console.error('Error getting record by date:', error);
      return null;
    }
  }

  /**
   * 월별 Record 가져오기
   */
  async getByMonth(year, month) {
    try {
      const records = await this.getAll();
      const monthStr = month.toString().padStart(2, '0');
      const yearStr = year.toString();

      return records.filter(record => {
        if (!record.id) return false;
        const [y, m] = record.id.split('.');
        return y === yearStr && m === monthStr;
      });
    } catch (error) {
      console.error('Error getting records by month:', error);
      return [];
    }
  }

  /**
   * 특정 날짜에 Record가 존재하는지 확인
   */
  async exists(date) {
    try {
      const records = await this.getAll();
      return records.some(record => record.id === date);
    } catch (error) {
      console.error('Error checking record existence:', error);
      return false;
    }
  }

  /**
   * Record 추가 (신규 생성)
   * date를 id로 사용 (하루에 하나의 record만 존재)
   */
  async add(recordData) {
    try {
      if (!recordData.date) {
        throw new Error('Record date is required');
      }

      const records = await this.getAll();
      const id = recordData.date; // date를 id로 사용
      
      // 이미 존재하는지 확인
      const exists = records.some(r => r.id === id);
      if (exists) {
        throw new Error('Record already exists for this date');
      }
      
      const now = new Date().toISOString();
      
      const newRecord = {
        id: id,
        date: id,
        content: recordData.content || null,
        mood: recordData.mood || null,
        createdAt: now,
        updatedAt: now
      };
      
      records.push(newRecord);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return newRecord;
    } catch (error) {
      console.error('Error adding record:', error);
      throw error;
    }
  }

  /**
   * Record 업데이트 (ID 기반 - 부분 업데이트)
   */
  async update(id, updates) {
    try {
      const records = await this.getAll();
      const index = records.findIndex(r => r.id === id);

      if (index === -1) {
        throw new Error('Record not found');
      }

      // date 변경 불가 (id와 date는 항상 일치해야 함)
      if (updates.date && updates.date !== id) {
        throw new Error('Cannot change record date. Delete and create new record instead.');
      }

      records[index] = {
        ...records[index],
        ...updates,
        id: id, // id 유지
        date: id, // date도 id와 동일하게 유지
        updatedAt: new Date().toISOString()
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));

      return records[index];
    } catch (error) {
      console.error('Error updating record:', error);
      throw error;
    }
  }

  /**
   * Record 저장 (add 또는 update 자동 판단)
   * 프론트 고려 편의 메서드... 존재하면 update, 없으면 add
   */
  async save(recordData) {
    try {
      if (!recordData.date) {
        throw new Error('Record date is required');
      }

      const exists = await this.exists(recordData.date);
      
      if (exists) {
        return await this.update(recordData.date, recordData);
      } else {
        return await this.add(recordData);
      }
    } catch (error) {
      console.error('Error saving record:', error);
      throw error;
    }
  }

  /**
   * Record 삭제 (ID로 - date와 동일)
   */
  async delete(id) {
    try {
      const records = await this.getAll();
      const filtered = records.filter(record => record.id !== id);
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      
      return true;
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    }
  }

  /**
   * 여러 Record 삭제 (ID 배열)
   */
  async deleteMany(ids) {
    try {
      const records = await this.getAll();
      const filtered = records.filter(record => !ids.includes(record.id));
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      
      return true;
    } catch (error) {
      console.error('Error deleting many records:', error);
      throw error;
    }
  }

  /**
   * 모든 Record 삭제
   */
  async clear() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing records:', error);
      throw error;
    }
  }

  /**
   * Firebase 동기화 전용 메서드
   * Firebase 데이터를 로컬에 저장 (중복체크 x)
   */
  async sync(recordData) {
    try {
      if (!recordData.id) {
        throw new Error('Sync requires record ID');
      }

      const records = await this.getAll();
      const existingIndex = records.findIndex(r => r.id === recordData.id);
      
      // id와 date 일치 보장
      const syncData = {
        ...recordData,
        date: recordData.id
      };
      
      if (existingIndex >= 0) {
        records[existingIndex] = syncData;
      } else {
        records.push(syncData);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      return syncData;
    } catch (error) {
      console.error('Sync record error:', error);
      throw error;
    }
  }
}

export default new RecordStorage();