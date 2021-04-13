import React, {useEffect, useState} from 'react';
import {
  Text,
  SafeAreaView,
  StyleSheet,
  NativeModules,
  TouchableOpacity,
} from 'react-native';

const sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

const App = () => {
  const {Screenshot} = NativeModules;
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    async function serviceStatus() {
      const status = await Screenshot.isRunning();
      setIsRunning(status);
    }
    serviceStatus();
  }, []);

  const startCapture = async () => {
    if (isRunning) return;
    Screenshot.captureScreenshot()
      .then(() => {
        setIsRunning(true);
      })
      .catch(error => {
        console.log('error', error);
        setIsRunning(false);
      });
    await sleep(20000);
  };

  const stopCapture = async () => {
    if (!isRunning) return;
    Screenshot.stopCapturing();
    setIsRunning(false);
    await sleep(20000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={startCapture}>
        <Text style={styles.text}>{'Start Capture'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, {marginTop: 16, backgroundColor: 'tomato'}]}
        onPress={stopCapture}>
        <Text style={styles.text}>{'Stop Capture'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'lightblue',
  },
  button: {
    borderRadius: 5,
    borderWidth: 1,
    padding: 8,
    backgroundColor: 'green',
  },
  text: {
    fontFamily: 'Avenir',
    fontSize: 15,
  },
});

export default App;
