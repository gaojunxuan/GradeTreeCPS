import React from 'react';
import { ScrollView, StyleSheet, WebView, Text, View, Button, FlatList, ActivityIndicator, TouchableOpacity, Alert, AsyncStorage } from 'react-native';
import { Icon } from 'expo';
import { HiddenWebView } from '../components/HiddenWebView';
import cio from 'cheerio-without-node-native';
import Networking from '../helpers/Networking';
import { Platform } from 'react-native';

var self;
export default class AttendanceScreen extends React.Component {
    static navigationOptions = {
        title: 'Attendance',
        headerStyle: {
            backgroundColor: '#274378',
        },
        headerTintColor: 'white',
        headerRight: (
            <TouchableOpacity onPress={async()=>{
                if(self != null) {
                    var username = await AsyncStorage.getItem('username');
                    var password = await AsyncStorage.getItem('password');
                    try {
                        await self.loadData(username, password);
                    }
                    catch(ex) {
                        Alert.alert("Failed to reload data. Please check your Internet connection and try again.");            
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
        this.state = { token: "", attendance: [], isLoading: true };
    }
    async componentWillMount() {
        try {
            var username = await AsyncStorage.getItem('username');
            var password = await AsyncStorage.getItem('password');
            await this.loadData(username, password);
        }
        catch {
            Alert.alert("Failed to load data. Please check your Internet connection and try again.");            
        }
    }
    async loadData(username, password) {
        this.setState({ attendance: [], isLoading: true });
        // login
        const headers = { 'Content-Type': 'multipart/form-data', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
        const uaHeaders = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
        
        // get attendance page
        var attendanceResponse = await fetch("https://aspen.cps.edu/aspen/studentAttendanceList.do?navkey=myInfo.att.list", { method: 'GET', credentials: 'include', headers: uaHeaders });
        if(attendanceResponse.status != 200 || await Networking.refreshCookie()) {
            await Networking.login(username, password);
            attendanceResponse = await fetch("https://aspen.cps.edu/aspen/studentAttendanceList.do?navkey=myInfo.att.list", { method: 'GET', credentials: 'include', headers: uaHeaders });
            await AsyncStorage.setItem("refreshCookie", 'false');
        }

        var data = await attendanceResponse.text();
        var $ = cio.load(data);
        var list = [];
        $('#dataGrid').find($('.listCell')).each((index, element)=> {
            list.push({
                date: $($(element).find($('td'))[1]).text(),
                code: $($(element).find($('td'))[2]).text(),
                id: $($(element).find($('td'))[1]).attr('id'),
            });
            this.setState({ attendance: list, isLoading: false });
        });
    }
    removeSpaces(str) {
        return str.replace(/(\r\n|\n|\r)/gm, '').trim();
    }
    resolveAttendanceCode(code) {
        if(code == "A")
            return "Absent Unexcused";
        if(code == "A-E")
            return "Absent Excused";
        if(code == "A HD")
            return "Absent Unexcused Half Day";
        if(code == "A-E HD")
            return "Absent Excused Half Day";
        if(code == "A-E HH")
            return "Home/Hospital";
        if(code == "A-E MEDX")
            return "Medical Exclusion";
        if(code == "A-E RHOL")
            return "Religious Holiday";
        if(code == "A-E SUS")
            return "Suspension";
        if(code == "ISS")
            return "In-School Suspension";
        if(code == "P")
            return "Present";
        if(code == "SF")
            return "School Function";
        if(code == "T")
            return "Tardy";
        return "Unkown";
    }
    resolveDayAbsent(code) {
        if(code.includes("HD") || code.includes("HH"))
            return 0.5;
        else if (code.includes("ISS") || code.includes("P") || code.includes("SF") || code.includes("T"))
            return 0;
        else
            return 1;
    }
    render() {
        return (
            <ScrollView style={styles.container}>
                <ActivityIndicator animating={this.state.isLoading} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
                </ActivityIndicator>
                <View style={{ paddingBottom: 48, paddingLeft: 24, paddingRight: 24, paddingTop: 4 }}>
                    {this.state.attendance.map(item => {
                        var date = this.removeSpaces(item.date.toString());
                        var code = this.removeSpaces(item.code.toString());
                        var description = this.resolveAttendanceCode(code);
                        var days = this.resolveDayAbsent(code);
                        var color = "orange";
                        if(days == 0)
                            color = "limegreen";
                        return (
                            <View key={item.id} style={{ marginBottom: 24 }}>
                                <TouchableOpacity>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{ flexDirection: 'column' }}>
                                            <Text style={{ fontSize: 18 }}>{date}</Text>
                                            <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{description}</Text>
                                        </View>
                                        <View style={{ flex: 1, alignSelf: 'center', alignItems: 'flex-end' }}>
                                            <View style={{ flexDirection: 'row', height: 24, width: 80, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                                <Text style={{ fontSize: 16, color: 'white', flex: 1, alignSelf: 'center', textAlign: 'center' }}>{days} Day</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )
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
  