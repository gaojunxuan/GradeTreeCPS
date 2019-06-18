import React from 'react';
import { ScrollView, StyleSheet, Text, View, Alert, AsyncStorage, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import cio from 'cheerio-without-node-native';
import DateTimePicker from 'react-native-modal-datetime-picker';
import Networking from '../helpers/Networking';
import StringHelper from '../helpers/StringHelper';
import Colors from '../constants/Colors';

export default class ScheduleScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const { params = { title: 'Schedule' } } = navigation.state;
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
      schedule: [], isLoading: true, isDateTimePickerVisible: false, date: this.getToday(), day: ''
    };
  }

  async componentWillMount() {
    try {
      const username = await AsyncStorage.getItem('username');
      const password = await AsyncStorage.getItem('password');
      await this.loadData(username, password, this.state.date);
    } catch (ex) {
      Alert.alert('Failed to load data. Please check your Internet connection and try again.');
    }
  }

  getToday() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    return `${month}/${date}/${year}`;
  }


  showDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: true });
  };

  hideDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: false });
  };

  handleDatePicked = async (date) => {
    this.hideDateTimePicker();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const dateParsed = date.getDate();
    this.setState({ date: `${month}/${dateParsed}/${year}` });
    const username = await AsyncStorage.getItem('username');
    const password = await AsyncStorage.getItem('password');
    await this.loadData(username, password, this.state.date);
  };


  async loadData(username, password, date) {
    this.setState({ isLoading: true, schedule: [] });
    const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };
    var scheduleResponse = await fetch('https://aspen.cps.edu/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    scheduleResponse = await fetch(`https://aspen.cps.edu/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=${date}&userEvent=0`, { method: 'GET', headers: uaHeaders, credentials: 'include' });

    if (scheduleResponse.status !== 200 || await Networking.refreshCookie()) {
      await Networking.login(username, password);
      scheduleResponse = await fetch('https://aspen.cps.edu/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list', { method: 'GET', headers: uaHeaders, credentials: 'include' });
      scheduleResponse = await fetch(`https://aspen.cps.edu/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=${date}&userEvent=0`, { method: 'GET', headers: uaHeaders, credentials: 'include' });
      await AsyncStorage.setItem('refreshCookie', 'false');
    }
    const data = await scheduleResponse.text();
    const $ = cio.load(data);
    const list = [];
    const elementsList = $('.listHeader.headerLabelBackground').siblings();
    elementsList.each((index, element) => {
      const temp = $($(element).find('table')[1]).find('td');
      temp.each((i, inneritem) => {
        const className = $(inneritem).html();
        if (className.includes('<br>')) {
          list.push({
            period: $($(element).find('table')[0]).text(),
            detail: className,
          });
        }
      });
    });
    this.setState({ schedule: list, isLoading: false, day: StringHelper.removeSpaces($('.listHeader.headerLabelBackground').text()) });
  }

  render() {
    return (
      <ScrollView style={styles.container}>
        <StatusBar barStyle='light-content' />
        <ActivityIndicator
          animating={this.state.isLoading}
          style={{
            position: 'absolute', left: 0, right: 0, top: 128, bottom: 0
          }}
        />
        <View style={{
          paddingBottom: 48, paddingLeft: 24, paddingRight: 24, paddingTop: 4
        }}
        >
          <DateTimePicker
            isVisible={this.state.isDateTimePickerVisible}
            onConfirm={this.handleDatePicked}
            onCancel={this.hideDateTimePicker}
            date={new Date(this.state.date)}
          />
          <View>
            <Text style={{ color: 'grey', fontSize: 14 }}>Change date</Text>
            <TouchableOpacity onPress={this.showDateTimePicker}>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ fontSize: 18, marginTop: 8, color: Colors.tintColor }}>{this.state.date}</Text>
                <Text style={{
                  fontSize: 18, marginTop: 8, color: Colors.tintColor, marginLeft: 24
                }}
                >
                  {this.state.day}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {this.state.schedule.length === 0 ? <Text style={{ fontSize: 18, color: 'grey', marginTop: 24 }}>School is not in session on that date</Text> : <View />}
          <View style={{ marginTop: 24 }}>
            {this.state.schedule.map((item, index) => {
              const period = StringHelper.removeSpaces(item.period.toString()).split('\n')[0];
              const time = StringHelper.removeSpaces(item.period.toString()).split('\n')[1];
              const detail = StringHelper.removeSpaces(item.detail.toString()).split('<br>')[1];
              const color = Colors.tintColor;
              return (
                <View key={index} style={{ marginBottom: 24 }}>
                  <TouchableOpacity>
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ flexDirection: 'column', flex: 1 }}>
                        <Text style={{ fontSize: 18 }}>{detail}</Text>
                        <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{time}</Text>
                      </View>
                      <View style={{
                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'
                      }}
                      >
                        <View style={{
                          flexDirection: 'row', height: 24, width: 100, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginRight: 4
                        }}
                        >
                          <Text style={{
                            fontSize: 16, color: 'white', flex: 1, alignSelf: 'center', textAlign: 'center'
                          }}
                          >{period}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
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
