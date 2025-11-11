import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignUpEmail from './src/screens/SignUp_Email';
import NextScreen from './src/screens/NextScreen'; // 다음 화면 컴포넌트
import BottomNavigator from './src/navigation/BottomNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUpEmail">
        <Stack.Screen
          name="SignUpEmail"
          component={SignUpEmail}
          options={{ title: '회원가입 이메일' }}
        />
        <Stack.Screen
          name="NextScreen"
          component={NextScreen}
          options={{ title: '다음 화면' }}
        />
        <Stack.Screen
          name="Main"
          component={BottomNavigator}
          options={{gestureEnabled: false,headerShown: false}}
          
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
