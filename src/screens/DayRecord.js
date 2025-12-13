import React from 'react';
import { NoScaleText, NoScaleTextInput } from '../components/NoScaleText';
import { View, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// 일별 기록 컴포넌트
export default function DayRecord({ date, onPrev, onNext, data }) {
  // 날짜 포맷팅 (YYYY.MM.DD)
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateString = `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`;

  const recordContent = data ? (data.content || '') : '';

  // 기본 데이터를 받아 로컬 이미지 경로로 변환
  const getMoodIcon = (mood) => {
    if (!mood) return null;
    switch (mood) {
      case 'happy': return require('../images/happy.png');
      case 'neutral': return require('../images/neutral.png');
      case 'bad': return require('../images/bad.png');
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={onPrev} style={styles.navIcon}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <NoScaleText style={styles.dateText}>{dateString}</NoScaleText>
        <TouchableOpacity onPress={onNext} style={styles.navIcon}>
          <Ionicons name="chevron-forward" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          {data ? (
            // 데이터가 있을 경우
            <>
              {/* 텍스트 내용이 있을 때만 스크롤뷰 */ }
              {recordContent && recordContent.trim() !== '' && (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.textContainer}>
                  <NoScaleText style={styles.recordText}>{recordContent}</NoScaleText>
                </ScrollView>
              )}
              
              {/* 기분 데이터가 있을 때 */}
              {data.mood && (
                <View style={[
                    styles.moodContainer, 
                    (!recordContent || recordContent.trim() === '') && { flex: 1, justifyContent: 'center' }
                ]}>
                  <Image 
                    source={getMoodIcon(data.mood)} 
                    style={styles.moodIcon} 
                    resizeMode="contain"
                  />
                </View>
              )}
            </>
          ) : (
            // 데이터가 없을 경우
            <View style={styles.emptyContainer}>
              <NoScaleText style={styles.emptyText}>오늘의 기록을 시작해보세요.</NoScaleText>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// 스타일
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  dateNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    color: '#333',
  },
  navIcon: {
    padding: 10,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100, 
  },
  card: {
    width: '100%',
    height: '100%',
    padding: 30,
    justifyContent: 'space-between',
  },
  textContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordText: {
    fontSize: 15,
    lineHeight: 26,
    color: '#333',
    textAlign: 'center',
    padding: 5,
  },
  moodContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  moodIcon: {
    width: 60, 
    height: 60,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});