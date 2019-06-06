import React from 'react';
import { ScrollView, StyleSheet, WebView, Text, View, Button, FlatList, Image, Alert, AsyncStorage, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { ExpoLinksView } from '@expo/samples';
import { HiddenWebView } from '../components/HiddenWebView';
import cio from 'cheerio-without-node-native';
import Barcode from 'react-native-barcode-builder';
import { Updates } from 'expo';
import Networking from '../helpers/Networking';
import { Icon } from 'expo';
import DateTimePicker from "react-native-modal-datetime-picker";

var self
export default class ScheduleScreen extends React.Component {
    static navigationOptions = ({navigation}) => {
        const {params = { title: "Schedule" }} = navigation.state;
        return {
            title: params.title,
            headerStyle: {
                backgroundColor: '#274378',
            },
            headerTintColor: 'white'
        };
    };
    getToday() {
        var today = new Date();
        var year = today.getFullYear();
        var month = today.getMonth() + 1;
        var date = today.getDate();
        return `${month}/${date}/${year}`
    }
    constructor(props) {
        super(props);
        self = this;
        this.state = { token: "", schedule: [], isLoading: true, isDateTimePickerVisible: false, date: this.getToday(), day: '' }
    }
    async componentWillMount() {
        try {
            var username = await AsyncStorage.getItem('username');
            var password = await AsyncStorage.getItem('password');
            await this.loadData(username, password, this.state.date);
        }
        catch(ex) {
            Alert.alert("Failed to load data. Please check your Internet connection and try again.");            
        }
    }
    async loadData(username, password, date) {
        this.setState({ isLoading: true, schedule: [] })
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
        const uaHeaders = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
        var scheduleResponse = await fetch("https://aspen.cps.edu/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list", { method: 'GET', headers: uaHeaders, credentials: 'include' });
        scheduleResponse = await fetch(`https://aspen.cps.edu/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=${date}&userEvent=0`, { method: 'GET', headers: uaHeaders, credentials: 'include' });

        if(scheduleResponse.status != 200 || await Networking.refreshCookie()) {
            await Networking.login(username, password);
            scheduleResponse = await fetch("https://aspen.cps.edu/aspen/studentScheduleContextList.do?navkey=myInfo.sch.list", { method: 'GET', headers: uaHeaders, credentials: 'include' });
            scheduleResponse = await fetch(`https://aspen.cps.edu/aspen/studentScheduleMatrix.do?navkey=myInfo.sch.matrix&termOid=&schoolOid=null&k8Mode=null&viewDate=${date}&userEvent=0`, { method: 'GET', headers: uaHeaders, credentials: 'include' });
            await AsyncStorage.setItem("refreshCookie", 'false');
        }
        var data = await scheduleResponse.text();
        var $ = cio.load(data);
        var list = [];
        var elementsList = $('.listHeader.headerLabelBackground').siblings();
        //$($('.listGridFixed'), 'tbody').find($('tr'));
        //console.log($('.listGridFixed'));
        //Alert.alert($('div.listGridFixed > table').text().toString());
        elementsList.each((index, element)=> {
            var temp = $($(element).find('table')[1]).find('td');
            temp.each((i, inneritem) => {
                var className = $(inneritem).html();
                if(className.includes('<br>')) {
                    list.push({
                        period: $($(element).find('table')[0]).text(),
                        detail: className,
                    });
                }
            })
        });
        this.setState({ schedule: list, isLoading: false, day: this.removeSpaces($('.listHeader.headerLabelBackground').text()) });
    }
    removeSpaces(str) {
        return str.replace(/(\r\n|\n|\r)/gm, '').replace('                                                              ', '\n').trim();
    }

    showDateTimePicker = () => {
        this.setState({ isDateTimePickerVisible: true });
    };
     
    hideDateTimePicker = () => {
        this.setState({ isDateTimePickerVisible: false });
    };
    
    handleDatePicked = async date => {
        this.hideDateTimePicker();
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var date = date.getDate();
        this.setState({ date: `${month}/${date}/${year}` });
        var username = await AsyncStorage.getItem('username');
        var password = await AsyncStorage.getItem('password');
        await this.loadData(username, password, this.state.date);
    };

    render() {
        return (
            <ScrollView style={styles.container}>
                <StatusBar barStyle='light-content'/>
                <ActivityIndicator animating={this.state.isLoading} style={{ position: 'absolute', left: 0, right: 0, top: 128, bottom: 0 }}>
                </ActivityIndicator>
                <View style={{ paddingBottom: 48, paddingLeft: 24, paddingRight: 24, paddingTop: 4 }}>
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
                                <Text style={{ fontSize: 18, marginTop: 8, color: '#274378' }}>{this.state.date}</Text>
                                <Text style={{ fontSize: 18, marginTop: 8, color: '#274378', marginLeft: 24 }}>{this.state.day}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                    {this.state.schedule.length == 0 ? <Text style={{ fontSize: 18, color: 'grey', marginTop: 24 }}>School is not in session on that date</Text> : <View></View>}
                    <View style={{ marginTop: 24 }}>
                    {this.state.schedule.map((item, index) => {
                        var period = this.removeSpaces(item.period.toString()).split('\n')[0];
                        var time = this.removeSpaces(item.period.toString()).split('\n')[1];
                        var detail = this.removeSpaces(item.detail.toString()).split('<br>')[1];
                        var color = "#274378";
                        return (
                            <View key={index} style={{ marginBottom: 24 }}>
                                <TouchableOpacity>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{ flexDirection: 'column', flex: 1 }}>
                                            <Text style={{ fontSize: 18 }}>{detail}</Text>
                                            <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{time}</Text>
                                        </View>
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                                            <View style={{ flexDirection: 'row', height: 24, width: 100, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginRight: 4 }}>
                                                <Text style={{ fontSize: 16, color: 'white', flex: 1, alignSelf: 'center', textAlign: 'center' }}>{period}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )
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