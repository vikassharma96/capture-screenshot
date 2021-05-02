import AsyncStorage from '@react-native-async-storage/async-storage';

const userKey = 'user';

const setUser = async value => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(userKey, jsonValue);
  } catch (e) {
    console.log('setUser error');
  }
};

const getUser = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(userKey);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (error) {
    console.log('getUser error');
  }
};

export {setUser, getUser};
