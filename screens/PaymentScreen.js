import React from 'react';
import { ScrollView, StyleSheet, Text, View, Alert, AsyncStorage, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import cio from 'cheerio-without-node-native';
import Networking from '../helpers/Networking';
import StringHelper from '../helpers/StringHelper';
import Colors from '../constants/Colors';
import * as SecureStore from 'expo-secure-store';
import CryptoHelper from '../helpers/CryptoHelper';
import { Updates } from 'expo';

export default class PaymentScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const { params = { title: 'Payment' } } = navigation.state;
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
    this.state = { payment: [], isLoading: true, isEmpty: false };
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
    const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };
    let paymentResponse = await fetch('https://aspen.cps.edu/aspen/studentFeesContextList.do?navkey=family.std.list.studentfees', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    if (paymentResponse.status !== 200 || await Networking.refreshCookie()) {
      await Networking.login(username, password);
      paymentResponse = await fetch('https://aspen.cps.edu/aspen/studentFeesContextList.do?navkey=family.std.list.studentfees', { method: 'GET', headers: uaHeaders, credentials: 'include' });
      await AsyncStorage.setItem('refreshCookie', 'false');
    }
    const data = await paymentResponse.text();
    const $ = cio.load(data);
    const list = [];
    const elementsList = $('#dataGrid').find($('.listCell'));
    elementsList.each((index, element) => {
      if (index === 0) {
        let text = $(element).text();
        if (text.toString().includes('No matching records')) {
          this.setState({ isEmpty: true });
        }
      }
      list.push({
        id: $($(element).find($('td'))[1]).attr('id'),
        date: $($(element).find($('td'))[1]).text(),
        type: $($(element).find($('td'))[3]).text(),
        description: $($(element).find($('td'))[5]).text(),
        comment: $($(element).find($('td'))[6]).text(),
        amt: $($(element).find($('td'))[9]).text(),
      });
      this.setState({ payment: list, isLoading: false });
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
          {this.state.isEmpty ? (
            <Text style={{
              fontSize: 18, color: 'grey', marginTop: 20
            }}
            >
            No due payments
            </Text>
              
          ) : (
            <View>
              {this.state.payment.map((item, index) => {
                const date = StringHelper.removeLineBreaks(item.date.toString());
                const description = StringHelper.removeLineBreaks(item.description.toString());
                const amt = StringHelper.removeLineBreaks(item.amt.toString());
                const color = Colors.tintColor;

                return (
                  <View key={item.id} style={{ marginBottom: 24 }}>
                    <TouchableOpacity>
                      <View style={{ flexDirection: 'row' }}>
                        <View style={{ flexDirection: 'column', flex: 1 }}>
                          <Text style={{ fontSize: 18 }}>
                            {description}
                          </Text>
                          <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{date}</Text>
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
                              {amt}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
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
