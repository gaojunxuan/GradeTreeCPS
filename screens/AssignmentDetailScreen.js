import React from 'react';
import { ScrollView, StyleSheet, WebView, Text, View, Button, FlatList, ActivityIndicator, TouchableOpacity, Alert, AsyncStorage } from 'react-native';
import { ExpoLinksView } from '@expo/samples';
import axios from 'axios';
import { HiddenWebView } from '../components/HiddenWebView';
import cio from 'cheerio-without-node-native';
import { NavigationEvents } from 'react-navigation';
import Networking from '../helpers/Networking';

var self;
export default class AssignmentDetailScreen extends React.Component {
    static navigationOptions = ({navigation}) => {
        const {params = {}} = navigation.state;
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
        this.state = { title: "Category", assignments: [], isAssignmentListLoading: true };
    }
    componentDidMount() {
        try {
            var cat = this.props.navigation.getParam("cat", "");
            var list = this.props.navigation.getParam("list", []);
            this.loadData(list, cat);
        }
        catch {
            Alert.alert("Failed to load data. Please check your Internet connection and try again.");            
        }
    }
    loadData(list, cat) {
        var filtered = list.filter(e => this.removeSpaces(e.cat) == cat);
        //console.log(filtered);
        var name = this.removeSpaces(cat);
        this.props.navigation.setParams({
            title: name
        });
        this.setState({ assignments: filtered, isAssignmentListLoading: false });
    }
    removeSpaces(str) { 
        return str.replace(/(\r\n|\n|\r)/gm, '').trim();
    }
    render() {
        return (
            <ScrollView style={styles.container}>              
                <Text style={{ paddingLeft: 24, paddingRight: 24, paddingTop: 12, fontSize: 24, fontWeight: 'bold' }}>Assignments</Text>
                {this.state.assignments.length == 0 ? <Text style={{ fontSize: 18, color: 'grey', marginLeft: 24, marginTop: 12 }}>Nothing here</Text> : <View></View>}
                <ActivityIndicator animating={this.state.isAssignmentListLoading} style={{ marginTop: 0 }}>
                </ActivityIndicator>
                <View style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 48 }}>
                    {this.state.assignments.map(item => {
                        var name = this.removeSpaces(item.name.toString());
                        var cat = this.removeSpaces(item.cat.toString());
                        var score = this.removeSpaces(item.score.toString()).replace(/\([^)]*\)/, '');
                        var s = 0;
                        var total = 0;
                        var percent = NaN;
                        var color = "limegreen";
                        if(score != "Ungraded") {
                            score = score.split('%')[1]
                            if(score != null) {
                                s = parseFloat(score.split('/')[0].trim())
                                total = parseFloat(score.split('/')[1].trim())
                                percent = s / total;
                                //console.log(percent);
                            }
                        }
                        else {
                            color = "lightgrey";
                        }

                        if(!isNaN(percent)) {
                            if(percent < 0.9)
                                color = "orange";
                            if(percent < 0.7)
                                color = "orangered";
                        }
                        else
                            color = "lightgrey";

                        return (
                            <View key={item.code} style={{ marginBottom: 12 }}>
                                <TouchableOpacity onPress={async()=>{
                                    try {
                                        const uaHeaders = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
                                        var code = item.code;
                                        var response = await fetch('https://aspen.cps.edu/aspen/portalAssignmentDetailPopup.do?prefix=GCD&context=academics.classes.list.gcd.detail&oid='+code, { method: 'GET', headers: uaHeaders, credentials: 'include' });
                                        if(response.status != 200) {
                                            var username = await AsyncStorage.getItem('username');
                                            var password = await AsyncStorage.getItem('password');
                                            await Networking.login(username, password);
                                            response = await fetch('https://aspen.cps.edu/aspen/portalAssignmentDetailPopup.do?prefix=GCD&context=academics.classes.list.gcd.detail&oid='+code, { method: 'GET', headers: uaHeaders, credentials: 'include' });
                                        }
                                        var data = await response.text();
                                        var $ = cio.load(data);
                                        var td = $('#collapsibleDiv0').find($('.detailValue'));
                                        var result = "";
                                        if($(td[6]).text() != "") {
                                            result += `High: ${$(td[6]).text()}\n`;
                                            result += `Low: ${$(td[7]).text()}\n`;
                                            result += `Median: ${$(td[8]).text()}\n`;
                                            result += `Average: ${$(td[9]).text()}\n`;
                                            Alert.alert("Statistics", result);
                                        }
                                    }
                                    catch(ex) {
                                        Alert.alert("Failed to load data. Please check your Internet connection and try again.");            
                                    }
                                }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{ flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                            <Text style={{ fontSize: 18 }}>{name}</Text>
                                            <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{cat}</Text>
                                        </View>
                                        <View style={{ flex: 1, alignSelf: 'center', alignItems: 'flex-end' }}>
                                            <TouchableOpacity onPress={()=>this.setState({ showPercent: !this.state.showPercent })}>
                                                <View style={{ flexDirection: 'row', height: 24, width: 120, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                                                    <Text style={{ fontSize: 16, color: 'white', flex: 1, alignSelf: 'center', textAlign: 'center' }}>{ this.state.showPercent ?  (percent * 100).toFixed(1) + '%' : score }</Text>
                                                </View>
                                            </TouchableOpacity>
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