import React, { useState, useMemo } from 'react';
import { NoScaleText, NoScaleTextInput } from '../components/NoScaleText';
import { View, TouchableOpacity, StyleSheet, Image, ScrollView, Alert, Modal } from 'react-native';

import { useData } from'../core/context/dataContext';
import { useAuth } from '../core/context/authContext';
import userService from '../core/firebase/userService'
import { useUser } from '../core/context/userContext';

import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import ProgressBar from 'react-native-progress/Bar';

import defaultprofileimage from '../../assets/defaultprofileimage.png'
import levelbg from '../../assets/levelbg.png'

import { useNavigation } from '@react-navigation/native';

// 상단 헤더 컴포넌트, 프로필 이미지, 환영 메시지, 경험치바, 알림 버튼 표시
function HomeHeader({userProfile, authUser}) {
  const navigation = useNavigation();
  
  const nickname = userProfile?.nickname || authUser?.nickname || 'User';
  const title = userProfile?.title || '-';
  const currentExp = userProfile?.exp || 0;
  const maxExp = userProfile?.maxExp || 300;
  const userLevel = userProfile?.level || 1;
  
  const progress = maxExp > 0 ? currentExp / maxExp : 0;

  return (
    <View style={styles.header}>
      <View style={styles.profileArea}>
        <View style={styles.avatarContainer}>
           <View style={styles.avatarContainer}>
           <Image 
             source={defaultprofileimage} 
             style={styles.avatarImage}
             resizeMode="cover"
           />

           <View style={styles.levelBadgeContainer}>
              <Image 
                source={levelbg} 
                style={styles.levelBgImage} 
                resizeMode="contain"
              />
              <NoScaleText style={styles.levelText}>{userLevel}</NoScaleText>
           </View>
        </View>
        </View>

        <View style={styles.profileText}>
          <NoScaleText style={{fontSize: 10}}>{title || '-'}</NoScaleText>
          <View style={{flexDirection: 'row'}}>
            <NoScaleText style={{color: '#3A9CFF', fontSize: 15, }}>{nickname}</NoScaleText>
            <NoScaleText>님 환영합니다!</NoScaleText>
          </View>
          

          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <ProgressBar progress={progress} width={200} style={{marginRight: 5}} />
            <NoScaleText style={{fontSize: 9, color: "#8D8D8D"}}>{currentExp}/{maxExp}px</NoScaleText>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
        <Ionicons name="notifications-outline" size={24} color="#3A9CFF"/>
      </TouchableOpacity>
    </View>
  );
}

// 월별 캘린더 컴포넌트, react-native-calendars 라이브러리 사용
function MonthCalendar({selectedDate, onDateSelect, today, records}){
  const marked = useMemo(() => {
    const markedDates = {};

    const validRecords = Array.isArray(records) ? records : [];
    
    validRecords.forEach(item => {
      if (!item.date || !item.mood) return; 
      
      const dateKey = item.date.replace(/\./g, '-');

      let dotColor = 'transparent';
      switch (item.mood) {
        case 'happy': dotColor = '#6BCB0C'; break;   // 초록
        case 'neutral': dotColor = '#FFC107'; break; // 노랑
        case 'bad': dotColor = '#FF4D4D'; break;     // 빨강
      }

      if (!markedDates[dateKey]) {
        markedDates[dateKey] = { dots: [] };
      }

      if (!markedDates[dateKey].dots.find(d => d.color === dotColor)) {
         markedDates[dateKey].dots.push({ color: dotColor });
      }
    });

    if (selectedDate) {
      if (!markedDates[selectedDate]) {
        markedDates[selectedDate] = {};
      }
      markedDates[selectedDate].selected = true;
      markedDates[selectedDate].selectedColor = '#3A9CFF';
    }

    return markedDates;
  }, [selectedDate, records]);
  
  return(
    <View style={styles.calCard}>
      <Calendar
        markingType={'multi-dot'}
        markingDates={'custom'}
        markedDates={marked}
        onDayPress={(day => onDateSelect(day.dateString))}
        theme={{
          arrowColor: '#5D87FF',
          todayTextColor: '#5D87FF', 
        }}>

      </Calendar>
    </View>
  )
}

// 상태 바 컴포넌트, 완료한 일/이번 달 총 할 일
function StateList({ current, total }){
  const navigation = useNavigation();

  const safeCurrent = current || 0;
  const safeTotal = total || 0;
  
  // 진행률 계산(0~1 사이 값)
  const progress = safeTotal > 0 ? safeCurrent / safeTotal : 0;
  // 바의 너비 계산
  const widthStatus = `${progress * 97}%`;

  return(
    <View style={{marginBottom: 16}}>
      <View style={styles.statusArea}>
        <View style={[
            styles.progressBarFill, 
            { 
              width: widthStatus,
              opacity: safeCurrent === 0 ? 0 : 1 
            }
        ]} />

        <View style={styles.circle}>
           <NoScaleText style={styles.circleText}>
              <NoScaleText style={{fontSize: 13}}>{safeCurrent}</NoScaleText>
              <NoScaleText style={{fontSize: 12, color: '#666'}}>/{safeTotal}</NoScaleText>
           </NoScaleText>
        </View>

      </View>

      <View style={{alignItems: 'flex-end', marginHorizontal: 16}}>
        <TouchableOpacity style={{margin: 5, flexDirection: 'row', alignItems: 'center'}} onPress={() => navigation.navigate('Statistics')}>
          <NoScaleText style={{color: "#3A9CFF", fontSize: 12}}>통계 보러가기</NoScaleText>
          <Ionicons name="arrow-forward" size={10} color="#3A9CFF" style={{marginLeft: 2}}/>
        </TouchableOpacity>
      </View>
    </View>
  )
}

// 오늘 할 일 보기 컴포넌트, 오늘 날짜의 Todo, Routine을 보여줌
function TodayList({ data }){
  const renderSection = (title, items) => {
    if (!items || items.length === 0) return null;

    return (
      <View style={{marginBottom: 20}}>
        <NoScaleText style={styles.sectionTitle}>{title}</NoScaleText>
        <View style={styles.separator} />
        {items.map((item, index) => (
          <View key={index} style={styles.listItem}>
            {/* 완료 여부에 따른 색상 */}
            <View style={[
              styles.bulletPoint, 
              item.completed && { backgroundColor: '#A0A0A0' }
            ]} />
            
            {/* 완료 여부에 따른 텍스트 취소선 */}
            <NoScaleText style={[
              styles.listText,
              item.completed && { textDecorationLine: 'line-through', color: '#A0A0A0' }
            ]}>
                {item.title}
            </NoScaleText>
          </View>
        ))}
      </View>
    );
  };

  const isEmpty = (!data || (!data.todo.length && !data.routine.length));

  return(
    <View style={styles.card}>
      <NoScaleText style={styles.cardHeaderTitle}>Today</NoScaleText>
      <View style={{marginTop: 25, justifyContent: 'center'}}>
        {isEmpty ? (
          <NoScaleText style={{textAlign: 'center', color: '#ccc', marginVertical: 10}}>
            오늘 예정된 일정이 없습니다.
          </NoScaleText>
        ) : (
          <>
            {renderSection('Todo', data.todo)}
            {renderSection('Routine', data.routine)}
          </>
        )}
      </View>
    </View>
  )
}

// 상세 모달 컴포넌트, 캘린더 날짜 클릭 시 팝업, 할 일 체크/해제 및 저장
function DetailModal({ visible, date, onClose, data, onSave }) {
    const [localData, setLocalData] = useState(data);

    // 모달이 열리거나 데이터가 바뀔 때 로컬 상태 초기화
    React.useEffect(() => {
      if (visible) {
        setLocalData(JSON.parse(JSON.stringify(data)));
      }
    }, [visible]);

    // 체크박스 클릭 시 로컬 상태의 completed 값 토글
    const toggleLocal = (section, id) => {
      if (section === 'record') return;

      setLocalData(prev => ({
        ...prev,
        [section]: prev[section].map(item => 
          item.id === id ? { ...item, completed: !item.completed } : item
        )
      }));
    };

    // 확인 버튼 클릭 시 변경된 데이터 저장
    const handleConfirm = () => {
      onSave(localData);
    };

    // Todo, Routine, Record 리스트 렌더링 함수
    const renderDetailSection = (title, sectionKey, showIcons = false) => {
      const items = localData[sectionKey];

      if (!items || items.length === 0) return null;

      return (
        <View style={{marginBottom: 25}}>
          <NoScaleText style={styles.modalSectionTitle}>{title}</NoScaleText>
          <View style={styles.modalSeparator} />
          {items.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.modalListItem}
              activeOpacity={0.7}
              onPress={() => toggleLocal(sectionKey, item.id)}
            >
              <Ionicons 
                name={item.completed ? "checkmark-circle" : "checkmark-circle-outline"} 
                size={24} 
                color={item.completed ? "#3A9CFF" : "#E0E0E0"} 
              />
              <NoScaleText style={[
                styles.modalListText, 
                item.completed && { textDecorationLine: 'line-through', color: '#aaa' }
              ]}>
                {item.title}
              </NoScaleText>
              
              {showIcons && (
                <View style={{flexDirection: 'row', marginLeft: 'auto', alignItems:'center'}}>
                  {item.remind && (
                    <MaterialCommunityIcons 
                      name="bell" 
                      size={16} 
                      color={item.completed ? "#aaa" : "#3A9CFF"} 
                      style={{marginLeft: 6}} 
                    />
                  )}
                  {item.repeated && (
                    <MaterialCommunityIcons 
                      name="repeat" 
                      size={16} 
                      color={item.completed ? "#aaa" : "#3A9CFF"} 
                      style={{marginLeft: 6}} 
                    />
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      );
    };

    const isEmpty = (!localData.todo?.length && !localData.routine?.length && !localData.record?.length);

    return (
        <Modal
          animationType="fade"
          transparent={true}
          visible={visible}
          onRequestClose={onClose}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <NoScaleText style={styles.modalDateTitle}>{date}</NoScaleText>
              
              <ScrollView style={{marginTop: 10}}>
                {isEmpty ? (
                  <View style={{paddingVertical: 30, alignItems: 'center'}}>
                    <NoScaleText style={{color: '#999', fontSize: 14}}>
                      루틴/할 일을 추가해주세요.
                    </NoScaleText>
                  </View>
                ) : (
                  <>
                    {renderDetailSection('Todo', 'todo', true)}
                    {renderDetailSection('Routine', 'routine', true)}
                    {renderDetailSection('Record', 'record', false)}
                  </>
                )}
              </ScrollView>

              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <NoScaleText style={styles.cancelButtonText}>취소</NoScaleText>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                  <NoScaleText style={styles.confirmButtonText}>확인</NoScaleText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
    );
}

// 메인 화면 컴포넌트
export default function HomeScreen(){
  const [selectedDate, setSelectedDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const { todos, routines, records, updateData } = useData();
  const { user } = useAuth();
  const { userProfile } = useUser();

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const date = String(today.getDate()).padStart(2, '0');
  const todayStr = `${year}.${month}.${date}`;
  const today_date = `${year}-${month}-${date}`;

  // 날짜 선택 핸들러, 같은 날짜를 다시 누르면 모달 표시
  const dateSelect = (dateString) => {
    if(dateString === selectedDate){
      setModalVisible(true);
    }
    else{
      setSelectedDate(dateString);
    }
  };

  // 통계 계산, 이번 달 완료된 항목 수와 전체 항목 수 계산
  const { currentMonthCompleted, currentMonthTotal } = useMemo(() => {
    let total = 0;
    let completed = 0;

    const allItems = [...todos, ...routines];

    allItems.forEach(item => {
      if(!item.date) return;
      const dateStr = item.date.replace(/\./g, '-'); 
      const itemDate = new Date(dateStr);
      if (itemDate.getFullYear() === year && (itemDate.getMonth() + 1) === Number(month)) {
        total += 1;
        if (item.completed) completed += 1;
      }
    });
    return { currentMonthCompleted: completed, currentMonthTotal: total };
  }, [todos, routines, year, month]);

  // 오늘의 목록, 오늘 날짜에 해당하는 데이터 필터링
  const todayData = useMemo(() => {
    const targetDate = todayStr;
    return {
      todo: todos.filter(item => item.date === targetDate),
      routine: routines.filter(item => item.date === targetDate),
    };
  }, [todos, routines, todayStr]);

  // 모달용 데이터, 선택된 날짜의 데이터 필터링
  const filteredModalData = useMemo(() => {
    if(!selectedDate) return { todo: [], routine: [], record: [] };
    const targetDate = selectedDate.replace(/-/g, '.');
    
    const dailyRecord = records.find(item => item.date === targetDate);

    // 기록이 없으면 Record만 표시
    const recordItems = [
      { 
        id: `rec_text_${targetDate}`, 
        title: '오늘의 기록',
        completed: !!(dailyRecord && dailyRecord.content),
        content: dailyRecord?.content || dailyRecord?.text
      },
      { 
        id: `rec_mood_${targetDate}`, 
        title: '오늘의 색',
        completed: !!(dailyRecord && dailyRecord.mood),
        mood: dailyRecord?.mood 
      }
    ];

    return {
      todo: todos.filter(item => item.date === targetDate),
      routine: routines.filter(item => item.date === targetDate),
      record: recordItems,
    };
  }, [todos, routines, records, selectedDate]);

  // 모달에서 수정된 내용을 메인 데이터에 반영
  const handleSaveChanges = async (modifiedModalData) => {
    try {
      if (modifiedModalData.todo) {
        for (const item of modifiedModalData.todo) {
          const original = todos.find(t => t.id === item.id);
          if (original && !original.completed && item.completed) {
            if (user?.uid) await userService.incrementTodoStats(user.uid);
          }
          await updateData('todo', item.id, item);
        }
      }
      if (modifiedModalData.routine) {
        for (const item of modifiedModalData.routine) {
          const original = routines.find(r => r.id === item.id);
          
          if (original) {
            let expGiven = original.expGiven;
            let updatedSubs = item.subs || original.subs || [];

          if (item.completed && !expGiven) {
            if (user?.uid) await userService.incrementRoutineStats(user.uid);
            expGiven = true;
          }

          if (item.completed) {
            updatedSubs = updatedSubs.map(s => ({ ...s, completed: true }));
          } else {
            updatedSubs = updatedSubs.map(s => ({ ...s, completed: false }));
          }

          await updateData('routine', item.id, {
            ...item,
            subs: updatedSubs,
            expGiven: expGiven
          });
          }
        }
      }
      setModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "데이터를 저장하지 못했습니다.");
    }
  };

  return(
    <SafeAreaProvider>
      <SafeAreaView style={styles.allArea}>
        <ScrollView>
          <HomeHeader userProfile={userProfile} authUser={user}/>
          <MonthCalendar
            selectedDate={selectedDate} 
            onDateSelect={dateSelect}
            today={todayStr}
            records={records}
          />
          <StateList current={currentMonthCompleted} total={currentMonthTotal}/>
          <TodayList data={todayData}/>
      </ScrollView>

      <DetailModal 
        visible={modalVisible} 
        date={selectedDate.replace(/-/g, '.')}
        onClose={() => setModalVisible(false)}
        data={filteredModalData}
        onSave={handleSaveChanges}
        />
      </SafeAreaView>
    </SafeAreaProvider>
    
  );
}

// 스타일
const styles = StyleSheet.create({
  allArea: {
    flex: 0,
    backgroundColor: "#FFFFFF"
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 16,
    marginTop: 10
  },
  profileArea: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
  },
  levelBadgeContainer: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBgImage: {
    width: 24,
    height: 24,
    position: 'absolute',
  },
  levelText: {
    position: 'absolute',
    color: '#3A9CFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileImage: {
    padding: 10,
    marginRight: 10
  },
  profileText: {
    flexDirection: 'column',
    marginRight: 10
  },
  card: {
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    minHeight: 200,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    elevation: 3,
    shadowOpacity: 0.05,
    shadowRadius: 4
  },
  calCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    minHeight: 200,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    elevation: 3,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden'
  },
  statusArea: {
    backgroundColor: '#F9F9F9',
    borderRadius: 30,
    height: 60,
    marginHorizontal: 16,
    justifyContent: 'center',
    position: 'relative',

    shadowColor: '#000',
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  statusBar: {
    backgroundColor: '#3A9CFF',
    height: '100%',
    borderRadius: 20,
  },
  progressBarBackground: {
    height: 40,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
  },
  progressBarFill: {
    position: 'absolute',
    left: 5,
    top: 5,
    bottom: 5,
    backgroundColor: '#3A9CFF',
    borderRadius: 30,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    left: 10,
    zIndex: 1,
  },
  circleText: {
    color: "#333",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    maxHeight: '80%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalDateTitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#ddd',
    marginBottom: 10,
  },
  modalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalListText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  saveButtonContainer: {
      alignItems: 'flex-end',
      marginTop: 10
  },
  saveButton: {
      backgroundColor: '#3A9CFF',
      paddingVertical: 10,
      paddingHorizontal: 25,
      borderRadius: 20,
  },
  saveButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3A9CFF',
    marginRight: 10,
  },
  listText: {
    fontSize: 14,
    color: '#3A9CFF',
  },
  buttonRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 20,
      gap: 10,
  },
  cancelButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
      color: '#666',
      fontWeight: 'bold',
      fontSize: 14
  },
  confirmButton: {
      backgroundColor: '#3A9CFF',
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
  },
  confirmButtonText: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 14
  },
});