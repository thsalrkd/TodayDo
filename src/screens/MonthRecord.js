import React, { useState } from 'react';
import { NoScaleText, NoScaleTextInput } from '../components/NoScaleText';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

// 월별 기록 컴포넌트
export default function MonthRecord({ date, onPrev, onNext, allData, onDayPress }) {
  // 정렬 상태 관리, 드롭다운 표시 여부
  const [sortOrder, setSortOrder] = useState('최신순');
  const [sortVisible, setSortVisible] = useState(false);

  // 현재 보고 있는 연, 월 문자열 생성 (YYYY.MM)
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const monthString = `${year}.${String(month).padStart(2, '0')}`;

  // 현재 월 데이터 필터링
  const monthlyData = allData.filter(item => {
    const itemDate = new Date(item.date.replace(/\./g, '-'));
    return itemDate.getFullYear() === year && (itemDate.getMonth() + 1) === month;
  }).sort((a, b) => {
    if (sortOrder === '오래된순') {
      return a.date.localeCompare(b.date);  // 오름차순
    }
    return b.date.localeCompare(a.date);  // 내림차순
  });

  // 정렬 옵션 선택
  const itemSort = (mode) => {
    setSortOrder(mode);
    setSortVisible(false);
  };

  // 기분에 따른 점 색상
  const getMoodColor = (mood) => {
    if (!mood) return 'transparent';
    switch(mood) {
      case 'happy': return '#6BCB0C';
      case 'neutral': return '#FFA500';
      case 'bad': return '#FF4D4D';
      default: return 'transparent';
    }
  };

  // 리스트
  const renderItem = ({ item }) => {
    const content = item.content || '';

    return(
      <TouchableOpacity style={styles.listItem} onPress={() => onDayPress(item.date)} activeOpacity={0.7}>
      {content && content.trim() !== '' ? (
        <NoScaleText style={styles.itemText} numberOfLines={3} ellipsizeMode="tail">
          {content}
        </NoScaleText>
      ) : (
        <View style={{height: 20}} />
      )}
      <View style={styles.itemFooter}>
        <NoScaleText style={styles.itemDate}>{item.date}</NoScaleText>
        {item.mood && (
            <View style={[styles.moodDot, { backgroundColor: getMoodColor(item.mood) }]} />
        )}
      </View>
    </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthHeader}>
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={onPrev} style={styles.navIcon}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <NoScaleText style={styles.monthText}>{monthString}</NoScaleText>
          <TouchableOpacity onPress={onNext} style={styles.navIcon}>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {sortVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={() => setSortVisible(false)}
        />
      )}

      <View style={[styles.sortContainer, { zIndex: 1000 }]}>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={[styles.sortButton]} 
            onPress={() => setSortVisible(true)}
            activeOpacity={1}
          >
            <NoScaleText style={styles.sortText}>{sortOrder}</NoScaleText>
            <Ionicons name="chevron-down" size={12} color="#555" style={{marginLeft: 4}}/>
          </TouchableOpacity>

          {sortVisible && (
            <View style={styles.dropdownFull}>
              <TouchableOpacity 
                style={styles.dropdownHeader} 
                onPress={() => setSortVisible(false)}
              >
                <NoScaleText style={styles.sortText}>{sortOrder}</NoScaleText>
                <Ionicons name="chevron-up" size={12} color="#555" style={{marginLeft: 4}}/>
              </TouchableOpacity>

              <View>
                <TouchableOpacity 
                  style={[styles.dropdownItem, sortOrder === '최신순' && styles.selectedItem]} 
                  onPress={() => itemSort('최신순')}
                >
                  <NoScaleText style={[styles.sortText, sortOrder === '최신순']}>
                    최신순
                  </NoScaleText>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.dropdownItem, sortOrder === '오래된순' && styles.selectedItem]} 
                  onPress={() => itemSort('오래된순')}
                >
                  <NoScaleText style={[styles.sortText, sortOrder === '오래된순']}>
                    오래된순
                  </NoScaleText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={monthlyData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <NoScaleText style={styles.emptyText}>이번 달 기록이 없습니다.</NoScaleText>
          </View>
        }
      />
    </View>
  );
}

// 스타일
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  monthHeader: {
    alignItems: 'center',
    marginBottom: 10,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    color: '#333',
  },
  navIcon: {
    padding: 10,
  },
  sortContainer: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    marginBottom: 10,
    zIndex: 1000, 
  },
  dropdownContainer: {
    position: 'relative',
    minWidth: 90,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBEBEB', 
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  dropdownFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#EBEBEB',
    borderRadius: 15,
    overflow: 'hidden',

    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EBEBEB',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  selectedItem: {
    backgroundColor: 'white', 
  },
  sortText: {
    fontSize: 12,
    color: '#333',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'transparent', 
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listItem: {
    backgroundColor: '#EBEBEB',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  itemText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 15,
  },
  itemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDate: {
    fontSize: 12,
    color: '#888',
  },
  moodDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  emptyContainer: {
    marginTop: 200,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});