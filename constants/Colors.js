import { Appearance, AppearanceProvider, useColorScheme } from 'react-native-appearance';
// let colorScheme = Appearance.getColorScheme();
let colorScheme = 'light';

const tintColor = '#23427C';
const darkTintColor = '#2d55a1';

export default {
  tintColor: (colorScheme == 'dark' ? darkTintColor : tintColor),
  tabIconDefault: '#ccc',
  tabIconSelected: tintColor,
  tabBar: '#fefefe',
  errorBackground: 'red',
  errorText: '#fff',
  warningBackground: '#EAEB5E',
  warningText: '#666804',
  noticeBackground: tintColor,
  noticeText: '#fff',
  green: 'limegreen',
  grey: 'lightgrey',
  yellow: 'yellowgreen',
  red: 'orange',
};
