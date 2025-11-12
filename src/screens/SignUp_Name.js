import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, TouchableWithoutFeedback } from 'react-native';

export default function SignUpName({ navigation }) {
  const [nickname, setNickname] = useState('');

  const totalSteps = 3; //회원가입 총 단계 
  const currentStep = 3; //회원가입 현재 단계
  const progressWidth = `${(currentStep / totalSteps) * 100}%`; //progressbar 진행 부분 길이

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: progressWidth}]}/>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>닉네임 입력</Text>
          <TextInput
            style={styles.input}
            placeholder="닉네임"
            placeholderTextColor="#bbb"
            value={nickname}
            onChangeText={setNickname}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, !nickname && styles.buttonDisabled]}
          disabled={!nickname}
          onPress={() => {
            navigation.navigate('SignUpFin', { nickname });
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
    marginTop: 30,
    paddingHorizontal: 15,
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
  button: {
    backgroundColor: '#4a90e2',
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
