import React from 'react';
import { Asset } from 'expo-asset';
import * as Font from 'expo-font';
import { Platform, StatusBar, StyleSheet, View, AsyncStorage } from 'react-native';
import { AppLoading } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import AppNavigator from './navigation/AppNavigator';
import LoginScreen from './screens/LoginScreen';
import * as SecureStore from 'expo-secure-store';
import { Appearance, AppearanceProvider, useColorScheme } from 'react-native-appearance';

// let colorScheme = Appearance.getColorScheme();
let colorScheme = 'light';

export default class App extends React.Component {
  state = {
    isLoadingComplete: false,
    username: "",
    password: "",
  };
  async componentDidMount() {
    await this.loadLoginInfoAsync();
  }
  async loadLoginInfoAsync() {
    // delete the previously saved, unencrypted password
    await AsyncStorage.removeItem('username');
    await AsyncStorage.removeItem('password');
    // check the Keychain storage
    var username = await SecureStore.getItemAsync('username');
    var password = await SecureStore.getItemAsync('password');
    if(username != null && password != null)
      this.setState({ username: username, password: password });
  }
  render() {
    if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
      return (
        <AppLoading
          startAsync={this._loadResourcesAsync}
          onError={this._handleLoadingError}
          onFinish={this._handleFinishLoading}
        />
      );
    } else {
      return (
        <View style={styles.container}>
          {Platform.OS === 'ios' && <StatusBar barStyle="light-content" />}
          {this.state.username != "" ? <AppNavigator theme={colorScheme}/> : <LoginScreen/>}
        </View>
      );
    }
  }

  _loadResourcesAsync = async () => {
    return Promise.all([
      Asset.loadAsync([
        require('./assets/images/robot-dev.png'),
        require('./assets/images/robot-prod.png'),
      ]),
      Font.loadAsync({
        // This is the font that we are using for our tab bar
        ...Ionicons.font,
        // We include SpaceMono because we use it in HomeScreen.js. Feel free
        // to remove this if you are not using it in your app
        'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
      }),
    ]);
  };

  _handleLoadingError = error => {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

  _handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
