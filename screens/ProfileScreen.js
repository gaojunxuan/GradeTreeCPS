import React from 'react';
import { ScrollView, StyleSheet, WebView, Text, View, Button, FlatList, Image, Alert, AsyncStorage, TouchableOpacity } from 'react-native';
import { ExpoLinksView } from '@expo/samples';
import axios from 'axios';
import { HiddenWebView } from '../components/HiddenWebView';
import cio from 'cheerio-without-node-native';
import Barcode from 'react-native-barcode-builder';
import { Updates } from 'expo';
import Networking from '../helpers/Networking';
import { Icon } from 'expo';
import { Platform } from 'react-native';

var self;
export default class ProfileScreen extends React.Component {
    static navigationOptions = {
        title: 'Profile',
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
        headerLeft: (
            <TouchableOpacity onPress={async()=>{
                Alert.alert("About", "This app is developed and designed by Kevin Gao, a student from Jones College Prep, who has no affiliation with CPS and Follett Corporation. If you have any question or feedback on this app, please contact me through email. \n\nThis app is made possible by React Native, Expo and other open source projects.")
            }}>
                <Icon.Ionicons name={Platform.OS === 'ios' ? 'ios-information-circle-outline' : 'md-information-circle-outline'} style={{ color: 'white', marginLeft: 16 }} size={24}/>
            </TouchableOpacity>
        )
    };
    constructor(props) {
        super(props);
        self = this;
        this.state = { token: "", profilePageToken: "", result: "", profile: { first: "First", middle: "M", last: "Last", school: "", grade: "", graduation: "", id: "00000000" }, photo: "https://cps.edu/SiteCollectionImages/2018-Home-Page-Redesign/cps-logo-200.png" };
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
        // headers defs
        const headers = { 'Content-Type': 'multipart/form-data', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
        const uaHeaders = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };

        // load profile page
        var profileResponse = await fetch("https://aspen.cps.edu/aspen/portalStudentDetail.do?navkey=myInfo.details.detail", { method: 'GET', headers: uaHeaders, credentials: 'include' });
        if(profileResponse.status != 200 || await Networking.refreshCookie()) {
            await Networking.login(username, password);
            profileResponse = await fetch("https://aspen.cps.edu/aspen/portalStudentDetail.do?navkey=myInfo.details.detail", { method: 'GET', headers: uaHeaders, credentials: 'include' });
            await AsyncStorage.setItem("refreshCookie", 'false');
        }
        var data = await profileResponse.text();
        var $ = cio.load(data);
        var dict = { first: "", middle: "", last: "", school: "", grade: "", graduation: "", id: "" };
        dict.first = $('span[id="propertyValue(relStdPsnOid_psnNameFirst)-span"]').text();
        dict.middle = $('span[id="propertyValue(relStdPsnOid_psnNameMiddle)-span"]').text();
        dict.last = $('span[id="propertyValue(relStdPsnOid_psnNameLast)-span"]').text();
        dict.id = $('span[id="propertyValue(stdIDLocal)-span"]').text();
        dict.school = $('span[id="propertyValue(relStdSklOid_sklSchoolName)-span"]').text();
        dict.grade = $('span[id="propertyValue(stdGradeLevel)-span"]').text();
        dict.graduation = $('span[id="propertyValue(stdYog)-span"]').text();
        this.setState({ profilePageToken: data.match(/name="org.apache.struts.taglib.html.TOKEN" value="(.*?)"/)[1] });
        this.setState({ profile: dict });
        // load id photo
        var profileForm = new FormData();
        profileForm.append("userEvent", 2030);
        profileForm.append("userParam", 3);
        profileForm.append("deploymentId", "aspen");
        profileForm.append("org.apache.struts.taglib.html.TOKEN", this.state.profilePageToken);
        var postResponseProfile = await fetch("https://aspen.cps.edu/aspen/portalStudentDetail.do", { method: 'POST', redirect: "follow", body: profileForm, headers: headers, credentials: 'include' });
        var data = await postResponseProfile.text();
        var $ = cio.load(data);
        var photo = 'https://aspen.cps.edu/aspen/' + $('span[id="propertyValue(relStdPsnOid_psnPhoOIDPrim)-span"] > img').attr('src');
        this.setState({ photo: photo });
    }
    
    render() {
        var name = "";
        name += this.state.profile.last;
        name += ", " + this.state.profile.first;
        name += " " + this.state.profile.middle;
        return (
            <ScrollView style={styles.container}>
                <View style={{ flexDirection: 'row', marginLeft: 24, marginRight: 24, marginTop: 12 }}>
                    <Image style={{ width: 64, height: 64, borderRadius: 32 }} source={{ uri: this.state.photo }}></Image>
                    <View style={{ marginLeft: 20, marginTop: 4, flex: 1 }}>
                        <View style={{ flexDirection: 'row', marginRight: 24 }}>
                            <Text style={styles.nameHeader}>{name}</Text>
                        </View>
                        <Text style={{ marginTop: 4, color: 'grey' }}>ID#: {this.state.profile.id}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', marginLeft: 16, marginTop: 12 }}>
                    <Barcode height={48} value={this.state.profile.id} format="CODE39" />
                </View>
                <View style={{ marginTop: 24, marginLeft: 24, marginRight: 24 }}>
                    <Text style={styles.header}>School</Text>
                    <Text style={{ fontSize: 16 }}>{this.state.profile.school}</Text>
                </View>
                <View style={{ marginTop: 12, marginLeft: 24, marginRight: 24 }}>
                    <Text style={styles.header}>Grade Level</Text>
                    <Text style={{ fontSize: 16 }}>{this.state.profile.grade}</Text>
                </View>
                <View style={{ marginTop: 12, marginLeft: 24, marginRight: 24 }}>
                    <Text style={styles.header}>Year of Graduation</Text>
                    <Text style={{ fontSize: 16 }}>{this.state.profile.graduation}</Text>
                </View>
                <TouchableOpacity style={{ marginLeft: 24, marginTop: 32 }} onPress={() => this.props.navigation.push('Transcript')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon.Ionicons name='ios-paper' size={26} color='#274378'></Icon.Ionicons>
                        <Text style={{ marginLeft: 12, fontSize: 18, color: '#274378' }}>Transcript</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginLeft: 24, marginTop: 24 }} onPress={() => this.props.navigation.push('Schedule')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon.Ionicons name='ios-calendar' size={26} color='#274378'></Icon.Ionicons>
                        <Text style={{ marginLeft: 12, fontSize: 18, color: '#274378' }}>Schedule</Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginBottom: 64 }} onPress={async() => {
                    await AsyncStorage.removeItem('username');
                    await AsyncStorage.removeItem('password');
                    await AsyncStorage.setItem('refreshCookie', 'true');
                    Updates.reload();
                }}>
                    <View style={{ marginLeft: 24, marginRight: 24, marginTop: 48, backgroundColor: '#E5E5EA', borderRadius: 10 }}>
                        <Text style={{ color: '#FF3B30', fontSize: 18, textAlign: 'center', marginTop: 12, marginBottom: 12 }}>Logout</Text>
                    </View>
                </TouchableOpacity>
            </ScrollView>
        )
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 15,
      backgroundColor: '#fff',
    },
    nameHeader: {
        fontWeight: 'bold',
        fontSize: 24,
        lineHeight: 24
    },
    header: {
        color: 'grey'
    }
});