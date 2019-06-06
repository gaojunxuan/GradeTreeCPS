import React from 'react';
import { ScrollView, StyleSheet, WebView, Text, View, Button, FlatList, ActivityIndicator, TouchableOpacity, StatusBar, Alert, AsyncStorage, TextInput } from 'react-native';
import { Updates } from 'expo';
import { HiddenWebView } from '../components/HiddenWebView';
import cio from 'cheerio-without-node-native';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import TouchableBounce from 'react-native/Libraries/Components/Touchable/TouchableBounce';

export default class LoginScreen extends React.Component {
    constructor(props) {
        super(props);
        this.state = { token: "", username: "", password: "", usernameFocused: false, passwordFocused: false };
    }
    render() {
        return (
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={styles.container}>
                <StatusBar barStyle="light-content"></StatusBar>
                <Text style={{ paddingLeft: 32, paddingRight: 32, paddingTop: 48, fontSize: 32, fontWeight: 'bold', color: 'white' }}>Login</Text>
                <Text style={{ marginTop: 24, marginLeft: 32, marginRight: 32, color: 'rgba(255,255,255,0.6)', fontSize: 16 }}>Login with your CPS username and password. Parent and teacher (staff) accounts are not supported.</Text>
                <View style={[styles.container, { flex: 1, marginLeft: 32, marginTop: 12 }]}>
                    <TextInput 
                        style={[styles.input, { borderBottomColor: this.state.usernameFocused ? 'white' : 'rgba(255,255,255,0.6)' }]} 
                        placeholderTextColor= {this.state.usernameFocused ? 'white' : 'rgba(255,255,255,0.6)'}
                        placeholder="Username"
                        onFocus={()=>this.setState({ usernameFocused: true })}
                        onBlur={()=>this.setState({ usernameFocused: false })}
                        textContentType='username'
                        clearButtonMode='while-editing'
                        onSubmitEditing={()=>{
                            this._passwordInput.focus();
                        }}
                        onChangeText={(text) => this.setState({username: text})}
                        value={this.state.username}
                    >
                    </TextInput>
                    <TextInput
                        ref={component => this._passwordInput = component}
                        style={[styles.input, { borderBottomColor: this.state.passwordFocused ? 'white' : 'rgba(255,255,255,0.6)' }]} 
                        placeholderTextColor= {this.state.passwordFocused ? 'white' : 'rgba(255,255,255,0.6)'}
                        placeholder="Password"
                        onFocus={()=>this.setState({ passwordFocused: true })}
                        onBlur={()=>this.setState({ passwordFocused: false })}
                        textContentType='password'
                        secureTextEntry={true}
                        
                        clearButtonMode='while-editing'
                        onChangeText={(text) => this.setState({password: text})}
                        value={this.state.password}
                    >
                    </TextInput>
                </View>
                <TouchableBounce style={{ height: 64, width: 100, position: 'absolute', left: 32, bottom: 48 }} onPress={async() => {
                    if(this.state.username != "" && this.state.password != "") {
                        try {
                            const headers = { 'Content-Type': 'multipart/form-data', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };
                            const uaHeaders = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36' };

                            var form = new FormData();
                            form.append("userEvent", 930);
                            form.append("username", this.state.username);
                            form.append("password", this.state.password);
                            form.append("deploymentId", "aspen");
                            var testResponse = await fetch("https://aspen.cps.edu/aspen/home.do", { method: 'GET', headers: uaHeaders, credentials: 'include' });
                            var getResponse = await fetch("https://aspen.cps.edu/aspen/logon.do", { method: 'GET', headers: uaHeaders, credentials: 'include' });
                            this.setState({ token: (await getResponse.text()).match(/name="org.apache.struts.taglib.html.TOKEN" value="(.*?)"/)[1] });
                            form.append("org.apache.struts.taglib.html.TOKEN", this.state.token);
                            var postResponse = await fetch("https://aspen.cps.edu/aspen/logon.do", { method: 'POST', body: form, headers: headers, credentials: 'include'  });
                            //Alert.alert("DEBUG", await postResponse.text());
                            testResponse = await fetch("https://aspen.cps.edu/aspen/home.do", { method: 'GET', credentials: 'include', headers: uaHeaders });
                            if(testResponse.status != 200)
                            {
                                Alert.alert('Failed to login', 'Status code: ' + testResponse.status);
                                //Alert.alert(await testResponse.text());
                            }
                            else {
                                await AsyncStorage.setItem('username', this.state.username);
                                await AsyncStorage.setItem('password', this.state.password);
                                Updates.reload();
                            }
                            
                        }
                        catch(ex) {
                            Alert.alert('Failed to login.', 'Error message: ' + ex.toString());
                        }
                    }
                    
                }}>
                    <View style={{
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        borderRadius: 24,
                        width: 100,
                        height: 48,
                        backgroundColor: 'white',
                    }}>
                        <Text style={{ fontSize: 16, color: Colors.tintColor }}>Login</Text>
                    </View>
                </TouchableBounce>
            </ScrollView>
        );
    }
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 15,
      backgroundColor: Colors.tintColor,
    },
    input: {
        width: Layout.window.width - 64,
        borderBottomColor: 'white',
        borderBottomWidth: 1,
        marginTop: 24,
        marginBottom: 24,
        paddingBottom: 8,
        fontSize: 18,
        color: 'white',
    }
});