import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import AcademicsScreen from '../screens/AcademicsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AssignmentListScreen from '../screens/AssignmentListScreen';
import Colors from '../constants/Colors';
import AssignmentDetailScreen from '../screens/AssignmentDetailScreen';


const HomeStack = createStackNavigator({
  Home: HomeScreen,
});

HomeStack.navigationOptions = {
  tabBarLabel: 'Home',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={
        Platform.OS === 'ios'
          ? `ios-information-circle${focused ? '' : '-outline'}`
          : 'md-information-circle'
      }
    />
  ),
};

const AcademicsStack = createStackNavigator({
  Academics: AcademicsScreen,
  AssignmentList: AssignmentListScreen,
  AssignmentDetail: AssignmentDetailScreen
});

AcademicsStack.navigationOptions = {
  tabBarLabel: 'Academics',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-school' : 'md-school'}
    />
  ),
};

const AttendanceStack = createStackNavigator({
  Attendance: AttendanceScreen,
});

AttendanceStack.navigationOptions = {
  tabBarLabel: 'Attendance',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-calendar' : 'md-calendar'}
    />
  ),
};

const ProfileStack = createStackNavigator({
  Profile: ProfileScreen,
});

ProfileStack.navigationOptions = {
  tabBarLabel: 'Profile',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-contact' : 'md-contact'}
    />
  ),
};

const SettingsStack = createStackNavigator({
  Settings: SettingsScreen,
});

SettingsStack.navigationOptions = {
  tabBarLabel: 'Settings',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-options' : 'md-options'}
    />
  ),
};

export default createBottomTabNavigator({
  AcademicsStack,
  AttendanceStack,
  ProfileStack,
}, 
{
  tabBarOptions: {
    activeTintColor: Colors.tintColor,
  },
});
