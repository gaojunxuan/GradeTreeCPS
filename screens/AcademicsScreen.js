import React from 'react';
import { ScrollView, StyleSheet, WebView, Text, View, Button, FlatList, ActivityIndicator, TouchableOpacity, StatusBar, Alert, AsyncStorage, ActionSheetIOS } from 'react-native';
import cio from 'cheerio-without-node-native';
import Networking from '../helpers/Networking';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import StringHelper from '../helpers/StringHelper';
import Colors from '../constants/Colors';
import * as SecureStore from 'expo-secure-store';
import CryptoHelper from '../helpers/CryptoHelper';
import { Updates } from 'expo';
import ModalPicker from '../components/ModalPicker';
import { Appearance, AppearanceProvider, useColorScheme } from 'react-native-appearance';

var self;
// let colorScheme = Appearance.getColorScheme();
let colorScheme = 'light';

export default class AcademicsScreen extends React.Component {
  static navigationOptions = {
    title: Platform.OS === 'ios' ? 'Academics' : '',
    headerStyle: {
        backgroundColor: Colors.tintColor,
    },
    headerTintColor: 'white',
    headerLeft: (
      <TouchableOpacity onPress={async()=>{
        if (Platform.OS === 'ios') {
          const options = self.state.terms.map(val => val.text);
          console.log(self.state.terms);
          options.push('Cancel');
          ActionSheetIOS.showActionSheetWithOptions({
            options,
            cancelButtonIndex: self.state.terms.length
          },
          async (buttonIndex) => {
            if (buttonIndex !== self.state.terms.length) {
               self.changeTerm(self.state.terms[buttonIndex].value)
            }
          },);
        }
        else if (self.termPicker !== null) { self.termPicker.setModalVisible(); }
      }}>
        <Text style={{ fontSize: 17, marginLeft: 18, color: 'white' }}>
            Switch Term
        </Text>
      </TouchableOpacity>
    ),
    headerRight: (
      <TouchableOpacity onPress={async()=>{
        if (self != null) {
          var username = await SecureStore.getItemAsync('username');
          var cipher = await SecureStore.getItemAsync('password');
          if(username === null || cipher === null)
            Updates.reload();
          else {
            var password = CryptoHelper.decode(cipher);
            try { 
              await self.loadData(username, password);                        
            } catch(ex) {
                Alert.alert('Failed to reload data. Please check your Internet connection and try again.');            
            }
          }
        }
      }}>
        <Ionicons name={Platform.OS === 'ios' ? 'ios-refresh' : 'md-refresh'} style={{ color: 'white', marginRight: 12 }} size={24}/>
      </TouchableOpacity>
    ),
  };
  constructor(props) {
    super(props);
    self = this;
    this.state = { token: '', result: '', classList: [], isLoading: true, terms: [], currentTerm: 'current' };
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
    }
    catch(ex) {
      Alert.alert('Failed to load data. Please check your Internet connection and try again.');            
    }
  }
  async loadData(username, password) {
    this.setState({ classList: [], isLoading: true });
    // login
    const headers = { 'Content-Type': 'multipart/form-data', 'User-Agent': StringHelper.getUserAgentString() };
    const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };
    var academicsResponse = await fetch('https://aspen.cps.edu/aspen/portalClassList.do?navkey=academics.classes.list', { method: 'GET', credentials: 'include', headers: uaHeaders });
    if(academicsResponse.status != 200 || await Networking.refreshCookie()) {
      await Networking.login(username, password);
      academicsResponse = await fetch('https://aspen.cps.edu/aspen/portalClassList.do?navkey=academics.classes.list', { method: 'GET', credentials: 'include', headers: uaHeaders });
      await AsyncStorage.setItem('refreshCookie', 'false');
    }
    // get academics page
    var data = await academicsResponse.text();
    var $ = cio.load(data);
    var list = [];
    $('#dataGrid').find($('.listCell')).each((index, element)=> {
      list.push({
        name: $($(element).find($('td'))[1]).text(),
        teacher: $($(element).find($('td'))[2]).text(),
        avg: $($(element).find($('td'))[6]).text(),
        code: $($(element).find($('td'))[1]).attr('id'),
      });
      console.log(this.removeLineBreaks($($(element).find($('td'))[1]).text()))
      this.setState({ classList: list, isLoading: false });
    });
    // load the term picker
    const terms = [];
    let termCounter = 0;
    $('select[name="termFilter"]').children().each((index, element) => {
      const text = $(element).text();
      const val = $(element).attr('value');
      const selectedStr = $(element).attr('selected');
      if (text !== 'All Terms') {
        const selected = (selectedStr !== null && selectedStr === 'selected');
        terms.push({ text, value: val, selected });
        this.setState({ terms: terms });
        if (selected) {
          this.setState({ currentTerm: val });
        }
        termCounter += 1;
      }
    });
    // open switch student screen if net selected yet
    if (await AsyncStorage.getItem('accountType') === 'parent') {
      var testResponse = await fetch('https://aspen.cps.edu/aspen/home.do', { method: 'GET', credentials: 'include', headers: uaHeaders });
      var $test = cio.load(await testResponse.text());
      var familiyTab = $test('.navTab[title="Family tab"]');
      if(familiyTab.attr('href').includes('studentContextList')) {
        this.props.navigation.replace('SwitchStudent');
      }
    }
  }
  async changeTerm(term) {
    const username = await SecureStore.getItemAsync('username');
    const cipher = await SecureStore.getItemAsync('password');
    const password = await CryptoHelper.decode(cipher);
    this.setState({ classList: [], isLoading: true });
    const postHeaders = { 'Content-Type': 'multipart/form-data', 'User-Agent': StringHelper.getUserAgentString() };
    const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };

    let classListGetResponse = await fetch('https://aspen.cps.edu/aspen/portalClassList.do?navkey=academics.classes.list', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    if (classListGetResponse.status !== 200) {
      await Networking.login(username, password);
      classListGetResponse = await fetch('https://aspen.cps.edu/aspen/portalClassList.do?navkey=academics.classes.list', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    }
    this.setState({ token: (await classListGetResponse.text()).match(/name="org.apache.struts.taglib.html.TOKEN" value="(.*?)"/)[1] });
    const changeTermForm = new FormData();
    changeTermForm.append('org.apache.struts.taglib.html.TOKEN', this.state.token);
    changeTermForm.append('userEvent', 950);
    changeTermForm.append('termFilter', term);
    changeTermForm.append('formFocusField', 'termFilter');
    // send POST req
    const classListPostResponse = await fetch('https://aspen.cps.edu/aspen/portalClassList.do', {
      method: 'POST', body: changeTermForm, headers: postHeaders, credentials: 'include'
    });
    // reload data
    try { 
      await self.loadData(username, password);                        
    } catch(ex) {
        Alert.alert('Failed to reload data. Please check your Internet connection and try again.');            
    }
    this.setState({ currentTerm: term });
  }
  removeLineBreaks(str) {
    return str.replace(/(\r\n|\n|\r)/gm, '').trim();
  }
render() {
    return (
      <ScrollView style={styles.container}>
          <StatusBar barStyle='light-content'/>
          <ActivityIndicator animating={this.state.isLoading} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
          </ActivityIndicator>
          <View style={{ paddingBottom: 48, paddingLeft: 24, paddingRight: 24, paddingTop: 4 }}>
            {this.state.classList.map(item => {
              var name = this.removeLineBreaks(item.name.toString());
              var avg = parseFloat(this.removeLineBreaks(item.avg.toString()));
              var teacher = this.removeLineBreaks(item.teacher.toString());
              var color = 'limegreen';
              if(avg < 90)
                color = 'yellowgreen';
              if(avg < 70)
                color = 'orange';
              if(isNaN(avg))
                color = StringHelper.getThemeColor(colorScheme, 'lightgrey');
              var gradeMark = 'A';
              if (avg < 90) {
                if (avg >= 80)
                  gradeMark = 'B';
                else {
                  if (avg >= 70)
                    gradeMark = 'C';
                  else {
                      if (avg >= 60)
                        gradeMark = 'D'
                      else
                        gradeMark = 'F'
                  }
                }
              }
              return (
                <View key={item.code} style={{ marginBottom: 24 }}>
                  <TouchableOpacity onPress={()=>{
                    this.props.navigation.push('AssignmentList', { code: item.code, name: name, term: this.state.currentTerm });
                  }}>
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ flexDirection: 'column', flex: 1.55 }}>
                        <Text style={{ fontSize: 18, color: StringHelper.getThemeColor(colorScheme, 'black')  }}>{name}</Text>
                        <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{teacher}</Text>
                      </View>
                      <View style={{ flex: 1, alignSelf: 'center', alignItems: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', height: 24, width: 80, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                          <Text style={{ fontSize: 16, color: 'white', flex: 1, alignSelf: 'center', textAlign: 'center' }}>{isNaN(avg) ? 'N/A' : avg + ' ' + gradeMark}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
            <ModalPicker
              ref={instance => this.termPicker = instance}
              data={this.state.terms}
              label='text'
              value='value'
              onValueChange={async (value) => {
                await this.changeTerm(value);
              }}
            />            
          </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 15,
    backgroundColor: colorScheme == 'light' ? '#fff' : '#000',
  },
});