import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  NativeModules,
  TouchableOpacity,
} from 'react-native';
import BackgroundService from 'react-native-background-actions';
import useApi from '../api/useApi';
import configApi from '../api/configApi';
import {getUser} from '../auth/storage';
import Upload from 'react-native-background-upload';
const RNFS = require('react-native-fs');

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
    delay: 15000,
  },
};

const apiOptions = {
  method: 'POST',
  type: 'multipart',
  field: 'file',
};

const CaptureScreen = () => {
  const {Screenshot} = NativeModules;
  const appConfigApi = useApi(configApi);
  const [appConfigData, setAppConfigData] = useState();
  const [message, setMessage] = useState(false);

  useEffect(() => {
    async function getAppConfiguration() {
      const user = await getUser();
      apiOptions.parameters = {
        email: user.email,
        organisationid: user.organisationCode,
      };
      apiOptions.headers = {
        Authorization: `Bearer ${user.token}`,
        'content-type': 'multipart/form-data',
      };
      const {data: configData} = await appConfigApi.request(
        user.organisationCode,
        user.token,
      );
      setAppConfigData(configData.data);
    }
    getAppConfiguration();
  }, []);

  const uploadImage = async filePath => {
    const options = {
      url: appConfigData.imageUploadUrl,
      ...apiOptions,
      path: filePath,
      notification: {
        enabled: false,
      },
    };
    const upload = await Upload.startUpload(options)
      .then(uploadId => {
        console.log('Upload started');
        Upload.addListener('progress', uploadId, data => {
          console.log(`Progress: ${data.progress}%`);
        });
        Upload.addListener('error', uploadId, data => {
          console.log(`Error: ${JSON.stringify(data)}%`);
        });
        Upload.addListener('cancelled', uploadId, data => {
          console.log('Cancelled!');
        });
        Upload.addListener('completed', uploadId, data => {
          RNFS.unlink(filePath)
            .then(() => {
              console.log('file deleted');
            })
            .catch(err => {
              console.log(err.message, 'file deleted failed');
            });
          console.log('Completed!', data);
        });
      })
      .catch(err => {
        console.log('Upload error!', err);
      });
  };

  const veryIntensiveTask = async taskDataArguments => {
    const {delay} = taskDataArguments;
    await new Promise(async resolve => {
      for (let i = 0; BackgroundService.isRunning(); i++) {
        try {
          const base64String = await Screenshot.captureScreenshot(delay);
          console.log(
            `capture image count ${i}`,
            base64String[1]?.substring(0, 10),
          );
          await uploadImage(base64String[0]);
        } catch (error) {
          console.error('capture failure', error);
          await Screenshot.stopCapturing();
          await BackgroundService.stop();
        }
        await sleep(delay);
      }
    });
  };

  const startCapture = async () => {
    if (appConfigData) BackgroundService.start(veryIntensiveTask, options);
    else setMessage(true);
  };

  const stopCapture = async () => {
    try {
      await Screenshot.stopCapturing();
      await BackgroundService.stop();
    } catch (error) {
      console.log('error', error);
    }
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
      {message && (
        <View style={styles.error}>
          <Text style={styles.errorText}>Something went wrong!</Text>
        </View>
      )}
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
  error: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: 'red',
    height: '5%',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: 'white',
  },
});

export default CaptureScreen;
