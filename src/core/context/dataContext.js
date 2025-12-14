import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './authContext';
import todoStorage from '../storage/todoStorage';
import routineStorage from '../storage/routineStorage';
import recordStorage from '../storage/recordStorage';
import tagStorage from '../storage/tagStorage';
import todoService from '../firebase/todoService';
import routineService from '../firebase/routineService';
import recordService from '../firebase/recordService';
import tagService from '../firebase/tagService';
// import notificationService from '../storage/notificationService';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [todos, setTodos] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [records, setRecords] = useState([]);
  const [tags, setTags] = useState([]);
  const [syncing, setSyncing] = useState(false);

  // 동기화 상태 관리
  const [syncStatus, setSyncStatus] = useState({
    lastSyncTime: null,
    pendingCount: 0,
    failedItems: []
  });

  // 낙관적 업데이트 ID 저장 (중복 반영 방지)
  // 로컬에서 변경 중인 항목 추적 (실시간 구독과 충돌 방지)
  const pendingLocalChanges = useRef(new Set());

  // Firebase 실시간 구독 unsubscribe 함수들
  const unsubscribes = useRef({
    todos: null,
    routines: null,
    records: null,
    tags: null
  });

  // 로컬 데이터 로드
  const loadLocalData = useCallback(async () => {
    try {
      const [todoList, routineList, recordList, tagList] = await Promise.all([
        todoStorage.getAll(),
        routineStorage.getAll(),
        recordStorage.getAll(),
        tagStorage.getAll()
      ]);

      setTodos(todoList || []);
      setRoutines(routineList || []);
      setRecords(recordList || []);
      setTags(tagList || []);

      console.log('[Data] Local data loaded:', {
        todos: todoList?.length || 0,
        routines: routineList?.length || 0,
        records: recordList?.length || 0,
        tags: tagList?.length || 0
      });
    } catch (error) {
      console.error('[Data] Load local data error:', error);
    }
  }, []);

  // 앱 시작 시 로컬 데이터 로드
  useEffect(() => {
    loadLocalData();
  }, [loadLocalData]);

  // Firebase 실시간 구독 설정
  const setupRealtimeListeners = useCallback((userId) => {
    console.log('[Data] Setting up real-time listeners');

    // Todos 실시간 구독
    unsubscribes.current.todos = todoService.subscribeTodos(userId, async (fbTodos) => {
      console.log('[Data] Todos updated from Firebase:', fbTodos.length);
      
      try {
        // 현재 로컬 데이터 가져오기
        const localTodos = await todoStorage.getAll();
        
        // 로컬 변경 중인 항목 제외 (pendingLocalChanges)
        const pendingIds = Array.from(pendingLocalChanges.current);
        console.log('[Data] Pending local changes:', pendingIds);
        
        // Firebase 데이터를 기준으로 로컬 업데이트
        // - pendingLocalChanges에 있는 항목은 건너뜀
        // - 나머지는 Firebase 데이터로 동기화
        
        // 로컬에서 삭제해야 할 항목 찾기 (Firebase, pending 양쪽에 모두 없는 것)
        const fbTodoIds = new Set(fbTodos.map(t => t.id));
        const toDelete = localTodos.filter(local => 
          !fbTodoIds.has(local.id) && !pendingLocalChanges.current.has(local.id)
        );
        
        // Firebase에서 온 데이터 중 pending이 아닌 것만 업데이트
        const toSync = fbTodos.filter(fb => !pendingLocalChanges.current.has(fb.id));
        
        // 삭제 실행
        for (const item of toDelete) {
          await todoStorage.delete(item.id);
          console.log('[Data] Removed stale todo:', item.id);
        }
        
        // 동기화 실행
        for (const todo of toSync) {
          await todoStorage.sync(todo);
        }
        
        console.log('[Data] Todos synced - Updated:', toSync.length, 'Removed:', toDelete.length);
        
        // UI 업데이트
        await loadLocalData();
      } catch (error) {
        console.error('[Data] Todos sync error:', error);
      }
    });

    // Routines 실시간 구독
    unsubscribes.current.routines = routineService.subscribeRoutines(userId, async (fbRoutines) => {
      console.log('[Data] Routines updated from Firebase:', fbRoutines.length);
      
      try {
        const localRoutines = await routineStorage.getAll();
        const fbRoutineIds = new Set(fbRoutines.map(r => r.id));
        
        // 삭제할 항목 (Firebase x, pending x)
        const toDelete = localRoutines.filter(local => 
          !fbRoutineIds.has(local.id) && !pendingLocalChanges.current.has(local.id)
        );
        
        // 동기화할 항목 (pending x)
        const toSync = fbRoutines.filter(fb => !pendingLocalChanges.current.has(fb.id));
        
        for (const item of toDelete) {
          await routineStorage.delete(item.id);
        }
        
        for (const routine of toSync) {
          await routineStorage.sync(routine);
        }
        
        console.log('[Data] Routines synced - Updated:', toSync.length, 'Removed:', toDelete.length);
        await loadLocalData();
      } catch (error) {
        console.error('[Data] Routines sync error:', error);
      }
    });

    // Records 실시간 구독
    unsubscribes.current.records = recordService.subscribeRecords(userId, async (fbRecords) => {
      console.log('[Data] Records updated from Firebase:', fbRecords.length);
      
      try {
        const localRecords = await recordStorage.getAll();
        const fbRecordIds = new Set(fbRecords.map(r => r.id));
        
        const toDelete = localRecords.filter(local => 
          !fbRecordIds.has(local.id) && !pendingLocalChanges.current.has(local.id)
        );
        
        const toSync = fbRecords.filter(fb => !pendingLocalChanges.current.has(fb.id));
        
        for (const item of toDelete) {
          await recordStorage.delete(item.id);
        }
        
        for (const record of toSync) {
          await recordStorage.sync(record);
        }
        
        console.log('[Data] Records synced - Updated:', toSync.length, 'Removed:', toDelete.length);
        await loadLocalData();
      } catch (error) {
        console.error('[Data] Records sync error:', error);
      }
    });

    // Tags 실시간 구독
    unsubscribes.current.tags = tagService.subscribeTags(userId, async (fbTags) => {
      console.log('[Data] Tags updated from Firebase:', fbTags.length);
      
      try {
        const localTags = await tagStorage.getAll();
        const fbTagIds = new Set(fbTags.map(t => t.id));
        
        const toDelete = localTags.filter(local => 
          !fbTagIds.has(local.id) && !pendingLocalChanges.current.has(local.id)
        );
        
        const toSync = fbTags.filter(fb => !pendingLocalChanges.current.has(fb.id));
        
        for (const item of toDelete) {
          await tagStorage.delete(item.id);
        }
        
        for (const tag of toSync) {
          await tagStorage.sync(tag);
        }
        
        console.log('[Data] Tags synced - Updated:', toSync.length, 'Removed:', toDelete.length);
        await loadLocalData();
      } catch (error) {
        console.error('[Data] Tags sync error:', error);
      }
    });

    setSyncStatus(prev => ({
      ...prev,
      lastSyncTime: new Date().toISOString()
    }));
  }, [loadLocalData]);

  // 실시간 구독 정리
  const cleanupListeners = useCallback(() => {
    console.log('[Data] Cleaning up real-time listeners');
    Object.values(unsubscribes.current).forEach(unsubscribe => {
      if (unsubscribe) unsubscribe();
    });
    unsubscribes.current = {
      todos: null,
      routines: null,
      records: null,
      tags: null
    };
  }, []);

  // 로그인 시 Firebase 실시간 구독 시작
  useEffect(() => {
    if (!user || authLoading) {
      cleanupListeners();
      return;
    }

    const initializeSync = async () => {
      setSyncing(true);
      try {
        // 초기 데이터 로드
        console.log('[Data] Initial data pull from Firebase');
        const [fbTodos, fbRoutines, fbRecords, fbTags] = await Promise.all([
          todoService.getAllByUser(user.uid),
          routineService.getAllByUser(user.uid),
          recordService.getAllByUser(user.uid),
          tagService.getAllByUser(user.uid)
        ]);

        // 로컬 스토리지 초기화 및 저장
        await todoStorage.clear();
        await routineStorage.clear();
        await recordStorage.clear();
        await tagStorage.clear();

        for (const todo of fbTodos) await todoStorage.sync(todo);
        for (const routine of fbRoutines) await routineStorage.sync(routine);
        for (const record of fbRecords) await recordStorage.sync(record);
        for (const tag of fbTags) await tagStorage.sync(tag);

        await loadLocalData();

        // 실시간 구독 시작
        setupRealtimeListeners(user.uid);
      } catch (error) {
        console.error('[Data] Initialize sync error:', error);
      } finally {
        setSyncing(false);
      }
    };

    initializeSync();

    return cleanupListeners;
  }, [user, authLoading, loadLocalData, setupRealtimeListeners, cleanupListeners]);

  // 앱 포그라운드 복귀 시 로컬 데이터만 새로고침
  useEffect(() => {
    if (!user) return;

    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('[Data] App resumed, refreshing local data');
        loadLocalData();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [user, loadLocalData]);

  // Firebase에 데이터 푸시 (백그라운드)
  const pushToFirebase = useCallback(async (type, data, isNew = false) => {
    if (!user) return;

    try {
      if (type === 'todo') {
        if (isNew) {
          await todoService.create(user.uid, data);
        } else {
          await todoService.update(user.uid, data);
        }
      } else if (type === 'routine') {
        if (isNew) {
          await routineService.create(user.uid, data);
        } else {
          await routineService.update(user.uid, data);
        }
      } else if (type === 'record') {
        if (isNew) {
          await recordService.create(user.uid, data);
        } else {
          await recordService.update(user.uid, data);
        }
      } else if (type === 'tag') {
        if (isNew) {
          await tagService.create(user.uid, data);
        } else {
          await tagService.update(user.uid, data);
        }
      }

      console.log(`✅ ${type} ${isNew ? 'created' : 'updated'} in Firebase:`, data.id);

      // 동기화 성공 시 상태 업데이트
      setSyncStatus(prev => ({
        ...prev,
        lastSyncTime: new Date().toISOString(),
        pendingCount: Math.max(0, prev.pendingCount - 1),
        failedItems: prev.failedItems.filter(item => item.id !== data.id)
      }));

      // 로컬 변경 추적에서 제거 (짧은 지연 후)
      setTimeout(() => {
        pendingLocalChanges.current.delete(data.id);
        console.log('[Data] Removed from pending:', data.id);
      }, 1000);

    } catch (error) {
      console.error(`[Data] Push ${type} to Firebase error:`, error);

      // 실패한 항목 추가
      setSyncStatus(prev => ({
        ...prev,
        failedItems: [...prev.failedItems, { id: data.id, type, error: error.message }]
      }));

      // 로컬 변경 추적에서 제거
      pendingLocalChanges.current.delete(data.id);
    }
  }, [user]);

  // 데이터 추가/저장
  const saveData = useCallback(async (type, data) => {
    try {
      let savedData;
      let isNew;

      // 로컬 변경 추적에 추가 (실시간 구독 충돌 방지)
      const itemId = data.id || `${type}_${Date.now()}`;
      pendingLocalChanges.current.add(itemId);
      console.log('[Data] Added to pending:', itemId);

      // 로컬 스토리지에 즉시 저장 (Optimistic Update)
      if (type === 'todo') {
        savedData = await todoStorage.add(data);
        isNew = true;
      } else if (type === 'routine') {
        savedData = await routineStorage.add(data);
        isNew = true;
      } else if (type === 'record') {
        const exists = await recordStorage.exists(data.date);
        savedData = await recordStorage.save(data);
        isNew = !exists;
      } else if (type === 'tag') {
        savedData = await tagStorage.add(data);
        isNew = true;
      }

      // UI 즉시 업데이트
      await loadLocalData();

      console.log(`[Data] ${type} saved locally (${isNew ? 'new' : 'update'})`);

      // 백그라운드에서 Firebase 동기화
      if (user) {
        setSyncStatus(prev => ({
          ...prev,
          pendingCount: prev.pendingCount + 1
        }));

        pushToFirebase(type, savedData, isNew);
      } else {
        console.log(`[Data] ${type} saved locally only (not logged in)`);
        pendingLocalChanges.current.delete(itemId);
      }

    } catch (error) {
      console.error(`[Data] Save ${type} error:`, error);
      if (data.id) {
        pendingLocalChanges.current.delete(data.id);
      }
      throw error;
    }
  }, [user, loadLocalData, pushToFirebase]);

  // 데이터 삭제
  const deleteData = useCallback(async (type, id) => {
    try {
      // 로컬 변경 추적
      pendingLocalChanges.current.add(id);
      console.log('[Data] Added to pending (delete):', id);

      // 로컬 삭제 (Optimistic Update)
      if (type === 'todo') {
        await todoStorage.delete(id);
      } else if (type === 'routine') {
        await routineStorage.delete(id);
      } else if (type === 'record') {
        await recordStorage.delete(id);
      } else if (type === 'tag') {
        await tagStorage.delete(id);
      }

      // UI 즉시 업데이트
      await loadLocalData();

      console.log(`[Data] ${type} deleted locally (optimistic update)`);

      // 백그라운드에서 Firebase 동기화
      if (user) {
        if (type === 'todo') {
          await todoService.delete(user.uid, id);
        } else if (type === 'routine') {
          await routineService.delete(user.uid, id);
        } else if (type === 'record') {
          await recordService.delete(user.uid, id);
        } else if (type === 'tag') {
          await tagService.delete(user.uid, id);
        }

        console.log(`[Data] ${type} deleted from Firebase`);
      }

      // 추적에서 제거
      setTimeout(() => {
        pendingLocalChanges.current.delete(id);
        console.log('[Data] Removed from pending (delete):', id);
      }, 1000);

    } catch (error) {
      console.error(`[Data] Delete ${type} error:`, error);
      pendingLocalChanges.current.delete(id);
      throw error;
    }
  }, [user, loadLocalData]);

  // 데이터 업데이트
  const updateData = useCallback(async (type, id, updates) => {
    try {
      // 로컬 변경 추적
      pendingLocalChanges.current.add(id);
      console.log('[Data] Added to pending (update):', id);

      // 로컬 업데이트 (Optimistic Update)
      let updatedData;
      if (type === 'todo') {
        updatedData = await todoStorage.update(id, updates);
      } else if (type === 'routine') {
        updatedData = await routineStorage.update(id, updates);
      } else if (type === 'record') {
        updatedData = await recordStorage.update(id, updates);
      } else if (type === 'tag') {
        updatedData = await tagStorage.update(id, updates);
      }

      // UI 즉시 업데이트
      await loadLocalData();

      console.log(`[Data] ${type} updated locally (optimistic update)`);

      // 백그라운드에서 Firebase 동기화
      if (user && updatedData) {
        pushToFirebase(type, updatedData, false);
      } else {
        pendingLocalChanges.current.delete(id);
      }

    } catch (error) {
      console.error(`[Data] Update ${type} error:`, error);
      pendingLocalChanges.current.delete(id);
      throw error;
    }
  }, [user, loadLocalData, pushToFirebase]);

  // 수동 동기화 (필요시)
  const refreshData = useCallback(async () => {
    if (user) {
      setSyncing(true);
      // 로컬 새로고침 (실시간 구독이 이미 동작 중)
      await loadLocalData();
      setSyncing(false);
    } else {
      await loadLocalData();
    }
  }, [user, loadLocalData]);

  const value = {
    todos,
    routines,
    records,
    tags,
    syncing,
    syncStatus,
    user,
    saveData,
    deleteData,
    updateData,
    refreshData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};