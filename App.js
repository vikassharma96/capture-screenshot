import React from 'react';
import {
  Text,
  SafeAreaView,
  StyleSheet,
  NativeModules,
  TouchableOpacity,
} from 'react-native';
import BackgroundService from 'react-native-background-actions';

const sleep = time => new Promise(resolve => setTimeout(() => resolve(), time));

const options = {
  taskName: 'Capture screenshot',
  taskTitle: 'Capture screenshot',
  taskDesc: 'capturing...',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  parameters: {
    delay: 10000,
  },
};

const App = () => {
  const {Screenshot} = NativeModules;

  const veryIntensiveTask = async taskDataArguments => {
    const {delay} = taskDataArguments;
    await new Promise(async resolve => {
      for (let i = 0; BackgroundService.isRunning(); i++) {
        try {
          const result = await Screenshot.captureScreenshot(delay);
          console.log(`capture image count ${i}`, result.substring(0, 10));
        } catch (error) {
          console.log('capture failure');
          await BackgroundService.stop();
        }
        await sleep(delay);
      }
    });
  };

  const startCapture = async () => {
    BackgroundService.start(veryIntensiveTask, options);
  };

  const stopCapture = async () => {
    await Screenshot.stopCapturing();
    BackgroundService.stop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={startCapture}>
        <Text style={styles.text}>{'Start Capture'}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.buttonStyle]}
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
  buttonStyle: {
    marginTop: 16,
    backgroundColor: 'tomato',
  },
  text: {
    fontFamily: 'Avenir',
    fontSize: 15,
  },
});

export default App;
