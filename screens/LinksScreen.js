import React from 'react';
import { ScrollView, StyleSheet, WebView, Text, View, Button, FlatList } from 'react-native';
import { ExpoLinksView } from '@expo/samples';
import axios from 'axios';
import { HiddenWebView } from '../components/HiddenWebView';
import cio from 'cheerio-without-node-native';


export default class LinksScreen extends React.Component {
  static navigationOptions = {
    title: 'Links',
  };
  constructor(props) {
    super(props);
    this.state = { token: "nothing", result: "", webviewContent: "test", classList: [] };
    this._webview = null;
  }
  
  render() {
    const js = 'window.postMessage(document.documentElement.innerHTML.match(/name="org.apache.struts.taglib.html.TOKEN" value="(.*?)"/)[1])'
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded', "Origin": 'https://aspen.cps.edu' };
    var form = new FormData();
    form.append("userEvent", 930);
    form.append("username", "jgao5");
    form.append("password", "Gjx-20011106");
    form.append("deploymentId", "aspen");
    //console.log(JSON.stringify(form));
    return (
      <ScrollView style={styles.container}>
        <Button title="Login to Aspen" onPress={()=>{
          axios.get("https://aspen.cps.edu/aspen/logon.do").then(getResponse => {
            this.setState({ token: getResponse.data.match(/name="org.apache.struts.taglib.html.TOKEN" value="(.*?)"/)[1] });
            form.append("org.apache.struts.taglib.html.TOKEN", this.state.token);
            axios.post("https://aspen.cps.edu/aspen/logon.do", form, { headers: headers }).then(postResponse => {
              this.setState({ result: postResponse.data });
              //console.log(postResponse.headers)
            });
          })
        }}></Button>
        <Button title="Load Academics Page" onPress={()=>{
          axios.get("https://aspen.cps.edu/aspen/portalClassList.do?navkey=academics.classes.list").then(getResponse => {
            var data = getResponse.data;
            var $ = cio.load(data);
            var list = [];
            $('#dataGrid').find($('.listCell')).each((index, element)=> {
              list.push([$($(element).find($('td'))[1]).text(), $($(element).find($('td'))[6]).text()]);
              this.setState({ classList: list, result: list[0] });
            });
          })
        }}>
        </Button>
        {this.state.classList.map(item => {
          var avg = parseFloat(item[1].toString().replace(' ', '').replace('\n', '').replace('\r', ''));
          var color = "limegreen";
          if(avg < 80)
            color = "orange";
          if(avg < 70)
            color = "orangered";
          return (
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ fontSize: 16, alignSelf: 'center' }}>{item[0].toString()}</Text>
              <View style={{ flex: 1, alignSelf: 'center', alignItems: 'flex-end' }}>
                <View style={{ flexDirection: 'row', height: 24, width: 80, marginRight: 24, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
                  <Text style={{ fontSize: 16, color: 'white', flex: 1, alignSelf: 'center', textAlign: 'center' }}>{avg}</Text>
                </View>
              </View>
            </View>
          )
        })}
        
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
