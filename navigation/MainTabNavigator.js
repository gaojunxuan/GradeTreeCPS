import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import AcademicsScreen from '../screens/AcademicsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AssignmentListScreen from '../screens/AssignmentListScreen';
import Colors from '../constants/Colors';
import AssignmentDetailScreen from '../screens/AssignmentDetailScreen';
import TranscriptScreen from '../screens/TranscriptScreen';
import ScheduleScreen from '../screens/ScheduleScreen';
import PaymentScreen from '../screens/PaymentScreen';
import SwitchStudentScreen from '../screens/SwitchStudentScreen';
import LabScreen from '../screens/LabScreen';



const AcademicsStack = createStackNavigator({
  Academics: AcademicsScreen,
  AssignmentList: AssignmentListScreen,
  AssignmentDetail: AssignmentDetailScreen,
  SwitchStudent: SwitchStudentScreen
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
  SwitchStudent: SwitchStudentScreen
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
  Transcript: TranscriptScreen,
  Schedule: ScheduleScreen,
  Payment: PaymentScreen,
  SwitchStudent: SwitchStudentScreen,
  Lab: LabScreen
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

export default createBottomTabNavigator({
  AcademicsStack,
  AttendanceStack,
  ProfileStack,
}, 
{
  tabBarOptions: {
    activeTintColor: Colors.tintColor
  },
});
