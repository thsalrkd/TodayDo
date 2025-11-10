import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SignUpEmail from './src/screens/SignUp_Email';
import BottomTabNavigator from './src/navigation/BottomNavigator';

const Stack = createStackNavigator();

export default function App() {
  return(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Main" component={BottomTabNavigator} options={{headerShown: false}}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}