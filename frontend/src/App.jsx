import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './components/Landing';
import SignIn from './components/sign-in';
import Signup from './components/signup';
import './App.css'
// import Signup from './components/signup'
//import SignIn from './components/sign-in'
//import ManageAccounts from './components/ManageAccounts'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  );
}

export default App;
