import React, { useState, useRef } from 'react';
import { NoScaleText, NoScaleTextInput } from '../components/NoScaleText';
import { SafeAreaView, View, StyleSheet, TouchableOpacity, Alert, Animated, Modal, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback, Image, ScrollView } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DayRecord from './DayRecord';
import MonthRecord from './MonthRecord';
import { useData } from '../core/context/dataContext';
import { useAuth } from '../core/context/authContext';
import userService from '../core/firebase/userService';

export default function RecordScreen() {
  const { records, saveData, updateData, deleteData } = useData();
  const { user, updateProfile } = useAuth();
  const [viewMode, setViewMode] = useState('day'); 
  const [currentDate, setCurrentDate] = useState(new Date()); // 오늘 날짜 기본

  // 모달 작성, 수정 관련
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedMood, setSelectedMood] = useState(null); // happy, neutral, bad
  const [editingDate, setEditingDate] = useState(null);

  // 토글 스위치 애니메이션 값
  const slideAnim = useRef(new Animated.Value(0)).current;

  // 날짜 포맷 변환(YYYY.MM.DD)
  const getFormattedDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 현재 날짜 관련 변수
  const currentDayString = getFormattedDate(currentDate);
  const currentData = records.find(item => item.date === currentDayString);

  const todayString = getFormattedDate(new Date());
  const hasTodayRecord = records.some(item => item.date === todayString);

  // 날짜 이동 핸들러, 이전 날짜/달로 이동
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() - 1);
    } else {
      newDate.setMonth(currentDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  // 다음 날짜/달로 이동
  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'day') {
      newDate.setDate(currentDate.getDate() + 1);
    } else {
      newDate.setMonth(currentDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  // 작성/수정 버튼 핸들러
  const handleWrite = () => {
    // 월별 보기에서 + 버튼 클릭 시 오늘 날짜의 일별 보기로 이동 후 작성창 열기
    if (viewMode === 'month') {
      const today = new Date();
      setCurrentDate(today);
      setViewMode('day');
      toggleSwitch('day');
      
      setTimeout(() => {
        openEditor(todayString);
      }, 100);
    } else {
      openEditor(currentDayString);
    }
  };

  // 모달 열기 및 데이터 초기화
  const openEditor = (dateString) => {
    setEditingDate(dateString);
    const existingData = records.find(item => item.date === dateString);

    if (existingData) {
      // 수정 모드(이미 기록이 있으면)
      setInputText(existingData.content|| existingData.text || '');
      setSelectedMood(existingData.mood || null);
    } else {
      // 새 작성 모드
      setInputText('');
      setSelectedMood(null);
    }
    setIsModalVisible(true);
  };

  // 저장 버튼 클릭 시
  const handleSave = async () => {
    if (inputText.trim() === '' && selectedMood === null) {
      setIsModalVisible(false);
      return;
    }

    const targetDate = editingDate;
    const existingRecord = records.find(item => item.date === targetDate);

    try {
      if (existingRecord) {
        await updateData('record', existingRecord.id, {
          date: targetDate,
          content: inputText,
          mood: selectedMood
        });
      } else {
        await saveData('record', {
          date: targetDate,
          content: inputText,
          mood: selectedMood
        });

        if (user?.uid) {
          await userService.incrementRecordStats(user.uid);
        }
      }

      setTimeout(() => {
        setIsModalVisible(false);
      }, 100);
    } catch (e) {
      console.error(e);
      Alert.alert("오류", "저장에 실패했습니다.");
    }

    setIsModalVisible(false);
    Keyboard.dismiss();
  };

  // 삭제 버튼 클릭 시
  const handleDelete = () => {
    const existingData = records.find(item => item.date === editingDate);

    if (existingData) {
      // 저장된 기록이 있을 경우 삭제 확인
      Alert.alert("기록 삭제", "정말로 이 기록을 삭제하시겠습니까?", [
        { text: "취소", style: "cancel" },
        { 
          text: "삭제", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteData('record', existingData.id);
              setInputText('');
              setSelectedMood(null);
              setIsModalVisible(false);
            } catch (e) {
              console.error(e);
              Alert.alert("오류", "삭제에 실패했습니다.");
            }
            setIsModalVisible(false);
          }
        }
      ]);
    } else {
      // 작성 취소 시 학인
      if (inputText.trim() !== '') {
         Alert.alert("작성 취소", "작성 중인 내용을 삭제하시겠습니까?", [
            { text: "취소", style: "cancel" },
            { 
              text: "삭제", 
              style: "destructive", 
              onPress: () => {
                setIsModalVisible(false);
              }
            }
         ]);
      } else {
          setIsModalVisible(false);
      }
    }
  };

  // 모달 닫기 (뒤로가기, 배경 클릭 시)
  const handleCloseRequest = () => {
    const existingData = records.find(item => item.date === editingDate);
    let hasChanges = false;

    // 변경 사항이 있는지 확인
    if (existingData) {
      // 수정 모드
      const currentContent = existingData.content || existingData.text || '';
      if (currentContent !== inputText || existingData.mood !== selectedMood) {
        hasChanges = true;
      }
    } else {
      // 새 작성 모드
      if (inputText.trim() !== '' || selectedMood !== null) {
        hasChanges = true;
      }
    }

    // 변경 사항이 있으면 경고창
    if (hasChanges) {
      Alert.alert(
        "작성 중인 내용이 있습니다.",
        "나가시겠습니까?",
        [
          { text: "취소", style: 'cancel' },
          { 
            text: "나가기", 
            style: 'destructive', 
            onPress: () => {
                setIsModalVisible(false);
                Keyboard.dismiss();
            } 
          }
        ]
      );
    } else {
      setIsModalVisible(false);
      Keyboard.dismiss();
    }
  };

  // 기분 아이콘 이미지 매핑
  const getMoodImageSource = (mood) => {
    switch (mood) {
      case 'happy': return require('../images/happy.png');
      case 'neutral': return require('../images/neutral.png');
      case 'bad': return require('../images/bad.png');
      default: return require('../images/happy.png');
    }
  };

  // 월별 보기에서 날짜 클릭 시 이동
  const handleDayPress = (dateString) => {
    const parts = dateString.split('.');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    
    const newDate = new Date(year, month, day);
    
    setCurrentDate(newDate);
    setViewMode('day');
    toggleSwitch('day');
  };

  // 토글 스위치 애니메이션 실행
  const toggleSwitch = (mode) => {
    if (viewMode === mode && mode !== 'force') return;

    if (viewMode !== mode) setViewMode(mode);

    Animated.timing(slideAnim, {
      toValue: mode === 'day' ? 0 : 1,  // 0: 오늘, 1: 전체
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 50], 
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {viewMode === 'day' ? (
          <DayRecord 
            key={currentDayString}
            date={currentDate} 
            onPrev={handlePrev}
            onNext={handleNext}
            data={currentData} 
          />
        ) : (
          <MonthRecord 
            date={currentDate} 
            onPrev={handlePrev}
            onNext={handleNext}
            allData={records}
            onDayPress={handleDayPress}
          />
        )}
      </View>

      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.toggleContainer}
          activeOpacity={1}
          onPress={() => toggleSwitch(viewMode === 'day' ? 'month' : 'day')}
        >
          
          <Animated.View 
            style={[
              styles.slider, 
              { transform: [{ translateX }] }
            ]}
          />
          
          <View style={styles.toggleItem} >
            <NoScaleText style={[styles.toggleText, { color: viewMode === 'day' ? '#000' : '#888' }]}>
              오늘
            </NoScaleText>
          </View>

          <View style={styles.toggleItem} >
            <NoScaleText style={[styles.toggleText, { color: viewMode === 'month' ? '#000' : '#888' }]}>
              전체
            </NoScaleText>
          </View>
        </TouchableOpacity>

        {viewMode === 'day' ? (
          <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={handleWrite}>
            <Ionicons 
              name={currentData ? "pencil" : "add"} 
              size={currentData ? 28 : 40} 
              color="white" 
              style={{marginLeft: currentData ? 2 : 0}}
            />
          </TouchableOpacity>
        ) : (
          !hasTodayRecord && (
            <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={handleWrite}>
              <Ionicons name="add" size={40} color="white" />
            </TouchableOpacity>
          )
        )}
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseRequest}
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1}
            onPress={handleCloseRequest}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>

                <View style={styles.modalDivider} />

                <View style={styles.modalHeader}>
                  <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                    <NoScaleText style={styles.buttonText}>삭제</NoScaleText>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleSave} style={styles.doneButton}>
                    <NoScaleText style={styles.buttonText}>완료</NoScaleText>
                  </TouchableOpacity>
                </View>

                <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                >
                  <NoScaleText style={styles.questionText}>오늘 하루 어떠셨나요?</NoScaleText>
                  <View style={styles.separator} />
                  
                  <NoScaleTextInput
                    style={styles.textInput}
                    placeholder="일상을 기록해보세요."
                    placeholderTextColor="#AAA"
                    multiline={true}
                    value={inputText}
                    onChangeText={setInputText}
                    textAlignVertical="top"
                  />

                  <NoScaleText style={styles.questionText}>오늘의 색</NoScaleText>
                  <View style={styles.separator} />
                  <View style={styles.moodSelector}>
                    {['bad', 'neutral', 'happy'].map((mood) => (
                      <TouchableOpacity 
                        key={mood} 
                        onPress={() => {
                            if (selectedMood === mood) setSelectedMood(null);
                            else setSelectedMood(mood);
                        }}
                        activeOpacity={0.7}
                        style={styles.moodItem}
                      >
                        <Image 
                          source={getMoodImageSource(mood)}
                          style={[
                            styles.moodImage, 
                            selectedMood === mood ? styles.moodSelected : styles.moodUnselected
                          ]}
                          resizeMode="contain"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
              </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// 스타일
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
  },
  toggleContainer: {
    width: 100,
    height: 40,
    backgroundColor: '#E5E5EA',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative', 
  },
  slider: {
    position: 'absolute',
    width: 48,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
    top: 2,
  },
  toggleItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3A9CFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingBottom: 40,
    minHeight: '70%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    paddingVertical: 9,
    paddingHorizontal: 25,
    backgroundColor: '#CDCDCD',
    borderRadius: 30,
  },
  doneButton: {
    paddingVertical: 9,
    paddingHorizontal: 25,
    backgroundColor: '#3A9CFF',
    borderRadius: 30,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalDivider: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  questionText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
    marginTop: 10,
    marginLeft: 20,
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#E7E7E7',
    borderRadius: 30,
    padding: 20,
    height: 150,
    fontSize: 15,
    color: '#333',
    marginBottom: 20,
  },
  moodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginBottom: 20,
  },
  moodItem: {
    justifyContent: 'center',
    alignSelf: 'center',
  },
  moodImage: {
    width: 50,
    height: 50,
    opacity: 0.4,
  },
  moodSelected: {
    width: 60,
    height: 60,
    opacity: 1,
  },
  moodUnselected: {
    opacity: 0.3
  },
  separator: {
    height: 1,
    backgroundColor: '#BBBBBB',
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 30
  },
});