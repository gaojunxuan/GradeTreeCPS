import React from 'react';
import { ScrollView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert, AsyncStorage, ActionSheetIOS, Platform } from 'react-native';
import cio from 'cheerio-without-node-native';
import Picker from 'react-native-simple-modal-picker';
import Networking from '../helpers/Networking';
import StringHelper from '../helpers/StringHelper';
import Colors from '../constants/Colors';

export default class AssignmentListScreen extends React.Component {
  static navigationOptions = ({ navigation }) => {
    const { params = { title: 'Assignment' } } = navigation.state;
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
    this.state = {
      token: '', assignments: [], grades: [], isGradesLoading: true, isAssignmentListLoading: true, terms: [], currentTermIndex: 0, currentTerm: ''
    };
  }

  async componentDidMount() {
    try {
      const id = this.props.navigation.getParam('code', '0');
      const name = this.props.navigation.getParam('name', 'Assignment');
      this.props.navigation.setParams({
        title: name
      });
      const username = await AsyncStorage.getItem('username');
      const password = await AsyncStorage.getItem('password');
      await this.loadData(username, password, id);
    } catch {
      Alert.alert('Failed to load data. Please check your Internet connection and try again.');
    }
  }

  // Load the data
  async loadData(username, password, param) {
    const headers = { 'Content-Type': 'multipart/form-data', 'User-Agent': StringHelper.getUserAgentString() };
    const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };

    const form = new FormData();
    form.append('userEvent', 930);
    form.append('username', username);
    form.append('password', password);
    form.append('deploymentId', 'aspen');
    // get category list
    let classListGetResponse = await fetch('https://aspen.cps.edu/aspen/portalClassList.do?navkey=academics.classes.list', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    if (classListGetResponse.status !== 200) {
      await Networking.login(username, password);
      classListGetResponse = await fetch('https://aspen.cps.edu/aspen/portalClassList.do?navkey=academics.classes.list', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    }
    this.setState({ token: (await classListGetResponse.text()).match(/name="org.apache.struts.taglib.html.TOKEN" value="(.*?)"/)[1] });
    const assignmentForm = new FormData();
    assignmentForm.append('org.apache.struts.taglib.html.TOKEN', this.state.token);
    assignmentForm.append('userEvent', 2100);
    assignmentForm.append('userParam', param);
    const classDetailResponse = await fetch('https://aspen.cps.edu/aspen/portalClassList.do', {
      method: 'POST', body: assignmentForm, headers, credentials: 'include'
    });
    const data = await classDetailResponse.text();
    const $ = cio.load(data);
    const grades = [];
    let name = '';
    let weight = '';
    let avg = '';
    $($('#contentArea').find($('#dataGrid'))[1]).find($('.listCell')).each((index, element) => {
      if (index % 2 === 0) {
        name = $($(element).children()[0]).text();
        weight = $($(element).children()[2]).text();
      } else {
        avg = $($(element).children()[1]).text();
        grades.push({
          id: index, name, weight, avg
        });
        this.setState({ grades, isGradesLoading: false });
      }
    });
    // get assignments list
    const assignmentsResponse = await fetch('https://aspen.cps.edu/aspen/portalAssignmentList.do?navkey=academics.classes.list.gcd', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    const assignmentData = await assignmentsResponse.text();
    const $2 = cio.load(assignmentData);
    const assignments = [];
    $2('#dataGrid').find($2('.listCell')).each((index, element) => {
      // console.log($2($2(element).find($2('td'))[0]).text());
      if (!$2($2(element).find($2('td'))[0]).text().includes('No matching records')) {
        const name = $2($2(element).find($2('td'))[1]).text();
        const cat = $2($2(element).find($2('td'))[4]).text();
        const score = $2($2(element).find($2('td'))[7]).text();
        assignments.push({
          name, cat, score, code: $2($2(element).find($2('td'))[1]).attr('id')
        });
        this.setState({ assignments, isAssignmentListLoading: false });
      }
    });
    const terms = [];
    const $3 = cio.load(assignmentData);
    let termCounter = 0;
    $3('select[name="gradeTermOid"]').children().each((index, element) => {
      // console.log($2($2(element).find($2('td'))[0]).text());
      const text = $3(element).text();
      const val = $3(element).attr('value');
      const selectedStr = $3(element).attr('selected');
      if (text !== 'All') {
        const selected = (selectedStr !== null && selectedStr === 'selected');
        terms.push({ text, value: val, selected });
        this.setState({ terms });
        if (selected) { this.setState({ currentTermIndex: termCounter, currentTerm: this.state.terms[termCounter].text }); }
        termCounter += 1;
      }
    });
    this.setState({ isGradesLoading: false, isAssignmentListLoading: false });
  }

  // Change to a different term
  async changeTerm(term) {
    const username = await AsyncStorage.getItem('username');
    const password = await AsyncStorage.getItem('password');
    this.setState({ assignments: [], isAssignmentListLoading: true });
    const postHeaders = { 'Content-Type': 'multipart/form-data', 'User-Agent': StringHelper.getUserAgentString() };
    const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };

    let classListGetResponse = await fetch('https://aspen.cps.edu/aspen/portalAssignmentList.do', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    if (classListGetResponse.status !== 200) {
      await Networking.login(username, password);
      classListGetResponse = await fetch('https://aspen.cps.edu/aspen/portalAssignmentList.do', { method: 'GET', headers: uaHeaders, credentials: 'include' });
    }
    this.setState({ token: (await classListGetResponse.text()).match(/name="org.apache.struts.taglib.html.TOKEN" value="(.*?)"/)[1] });
    const assignmentForm = new FormData();
    assignmentForm.append('org.apache.struts.taglib.html.TOKEN', this.state.token);
    assignmentForm.append('userEvent', 2210);
    assignmentForm.append('gradeTermOid', term);
    assignmentForm.append('formFocusField', 'gradeTermOid');

    // get assignments list
    const assignmentsResponse = await fetch('https://aspen.cps.edu/aspen/portalAssignmentList.do', {
      method: 'POST', body: assignmentForm, headers: postHeaders, credentials: 'include'
    });
    const assignmentData = await assignmentsResponse.text();
    const $2 = cio.load(assignmentData);
    const assignments = [];
    $2('#dataGrid').find($2('.listCell')).each((index, element) => {
      // console.log($2($2(element).find($2('td'))[0]).text());
      if (!$2($2(element).find($2('td'))[0]).text().includes('No matching records')) {
        const name = $2($2(element).find($2('td'))[1]).text();
        const cat = $2($2(element).find($2('td'))[4]).text();
        const score = $2($2(element).find($2('td'))[7]).text();
        assignments.push({
          name, cat, score, code: $2($2(element).find($2('td'))[1]).attr('id')
        });
        this.setState({ assignments, isAssignmentListLoading: false });
      }
    });

    const terms = [];
    const $3 = cio.load(assignmentData);
    let termCounter = 0;
    $3('select[name="gradeTermOid"]').children().each((index, element) => {
      // console.log($2($2(element).find($2('td'))[0]).text());
      const text = $3(element).text();
      const val = $3(element).attr('value');
      const selectedStr = $3(element).attr('selected');
      if (text !== 'All') {
        const selected = (selectedStr !== null && selectedStr === 'selected');
        terms.push({ text, value: val, selected });
        this.setState({ terms });
        if (selected) { this.setState({ currentTermIndex: termCounter, currentTerm: this.state.terms[termCounter].text }); }
        termCounter += 1;
      }
    });
    this.setState({ isGradesLoading: false, isAssignmentListLoading: false });
  }

  

  render() {
    return (
      <ScrollView style={styles.container}>
        <Text style={{
          paddingLeft: 24, paddingRight: 24, paddingTop: 8, fontSize: 24, fontWeight: 'bold'
        }}
        >
          Categories
        </Text>
        {this.state.grades.length === 0 ? (
          <Text style={{
            fontSize: 18, color: 'grey', marginLeft: 24, marginTop: 12
          }}
          >
            Nothing here
          </Text>
        ) : <View />}
        <ActivityIndicator animating={this.state.isGradesLoading} style={{ marginTop: 0 }} />
        <View style={{ paddingLeft: 24, paddingRight: 24 }}>
          {this.state.grades.map((item) => {
            const name = StringHelper.removeLineBreaks(item.name.toString());
            let avg = StringHelper.removeLineBreaks(item.avg.toString());
            const weight = StringHelper.removeLineBreaks(item.weight.toString());
            let color = 'limegreen';
            if (avg.includes('B')) { color = 'orange'; }
            if (avg.includes('C') || avg.includes('D') || avg.includes('F')) { color = 'orangered'; }
            if (avg === '') {
              avg = 'N/A';
              color = 'lightgrey';
            }
            return (
              <View key={item.id} style={{ marginBottom: 12 }}>
                <TouchableOpacity onPress={() => {
                  this.props.navigation.push('AssignmentDetail', { cat: name, list: this.state.assignments });
                }}
                >
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ flexDirection: 'column' }}>
                      <Text style={{ fontSize: 18 }}>{name}</Text>
                      <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{weight}</Text>
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
                          {avg}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
        <Text style={{
          paddingLeft: 24, paddingRight: 24, paddingTop: 24, fontSize: 24, fontWeight: 'bold'
        }}
        >
          Assignments
        </Text>
        <Text style={{
          color: 'grey', fontSize: 14, marginTop: 12, marginLeft: 24
        }}
        >
          Grade term
        </Text>
        <TouchableOpacity
          style={{ marginLeft: 24 }}
          onPress={() => {
            if (Platform.OS === 'ios') {
              const options = this.state.terms.map(val => val.text);
              options.push('Cancel');
              ActionSheetIOS.showActionSheetWithOptions({
                options,
                cancelButtonIndex: this.state.terms.length
              },
              async (buttonIndex) => {
                if (buttonIndex !== this.state.terms.length) {
                  if (buttonIndex !== this.state.currentTermIndex) {
                    this.setState({ currentTermIndex: buttonIndex, currentTerm: this.state.terms[this.state.currentTermIndex].text });
                    await this.changeTerm(this.state.terms[buttonIndex].value);
                  }
                }
              },);
            } else if (this.termPicker !== null) { this.termPicker.setModalVisible(); }
          }}
        >
          <Text style={{ fontSize: 18, marginTop: 8, color: Colors.tintColor }}>{this.state.currentTerm === '' ? 'Pick a term' : this.state.currentTerm}</Text>
        </TouchableOpacity>
        {this.state.assignments.length === 0 ? (
          <Text style={{
            fontSize: 18, color: 'grey', marginLeft: 24, marginTop: 24
          }}
          >
Nothing here

          </Text>
        ) : <View />}
        <ActivityIndicator animating={this.state.isAssignmentListLoading} style={{ marginTop: 0 }} />
        <View style={{ paddingLeft: 24, paddingRight: 24, paddingBottom: 48 }}>
          {this.state.assignments.map((item) => {
            const name = StringHelper.removeLineBreaks(item.name.toString());
            const cat = StringHelper.removeLineBreaks(item.cat.toString());
            let score = StringHelper.removeLineBreaks(item.score.toString()).replace(/\([^)]*\)/, '');
            let s = 0;
            let total = 0;
            let percent = NaN;
            let color = 'limegreen';
            if (score !== 'Ungraded') {
              score = score.split('%')[1];
              if (score !== null) {
                s = parseFloat(score.split('/')[0].trim());
                total = parseFloat(score.split('/')[1].trim());
                percent = s / total;
                // console.log(percent);
              }
            } else {
              color = 'lightgrey';
            }

            if (!isNaN(percent)) {
              if (percent < 0.9) { color = 'orange'; }
              if (percent < 0.7) { color = 'orangered'; }
            } else { color = 'lightgrey'; }

            return (
              <View key={item.code} style={{ marginBottom: 12 }}>
                <TouchableOpacity onPress={async () => {
                  try {
                    const uaHeaders = { 'User-Agent': StringHelper.getUserAgentString() };
                    const { code } = item;
                    let response = await fetch(`https://aspen.cps.edu/aspen/portalAssignmentDetailPopup.do?prefix=GCD&context=academics.classes.list.gcd.detail&oid=${code}`, { method: 'GET', headers: uaHeaders, credentials: 'include' });
                    if (response.status !== 200) {
                      const username = await AsyncStorage.getItem('username');
                      const password = await AsyncStorage.getItem('password');
                      await Networking.login(username, password);
                      response = await fetch(`https://aspen.cps.edu/aspen/portalAssignmentDetailPopup.do?prefix=GCD&context=academics.classes.list.gcd.detail&oid=${code}`, { method: 'GET', headers: uaHeaders, credentials: 'include' });
                    }
                    const data = await response.text();
                    const $ = cio.load(data);
                    const td = $('#collapsibleDiv0').find($('.detailValue'));
                    let result = '';
                    if ($(td[6]).text() !== '') {
                      result += `High: ${$(td[6]).text()}\n`;
                      result += `Low: ${$(td[7]).text()}\n`;
                      result += `Median: ${$(td[8]).text()}\n`;
                      result += `Average: ${$(td[9]).text()}\n`;
                      Alert.alert('Statistics', result);
                    }
                  } catch (ex) {
                    Alert.alert('Failed to load data. Please check your Internet connection and try again.');
                  }
                }}
                >
                  <View style={{ flexDirection: 'row' }}>
                    <View style={{ flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                      <Text style={{ fontSize: 18 }}>{name}</Text>
                      <Text style={{ fontSize: 14, color: 'grey', marginTop: 4 }}>{cat}</Text>
                    </View>
                    <View style={{ flex: 1, alignSelf: 'center', alignItems: 'flex-end' }}>
                      <TouchableOpacity onPress={() => this.setState({ showPercent: !this.state.showPercent })}>
                        <View style={{
                          flexDirection: 'row', height: 24, width: 120, backgroundColor: color, alignItems: 'center', justifyContent: 'center', borderRadius: 8
                        }}
                        >
                          <Text style={{
                            fontSize: 16, color: 'white', flex: 1, alignSelf: 'center', textAlign: 'center'
                          }}
                          >
                            { this.state.showPercent ? ((!isNaN(percent)) ? `${(percent * 100).toFixed(1)}%` : 'N/A') : score }

                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
          <Picker
            ref={instance => this.termPicker = instance}
            data={this.state.terms}
            label='text'
            value='value'
            onValueChange={async (value) => {
              await this.changeTerm(value);
            }}
          />
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
