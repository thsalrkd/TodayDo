import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'tags';

class TagStorage {
  /**
   * 모든 Tag 가져오기
   */
  async getAll() {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }

  /**
   * ID로 Tag 찾기
   */
  async getById(id) {
    try {
      const tags = await this.getAll();
      return tags.find(t => t.id === id) || null;
    } catch (error) {
      console.error('Error getting tag by id:', error);
      return null;
    }
  }

  /**
   * 이름 중복 확인
   */
  async exists(name) {
    try {
      const tags = await this.getAll();
      return tags.some(t => t.name === name);
    } catch (error) {
      console.error('Error checking tag existence:', error);
      return false;
    }
  }

  /**
   * Tag 추가
   */
  async add(tagData) {
    try {
      const name = tagData.name.trim();
      
      if (name === '') {
        throw new Error('태그 이름을 입력해주세요.');
      }
      
      if (await this.exists(name)) {
        throw new Error('이미 존재하는 태그 이름입니다.');
      }

      const tags = await this.getAll();
      
      const newTag = {
        id: Date.now().toString(),
        name: name
      };
      
      tags.push(newTag);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
      
      return newTag;
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  }

  /**
   * Tag 수정 (이름)
   */
  async update(id, newName) {
    try {
      const trimmedName = newName.trim();
      
      if (trimmedName === '') {
        throw new Error('태그 이름을 입력해주세요.');
      }
      
      const tags = await this.getAll();
      
      // 중복 체크 (자신 제외)
      const duplicate = tags.find(t => t.id !== id && t.name === trimmedName);
      if (duplicate) {
        throw new Error('이미 존재하는 태그 이름입니다.');
      }
      
      // ✅ parent → index로 변경
      const index = tags.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error('Tag not found');
      }
      
      // ✅ tags[parentIndex] → tags[index]
      tags[index].name = trimmedName;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
      
      return tags[index];
    } catch (error) {
      console.error('Error updating tag name:', error);
      throw error;
    }
  }

  /**
   * Tag 삭제
   */
  async delete(id) {
    try {
      const tags = await this.getAll();
      const filtered = tags.filter(t => t.id !== id);
      
      if (filtered.length === tags.length) {
        throw new Error('Tag not found');
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting tag:', error);
      throw error;
    }
  }

  /**
   * 모든 Tag 삭제
   */
  async clear() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing tags:', error);
      throw error;
    }
  }
}

export default new TagStorage();