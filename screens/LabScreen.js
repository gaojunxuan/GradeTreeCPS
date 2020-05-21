import React from 'react';
import { ScrollView, StyleSheet, Text, View, Alert, AsyncStorage, TouchableOpacity, StatusBar, ActivityIndicator, TextInput } from 'react-native';
import cio from 'cheerio-without-node-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import Networking from '../helpers/Networking';
import StringHelper from '../helpers/StringHelper';
import Colors from '../constants/Colors';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';

export default class LabScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const { params = { title: 'Lab - DEV' } } = navigation.state;
    return {
      title: params.title,
      headerStyle: {
        backgroundColor: Colors.tintColor,
      },
      headerTintColor: 'white'
    };
  };

  constructor(props) {
    super(props);
    this.state = {
      testPassword: '',
      cipher: '',
      storedCipher: '',
      decoded: ''
    };
  }

  render() {
    return (
      <ScrollView style={styles.container}>
        <StatusBar barStyle='light-content' />
        <View style={{
          paddingBottom: 48, paddingLeft: 24, paddingRight: 24, paddingTop: 4
        }}
        >
          <View>
            <Text style={{ color: 'grey', fontSize: 14 }}>AES Encryption Test</Text>
            <TextInput style={{ fontSize: 18, marginTop: 8 }} onChangeText={text => this.setState({ testPassword: text })} value={this.state.testPassword}></TextInput>
            <TouchableOpacity onPress={()=>{
              var ciphertext = CryptoJS.AES.encrypt(this.state.testPassword, Expo.Constants.deviceId);
              this.setState({ cipher: ciphertext.toString() });
              Alert.alert(ciphertext.toString() + '\n\n' + Expo.Constants.deviceId + '\n\n' + CryptoJS.AES.decrypt(ciphertext, Expo.Constants.deviceId).toString(CryptoJS.enc.Utf8));
            }}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ fontSize: 18, marginTop: 12, color: Colors.tintColor }}>Encode</Text>
              </View>
            </TouchableOpacity>
            <TextInput style={{ fontSize: 18, marginTop: 12 }}>{this.state.cipher} device id {Expo.Constants.deviceId}</TextInput>
            <TouchableOpacity onPress={async()=>{
              await SecureStore.setItemAsync("testCipher", this.state.cipher);
            }}>
                <Text style={{ fontSize: 18, marginTop: 24, color: Colors.tintColor }}>Save</Text>              
            </TouchableOpacity>
            <TouchableOpacity onPress={async()=>{
              var stored = await SecureStore.getItemAsync('testCipher');
              this.setState({ storedCipher: stored.toString() });
              this.setState({ decoded: CryptoJS.AES.decrypt(stored, Expo.Constants.deviceId).toString(CryptoJS.enc.Utf8) })
            }}>
                <Text style={{ fontSize: 18, marginTop: 8, color: Colors.tintColor }}>Read</Text>              
            </TouchableOpacity>
            <TouchableOpacity onPress={async()=>{
              await SecureStore.deleteItemAsync('testCipher');
            }}>
                <Text style={{ fontSize: 18, marginTop: 8, color: Colors.tintColor }}>Delete</Text>              
            </TouchableOpacity>
            <Text style={{ fontSize: 14, marginTop: 12, color: 'grey' }}>Stored cipher</Text>            
            <Text style={{ fontSize: 18, marginTop: 8 }}>{this.state.storedCipher}</Text>  
            <Text style={{ fontSize: 14, marginTop: 12, color: 'grey' }}>Decoded</Text>            
            <Text style={{ fontSize: 18, marginTop: 8 }}>{this.state.decoded}</Text>            
          </View>
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: '#fff',
  },
});
