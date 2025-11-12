import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';

export default function SignUpEmailCode({ navigation, route }) {
  const { email } = route.params;
  const [code, setCode] = useState('');

  const totalSteps = 3; //회원가입 총 단계 
  const currentStep = 1; //회원가입 현재 단계
  const progressWidth = `${(currentStep / totalSteps) * 100}%`; //progressbar 진행 부분 길이

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: progressWidth}]}/>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.emailText}>{email}로 인증코드를 전송했습니다.</Text>
          <Text style={styles.label}>이메일 인증코드 입력</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"     // 숫자 키보드 사용
            maxLength={5}              // 입력 가능한 최대 글자 수 (예: 6자리 코드)
            onChangeText={setCode}     // 입력값 상태 관리 (setCode는 useState의 상태 변경 함수)
            value={code}
          />
          <TouchableOpacity onPress={() => {
            //인증코드 재전송 코드 추가 예정
          }}>
            <Text style={styles.resend}>재전송</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, !code && styles.buttonDisabled]}
          disabled={!code}
          onPress={() => {
            // 이메일 유효성 검사 추가 가능
            // 다음 화면으로 이동 등
            navigation.navigate('SignUpPW', { code });
          }}
        >
          <Text style={styles.buttonText}>계속</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 30,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4a90e2',
    borderRadius: 2,
  },
  inputContainer: {
    marginBottom: 20,
    marginTop: 5,
    paddingHorizontal: 15,
  },
  emailText: {
    marginBottom: 8,
    color: '#8f8f8fff',
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    height: 40,
    fontSize: 14,
    color: '#333',
  },
  resend: {
    textAlign: 'right',
    color: '#4a90e2',
    marginTop: 10,
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    borderRadius: 60,
    alignItems: 'center',
    width: 80,
    alignSelf: 'center',
    marginTop: 25,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
