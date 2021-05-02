import React, {useContext, useState} from 'react';
import {
  Text,
  SafeAreaView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import authApi from '../api/authApi';
import useApi from '../api/useApi';
import {setUser as saveUser} from '../auth/storage';
import AuthContext from '../auth/contex';

export default function RegistrationScreen() {
  const {user, setUser} = useContext(AuthContext);

  const [emailId, setEmailId] = useState('vijaykoushik+dorothy@blaze.ws');
  const [password, setPassword] = useState('UUnMpN9wckyEa93');

  const registerApi = useApi(authApi.register);

  const onRegister = async () => {
    const body = {
      email: emailId,
      password: password,
      organisationCode: 'JoI',
      version: '0.1.2',
      offset: 5.5,
      config: 'ubuntu 16.04',
      token: '',
    };
    try {
      const {data: userObj} = await registerApi.request(body);
      const userData = {...body, token: userObj.data.token};
      console.log('userData', userData);
      saveUser(userData);
      setUser(userData);
    } catch (error) {
      console.log('error', error);
    }
  };

  return (
    <SafeAreaView style={styles.containter}>
      <Text style={styles.text}>Please Register with us</Text>
      <TextInput
        style={styles.input}
        defaultValue={emailId}
        onChangeText={email => setEmailId(email)}
      />
      <TextInput
        style={styles.input}
        defaultValue={password}
        onChangeText={psw => setPassword(psw)}
      />
      <TextInput style={styles.input} defaultValue={'JoI'} editable={false} />
      <TouchableOpacity style={styles.button} onPress={onRegister}>
        {registerApi.loading ? (
          <ActivityIndicator color={'blue'} size={'small'} />
        ) : (
          <Text>Register</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containter: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: '20%',
    marginBottom: 20,
  },
  input: {
    width: '80%',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginVertical: 6,
  },
  button: {
    borderWidth: 1,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    width: '25%',
    borderColor: 'black',
    backgroundColor: 'orange',
  },
});
