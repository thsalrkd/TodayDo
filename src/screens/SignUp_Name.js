import React, { useState } from 'react';
import { NoScaleText, NoScaleTextInput } from '../components/NoScaleText';
import { View, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback, Alert } from 'react-native';
import { useAuth } from '../core/context/authContext';

export default function SignUpName({ navigation, route }) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const { completeSignUp } = useAuth();

  const totalSteps = 3; // 회원가입 총 단계
  const currentStep = 3; // 현재 단계
  const progressWidth = `${(currentStep / totalSteps) * 100}%`; // 진행바 길이

  const handleComplete = async () => {
    if (!nickname.trim()) {
      Alert.alert('입력 오류', '닉네임을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 3단계: 닉네임 설정 및 회원가입 완료
      const userData = await completeSignUp(nickname.trim());
      
      // 성공 시 완료 화면으로 이동
      navigation.navigate('SignUpFin', { nickname: userData.nickname });
    } catch (error) {
      Alert.alert('회원가입 실패', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.container}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          <View style={styles.inputContainer}>
            <NoScaleText style={styles.label}>닉네임 입력</NoScaleText>
            <NoScaleTextInput
              style={styles.input}
              placeholder="닉네임"
              placeholderTextColor="#bbb"
              value={nickname}
              onChangeText={setNickname}
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            style={[styles.button, (!nickname.trim() || loading) && styles.buttonDisabled]}
            disabled={!nickname.trim() || loading}
            onPress={handleComplete}
          >
            <NoScaleText style={styles.buttonText}>
              {loading ? '처리중...' : '계속'}
            </NoScaleText>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 40,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  progressBar: {
    height: 3,
    backgroundColor: '#ddd',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 30,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3A9CFF',
    borderRadius: 2,
  },
  inputContainer: {
    marginBottom: 20,
    marginTop: 30,
    paddingHorizontal: 15,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#3A9CFF',
    paddingVertical: 12,
    borderRadius: 60,
    alignItems: 'center',
    width: 80,
    alignSelf: 'center',
    marginTop: 50,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});