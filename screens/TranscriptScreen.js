import React from 'react';
import { ScrollView, StyleSheet, Text, View, Alert, AsyncStorage, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import cio from 'cheerio-without-node-native';
import Networking from '../helpers/Networking';
import StringHelper from '../helpers/StringHelper';
import Colors from '../constants/Colors';

export default class TranscriptScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const { params = { title: 'Transcript' } } = navigation.state;
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
    this.state = { transcript: [], isLoading: true };
  }

  async componentWillMount() {
    try {
      const username = await AsyncStorage.getItem('username');
      const password = await AsyncStorage.getItem('password');
      await this.loadData(username, password);
    } catch (ex) {
      Alert.alert('Failed to load data. Please check your Internet connection and try again.');
    }
  }

  async loadData(username, password) {
    const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };
    let transcriptResponse = await fetch('https://aspen.cps.edu/aspen/creditSummary.do?navkey=myInfo.credits.summary', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    if (transcriptResponse.status !== 200 || await Networking.refreshCookie()) {
      await Networking.login(username, password);
      transcriptResponse = await fetch('https://aspen.cps.edu/aspen/creditSummary.do?navkey=myInfo.credits.summary', { method: 'GET', headers: uaHeaders, credentials: 'include' });
      await AsyncStorage.setItem('refreshCookie', 'false');
    }
    const data = await transcriptResponse.text();
    const $ = cio.load(data);
    const list = [];
    const elementsList = $('#dataGrid').find($('.listCell'));
    elementsList.each((index, element) => {
      if (index !== elementsList.length - 1) {
        list.push({
          schoolYear: $($(element).find($('td'))[0]).text(),
          gradeLevel: $($(element).find($('td'))[1]).text(),
          credit: $($(element).find($('td'))[2]).text(),
          adjCredit: $($(element).find($('td'))[3]).text(),
          totalCredit: $($(element).find($('td'))[4]).text(),
        });
      } else {
        list.push({
          schoolYear: 'N/A',
          gradeLevel: 'Total',
          credit: $($(element).find($('td'))[1]).text(),
          adjCredit: $($(element).find($('td'))[2]).text(),
          totalCredit: $($(element).find($('td'))[3]).text(),
        });
      }
      this.setState({ transcript: list, isLoading: false });
    });
  }

    render() {
      return (
        <ScrollView style={styles.container}>
          <StatusBar barStyle='light-content' />
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
            {this.state.transcript.map((item, index) => {
              const year = StringHelper.removeLineBreaks(item.schoolYear.toString());
              const gradeLevel = StringHelper.removeLineBreaks(item.gradeLevel.toString());
              const credit = StringHelper.removeLineBreaks(item.totalCredit.toString());
              const color = Colors.tintColor;

              return (
                <View key={index} style={{ marginBottom: 24 }}>
                  <TouchableOpacity>
                    <View style={{ flexDirection: 'row' }}>
                      <View style={{ flexDirection: 'column', flex: 1 }}>
                        <Text style={{ fontSize: 18 }}>
                          {gradeLevel === 'Total' ? '' : 'Grade '}
                          {gradeLevel}
                        </Text>
                        <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{year}</Text>
                      </View>
                      <View style={{
                        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'
                      }}
                      >
                        <View style={{
                          flexDirection: 'row', height: 24, width: 100, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderRadius: 8
                        }}
                        >
                          <Text style={{
                            fontSize: 16, color: 'white', flex: 1, alignSelf: 'center', textAlign: 'center'
                          }}
                          >
                            Credit:
                            {' '}
                            {parseFloat(credit).toFixed(1)}
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
