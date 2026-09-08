import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from './components/Navbar.jsx';
import Home from './components/Home.jsx';
import Client from './components/Client.jsx';
import Service from './components/Service.jsx';
import History from './components/History.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';
import Admin from './components/Admin.jsx';
import Calendar from './components/Calendar.jsx';

function App() {
  return (
    <div className="App">
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/client" element={<Client />} />
          <Route path="/service" element={<Service />} />
          <Route path="/history" element={<History />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/calendar" element={<Calendar />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;