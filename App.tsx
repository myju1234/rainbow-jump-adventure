import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { WebView } from 'react-native-webview'
import { StatusBar } from 'expo-status-bar'
import * as ScreenOrientation from 'expo-screen-orientation'
import { GAME_HTML } from './gameHtml'

export default function App() {
  useEffect(() => {
    void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)
    return () => {
      void ScreenOrientation.unlockAsync()
    }
  }, [])

  return (
    <View style={styles.screen}>
      <StatusBar hidden />
      <WebView
        originWhitelist={['*']}
        source={{ html: GAME_HTML, baseUrl: 'https://rainbow-jump.local/' }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        overScrollMode="never"
        bounces={false}
        style={styles.webview}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#8bdfff' },
  webview: { flex: 1, backgroundColor: 'transparent' },
})
