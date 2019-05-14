import React from 'react';
import { ScrollView, StyleSheet, WebView, Text, View, Button } from 'react-native';

export class HiddenWebView extends React.Component {
  render() {
    return <WebView {...this.props}/>;
  }
}
