//https://aspen.cps.edu/aspen/studentContextList.do?navkey=family.std.list
import React from 'react';
import { ScrollView, StyleSheet, Text, View, StatusBar, Alert, AsyncStorage, TextInput, TouchableOpacity } from 'react-native';
import { Updates } from 'expo';
import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import StringHelper from '../helpers/StringHelper';
import Networking from '../helpers/Networking';
import cio from 'cheerio-without-node-native';
import * as SecureStore from 'expo-secure-store';
import CryptoHelper from '../helpers/CryptoHelper';

export default class SwitchStudentScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const { params = { title: '' } } = navigation.state;
    return {
      title: params.title,
      headerStyle: {
        backgroundColor: Colors.tintColor,
        borderBottomColor:'transparent',
        borderBottomWidth: 0,
        shadowColor: 'transparent',
        elevation: 0
      },
      headerTintColor: 'white'
    };
  };
  
  constructor(props) {
    super(props);
    this.state = {
      token: '',
      students: []
    };
  }

  async componentDidMount() {
    try {
      var username = await SecureStore.getItemAsync('username');
      var cipher = await SecureStore.getItemAsync('password');
      if(username === null || cipher === null)
        Updates.reload();
      else {
        var password = CryptoHelper.decode(cipher);
        await this.loadData(username, password);                        
      }
    } catch (ex) {
      Alert.alert('Failed to load data. Please check your Internet connection and try again.');
    }
  }

  async loadData(username, password) {
    // headers defs
    const postHeaders = { 'Content-Type': 'multipart/form-data', 'User-Agent': StringHelper.getUserAgentString() };
    const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };
    var studentListResponse = await fetch('https://aspen.cps.edu/aspen/studentContextList.do?navkey=family.std.list', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    if(studentListResponse.status != 200 || await Networking.refreshCookie()) {
      await Networking.login(username, password);
      studentListResponse = await fetch('https://aspen.cps.edu/aspen/studentContextList.do?navkey=family.std.list', { method: 'GET', headers: uaHeaders, credentials: 'include' });
      await AsyncStorage.setItem('refreshCookie', 'false');
    }
    const data = await studentListResponse.text();
    this.setState({ token: data.match(/name="org.apache.struts.taglib.html.TOKEN" value="(.*?)"/)[1] });
    const $ = cio.load(data);
    const list = [];
    const elementsList = $('#dataGrid').find($('.listCell'));
    elementsList.each((index, element) => {
      list.push({ 
        id: $($(element).find($('td'))[1]).attr('id'),
        name: $($(element).find($('td'))[1]).text(),
        dob: $($(element).find($('td'))[2]).text(),
        grade: $($(element).find($('td'))[3]).text(),
        school: $($(element).find($('td'))[4]).text(),
      });
      this.setState({ students: list });
    })
  }

  render() {
    return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={styles.container}>
        <StatusBar barStyle='light-content' />
        <Text style={{
            paddingLeft: 32, paddingRight: 32, paddingTop: 48, fontSize: 32, fontWeight: 'bold', color: 'white'
          }}
        >
          Select Student
        </Text>
        <Text style={{
          marginTop: 24, marginLeft: 32, marginRight: 32, color: 'rgba(255,255,255,0.6)', fontSize: 16
        }}
        >
          Select a student to continue.
        </Text>
        <View style={{ marginTop: 32 }}>
          {this.state.students.map(item => {
            var name = StringHelper.removeSpaces(item.name);
            var dob = StringHelper.removeSpaces(item.dob);
            return (
              <View key={item.id}>
                <TouchableBounce style={{ 
                  marginLeft: 32, 
                  marginRight: 32, 
                  marginBottom: 12, 
                  backgroundColor: 'white', 
                  borderRadius: 12, 
                  paddingLeft: 12, 
                  paddingRight: 12, 
                  paddingTop: 16, 
                  paddingBottom: 16 
                }}
                onPress={async() => {
                  const postHeaders = { 'Content-Type': 'multipart/form-data', 'User-Agent': StringHelper.getUserAgentString() };
                  const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };
                  
                  const form = new FormData();
                  form.append('org.apache.struts.taglib.html.TOKEN', this.state.token);
                  form.append('userEvent', 2100);
                  form.append('userParam', item.id);

                  // get assignments list
                  const postResponse = await fetch('https://aspen.cps.edu/aspen/studentContextList.do', {
                    method: 'POST', body: form, headers: postHeaders, credentials: 'include'
                  });
                  if(postResponse.status !== 500)
                    Updates.reload();
                }}>
                  <Text style={{ fontSize: 18, color: Colors.tintColor }}>{name}</Text>
                  <Text style={{ fontSize: 12, color: 'grey', marginTop: 4 }}>{dob}</Text>
                </TouchableBounce>
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: Colors.tintColor,
  },
  input: {
    width: Layout.window.width - 64,
    borderBottomColor: 'white',
    borderBottomWidth: 1,
    marginTop: 24,
    marginBottom: 24,
    paddingBottom: 8,
    fontSize: 18,
    color: 'white',
  }
});