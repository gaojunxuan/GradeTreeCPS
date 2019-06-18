import React from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert, AsyncStorage, Platform } from 'react-native';
import { Icon } from 'expo';
import cio from 'cheerio-without-node-native';
import Networking from '../helpers/Networking';
import StringHelper from '../helpers/StringHelper';
import Colors from '../constants/Colors';

let self;
export default class AttendanceScreen extends React.Component {
  static navigationOptions = {
    title: 'Attendance',
    headerStyle: {
      backgroundColor: Colors.tintColor,
    },
    headerTintColor: 'white',
    headerRight: (
      <TouchableOpacity onPress={async () => {
        if (self != null) {
          const username = await AsyncStorage.getItem('username');
          const password = await AsyncStorage.getItem('password');
          try {
            await self.loadData(username, password);
          } catch (ex) {
            Alert.alert('Failed to reload data. Please check your Internet connection and try again.');
          }
        }
      }}
      >
        <Icon.Ionicons name={Platform.OS === 'ios' ? 'ios-refresh' : 'md-refresh'} style={{ color: 'white', marginRight: 12 }} size={24} />
      </TouchableOpacity>
    ),
  };

  constructor(props) {
    super(props);
    self = this;
    this.state = { attendance: [], isLoading: true };
  }

  async componentWillMount() {
    try {
      const username = await AsyncStorage.getItem('username');
      const password = await AsyncStorage.getItem('password');
      await this.loadData(username, password);
    } catch {
      Alert.alert('Failed to load data. Please check your Internet connection and try again.');
    }
  }

  async loadData(username, password) {
    this.setState({ attendance: [], isLoading: true });
    const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };

    // get attendance page
    let attendanceResponse = await fetch('https://aspen.cps.edu/aspen/studentAttendanceList.do?navkey=myInfo.att.list', { method: 'GET', credentials: 'include', headers: uaHeaders });
    if (attendanceResponse.status !== 200 || await Networking.refreshCookie()) {
      await Networking.login(username, password);
      attendanceResponse = await fetch('https://aspen.cps.edu/aspen/studentAttendanceList.do?navkey=myInfo.att.list', { method: 'GET', credentials: 'include', headers: uaHeaders });
      await AsyncStorage.setItem('refreshCookie', 'false');
    }

    const data = await attendanceResponse.text();
    const $ = cio.load(data);
    const list = [];
    $('#dataGrid').find($('.listCell')).each((index, element) => {
      list.push({
        date: $($(element).find($('td'))[1]).text(),
        code: $($(element).find($('td'))[2]).text(),
        id: $($(element).find($('td'))[1]).attr('id'),
      });
      this.setState({ attendance: list, isLoading: false });
    });
  }

  resolveAttendanceCode(code) {
    if (code === 'A') { return 'Absent Unexcused'; }
    if (code === 'A-E') { return 'Absent Excused'; }
    if (code === 'A HD') { return 'Absent Unexcused Half Day'; }
    if (code === 'A-E HD') { return 'Absent Excused Half Day'; }
    if (code === 'A-E HH') { return 'Home/Hospital'; }
    if (code === 'A-E MEDX') { return 'Medical Exclusion'; }
    if (code === 'A-E RHOL') { return 'Religious Holiday'; }
    if (code === 'A-E SUS') { return 'Suspension'; }
    if (code === 'ISS') { return 'In-School Suspension'; }
    if (code === 'P') { return 'Present'; }
    if (code === 'SF') { return 'School Function'; }
    if (code === 'T') { return 'Tardy'; }
    return 'Unknown';
  }

  resolveDayAbsent(code) {
    if (code.includes('HD') || code.includes('HH')) { return 0.5; }
    if (code.includes('ISS') || code.includes('P') || code.includes('SF') || code.includes('T')) { return 0; }
    return 1;
  }

  render() {
    return (
      <ScrollView style={styles.container}>
        <ActivityIndicator
          animating={this.state.isLoading}
          style={{
            position: 'absolute', left: 0, right: 0, top: 0, bottom: 0
          }}
        />
        <View style={{
          paddingBottom: 48, paddingLeft: 24, paddingRight: 24, paddingTop: 4
        }}
        >
          {this.state.attendance.map((item) => {
            const date = StringHelper.removeLineBreaks(item.date.toString());
            const code = StringHelper.removeLineBreaks(item.code.toString());
            const description = this.resolveAttendanceCode(code);
            const days = this.resolveDayAbsent(code);
            let color = 'orange';
            if (days === 0) { color = 'limegreen'; }
            return (
              <View key={item.id} style={{ marginBottom: 24 }}>
                <TouchableOpacity>
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ flexDirection: 'column' }}>
                      <Text style={{ fontSize: 18 }}>{date}</Text>
                      <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{description}</Text>
                    </View>
                    <View style={{ flex: 1, alignSelf: 'center', alignItems: 'flex-end' }}>
                      <View style={{
                        flexDirection: 'row', height: 24, width: 80, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderRadius: 8
                      }}
                      >
                        <Text style={{
                          fontSize: 16, color: 'white', flex: 1, alignSelf: 'center', textAlign: 'center'
                        }}
                        >
                          {days}
                          {' '}
                          Day
                        </Text>
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
  },
});
