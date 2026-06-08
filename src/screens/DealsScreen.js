import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { WebView } from 'react-native-webview';

export default function DealsScreen({ route }) {
  const { retailer, query } = route.params;
  const url = retailer.url(query);

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Searching {retailer.name} for: <Text style={styles.query}>{query}</Text></Text>
        <TouchableOpacity onPress={() => Linking.openURL(url)}>
          <Text style={styles.openLink}>Open in browser →</Text>
        </TouchableOpacity>
      </View>
      <WebView source={{ uri: url }} style={{ flex: 1 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  banner: { padding: 12, backgroundColor: '#fff8f9', borderBottomWidth: 1, borderBottomColor: '#f0d0d8' },
  bannerText: { fontSize: 13, color: '#555' },
  query: { fontWeight: '700', color: '#E8335A' },
  openLink: { color: '#E8335A', fontSize: 13, marginTop: 4 },
});
