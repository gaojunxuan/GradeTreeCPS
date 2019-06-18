import React from 'react';
import { ScrollView, StyleSheet, WebView, Text, View, Button, FlatList, ActivityIndicator, TouchableOpacity, StatusBar, Alert, AsyncStorage } from 'react-native';
import cio from 'cheerio-without-node-native';
import Networking from '../helpers/Networking';
import { Icon } from 'expo';
import { Platform } from 'react-native';
import StringHelper from '../helpers/StringHelper';
import Colors from '../constants/Colors';

var self;
export default class AcademicsScreen extends React.Component {
  static navigationOptions = {
    title: 'Academics',
    headerStyle: {
        backgroundColor: Colors.tintColor,
    },
    headerTintColor: 'white',
    headerRight: (
      <TouchableOpacity onPress={async()=>{
        if (self != null) {
          var username = await AsyncStorage.getItem('username');
          var password = await AsyncStorage.getItem('password');
          try { 
            await self.loadData(username, password);                        
          } catch(ex) {
              Alert.alert('Failed to reload data. Please check your Internet connection and try again.');            
          }
        }
      }}>
        <Icon.Ionicons name={Platform.OS === 'ios' ? 'ios-refresh' : 'md-refresh'} style={{ color: 'white', marginRight: 12 }} size={24}/>
      </TouchableOpacity>
    ),
  };
  constructor(props) {
    super(props);
    self = this;
    this.state = { token: '', result: '', classList: [], isLoading: true };
  }
  async componentWillMount() {
    try {
      var username = await AsyncStorage.getItem('username');
      var password = await AsyncStorage.getItem('password');
      await this.loadData(username, password);
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
      this.setState({ classList: list, isLoading: false });
    });
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
                color = 'orange';
              if(avg < 70)
                color = 'orangered';
              if(isNaN(avg))
                color = 'lightgrey';
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
                    this.props.navigation.push('AssignmentList', { code: item.code, name: name });
                  }}>
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ flexDirection: 'column', flex: 1.5 }}>
                        <Text style={{ fontSize: 18 }}>{name}</Text>
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
  }
});