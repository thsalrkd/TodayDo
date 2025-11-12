import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BackButton from './src/components/BackButton';
import SignUpEmail from './src/screens/SignUp_Email';
import SignUpEmailCode from './src/screens/SignUp_EmailCode';
import SignUpPW from './src/screens/SignUp_PW.js';
import SignUpName from './src/screens/SignUp_Name.js';
import SignUpFin from './src/screens/SignUp_Fin.js';
import BottomNavigator from './src/navigation/BottomNavigator';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignUpEmail">
        <Stack.Screen
          name="SignUpEmail"
          component={SignUpEmail}
          options={({ navigation }) => ({
            title: '회원가입',
            headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
          })}
        />
        <Stack.Screen
          name="SignUpEmailCode"
          component={SignUpEmailCode}
          options={({ navigation }) => ({
            title: '회원가입',
            headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
          })}
        />
        <Stack.Screen
          name="SignUpPW"
          component={SignUpPW}
          options={({ navigation }) => ({
            title: '회원가입',
            headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
          })}
        />
        <Stack.Screen
          name="SignUpName"
          component={SignUpName}
          options={({ navigation }) => ({
            title: '회원가입',
            headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
          })}
        />
        <Stack.Screen
          name="SignUpFin"
          component={SignUpFin}
          options={({ navigation }) => ({
            title: '회원가입',
            headerLeft: () => <BackButton onPress={() => navigation.goBack()} />,
          })}
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
