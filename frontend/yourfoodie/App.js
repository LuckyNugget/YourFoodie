import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatScreen from './screen/ChatScreen';
import MapScreen from './screen/MapScreen';

const Stack = createNativeStackNavigator();

export default function App(){
    return(
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Chat">
                <Stack.Screen name="Chat" component={ChatScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Map' }} />
            </Stack.Navigator>
        </NavigationContainer>
    )
}