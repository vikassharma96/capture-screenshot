import React, {useEffect} from 'react';
import {
  Text,
  SafeAreaView,
  StyleSheet,
  NativeModules,
  TouchableOpacity,
} from 'react-native';
import secp256k1 from 'react-native-secp256k1';
import BackgroundService from 'react-native-background-actions';
import useApi from '../api/useApi';
import configApi from '../api/configApi';
import {getUser} from '../auth/storage';

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

const CaptureScreen = () => {
  const {Screenshot} = NativeModules;
  const appConfigApi = useApi(configApi);

  useEffect(() => {
    async function getAppConfiguration() {
      const user = await getUser();
      const {data} = appConfigApi.request(user.token);
      console.log('app config data', data);
    }
    getAppConfiguration();
  }, [appConfigApi]);

  const veryIntensiveTask = async taskDataArguments => {
    const {delay} = taskDataArguments;
    await new Promise(async resolve => {
      for (let i = 0; BackgroundService.isRunning(); i++) {
        try {
          const base64String = await Screenshot.captureScreenshot(delay);
          console.log(
            `capture image count ${i}`,
            base64String.substring(0, 10),
          );

          const privA = await secp256k1.ext.generateKey();
          const privB = await secp256k1.ext.generateKey();

          const pubA = await secp256k1.computePubkey(privA, true);
          const pubB = await secp256k1.computePubkey(privB, true);

          // sign verify
          const data = '1H1SJuGwoSFTqNI8wvVWEdGRpBvTnzLckoZ1QTF7gI0';
          const sigA = await secp256k1.sign(data, privA);
          console.log('verify: ', await secp256k1.verify(data, sigA, pubA));

          // ecdh && aes256
          const encryped = await secp256k1.ext.encryptECDH(
            privA,
            pubB,
            base64String,
          );
          const decryped = await secp256k1.ext.decryptECDH(
            privB,
            pubA,
            encryped,
          );

          console.log('encrypted image ', encryped.substring(0, 10));
          console.log('decrypted image ', decryped.substring(0, 10));
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

export default CaptureScreen;
