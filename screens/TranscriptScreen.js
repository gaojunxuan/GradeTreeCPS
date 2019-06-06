import React from 'react';
import { ScrollView, StyleSheet, WebView, Text, View, Button, FlatList, Image, Alert, AsyncStorage, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import { ExpoLinksView } from '@expo/samples';
import { HiddenWebView } from '../components/HiddenWebView';
import cio from 'cheerio-without-node-native';
import Barcode from 'react-native-barcode-builder';
import { Updates } from 'expo';
import Networking from '../helpers/Networking';
import { Icon } from 'expo';

var self
export default class TranscriptScreen extends React.Component {
    static navigationOptions = ({navigation}) => {
        const {params = { title: "Transcript" }} = navigation.state;
        return {
            title: params.title,
            headerStyle: {
                backgroundColor: '#274378',
            },
            headerTintColor: 'white'
        };
    };
    constructor(props) {
        super(props);
        self = this;
        this.state = { token: "", transcript: [], isLoading: true }
    }
    async componentWillMount() {
        try {
            var username = await AsyncStorage.getItem('username');
            var password = await AsyncStorage.getItem('password');
            await this.loadData(username, password);
        }
        catch(ex) {
            Alert.alert("Failed to load data. Please check your Internet connection and try again.");            
        }
    }
    async loadData(username, password) {
        const headers = { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
        const uaHeaders = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
        var transcriptResponse = await fetch("https://aspen.cps.edu/aspen/creditSummary.do?navkey=myInfo.credits.summary", { method: 'GET', headers: uaHeaders, credentials: 'include' });
        if(transcriptResponse.status != 200 || await Networking.refreshCookie()) {
            await Networking.login(username, password);
            transcriptResponse = await fetch("https://aspen.cps.edu/aspen/creditSummary.do?navkey=myInfo.credits.summary", { method: 'GET', headers: uaHeaders, credentials: 'include' });
            await AsyncStorage.setItem("refreshCookie", 'false');
        }
        var data = await transcriptResponse.text();
        var $ = cio.load(data);
        var list = [];
        var elementsList = $('#dataGrid').find($('.listCell'));
        elementsList.each((index, element)=> {
            if(index != elementsList.length - 1) {
                list.push({
                    schoolYear: $($(element).find($('td'))[0]).text(),
                    gradeLevel: $($(element).find($('td'))[1]).text(),
                    credit: $($(element).find($('td'))[2]).text(),
                    adjCredit: $($(element).find($('td'))[3]).text(),
                    totalCredit: $($(element).find($('td'))[4]).text(),
                });
            }
            else {
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
    removeSpaces(str) {
        return str.replace(/(\r\n|\n|\r)/gm, '').trim();
    }
    render() {
        return (
            <ScrollView style={styles.container}>
                <StatusBar barStyle='light-content'/>
                <ActivityIndicator animating={this.state.isLoading} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
                </ActivityIndicator>
                <View style={{ paddingBottom: 48, paddingLeft: 24, paddingRight: 24, paddingTop: 4 }}>
                    {this.state.transcript.map((item, index) => {
                        var year = this.removeSpaces(item.schoolYear.toString());
                        var gradeLevel = this.removeSpaces(item.gradeLevel.toString());
                        var credit = this.removeSpaces(item.totalCredit.toString());
                        var color = "#274378";
                        
                        return (
                            <View key={index} style={{ marginBottom: 24 }}>
                                <TouchableOpacity>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{ flexDirection: 'column', flex: 1 }}>
                                            <Text style={{ fontSize: 18 }}>{gradeLevel == 'Total' ? '' : 'Grade '}{gradeLevel}</Text>
                                            <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{year}</Text>
                                        </View>
                                        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                                            <View style={{ flexDirection: 'row', height: 24, width: 100, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                                <Text style={{ fontSize: 16, color: 'white', flex: 1, alignSelf: 'center', textAlign: 'center' }}>Credit: {parseFloat(credit).toFixed(1)}</Text>
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