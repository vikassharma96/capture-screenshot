import React, {useState, useEffect} from 'react';
import AuthContext from './auth/contex';
import {getUser} from './auth/storage';
import CaptureScreen from './screens/CaptureScreen';
import RegistrationScreen from './screens/RegistrationScreen';

const App = () => {
  const [user, setUser] = useState();

  useEffect(() => {
    async function restoreUser() {
      const currentUser = await getUser();
      setUser(currentUser);
    }
    restoreUser();
  }, []);

  return (
    <AuthContext.Provider value={{user, setUser}}>
      {user ? <CaptureScreen /> : <RegistrationScreen />}
    </AuthContext.Provider>
  );
};

export default App;
