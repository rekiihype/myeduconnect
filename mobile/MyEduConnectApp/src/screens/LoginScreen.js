import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../config';

const T = { bg: '#050505', card: '#0A0A0A', primary: '#FFFFFF', accent: '#888888', text: '#FFFFFF', muted: '#888888', border: '#222222' };

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Email and password required');
    setLoading(true);
    try {
      // DELIBERATE: Credentials sent over HTTP cleartext (V-12)
      // The full POST body including email+password is visible in Wireshark
      const data = await apiCall('POST', '/auth/login', { email, password });
      await AsyncStorage.setItem('mec_token', data.token);
      await AsyncStorage.setItem('mec_user', JSON.stringify(data.user));
      onLogin(data.token, data.user);
    } catch (err) {
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.logoBox}>
        <Text style={s.logoText}>MyEduConnect</Text>
        <Text style={s.logoSub}>Malaysia's Premier Learning Platform</Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Welcome Back</Text>
        <Text style={s.subtitle}>Sign in to continue learning</Text>
        <TextInput style={s.input} placeholder="Email address" placeholderTextColor={T.muted}
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor={T.muted}
          value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.switchText}>Don't have an account? <Text style={s.link}>Register here</Text></Text>
        </TouchableOpacity>
      </View>

      {/* Test credentials hint for graders */}
      <View style={s.hint}>
        <Text style={s.hintText}>Test Accounts:</Text>
        <Text style={s.hintText}>Admin: admin@myeduconnect.my / admin123</Text>
        <Text style={s.hintText}>Student: alice@student.my / alice123</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  { flexGrow: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoBox:    { alignItems: 'center', marginBottom: 32 },
  logoText:   { fontSize: 28, fontWeight: '800', color: T.primary },
  logoSub:    { fontSize: 13, color: T.muted, marginTop: 4 },
  card:       { width: '100%', backgroundColor: T.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: T.border },
  title:      { fontSize: 22, fontWeight: '700', color: T.text, marginBottom: 4 },
  subtitle:   { fontSize: 13, color: T.muted, marginBottom: 20 },
  input:      { backgroundColor: '#16213E', borderWidth: 1, borderColor: T.border, borderRadius: 10, padding: 14, color: T.text, marginBottom: 14, fontSize: 15 },
  btn:        { backgroundColor: T.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText: { textAlign: 'center', marginTop: 16, color: T.muted, fontSize: 13 },
  link:       { color: T.primary, fontWeight: '600' },
  hint:       { marginTop: 24, padding: 16, backgroundColor: T.card, borderRadius: 12, width: '100%', borderWidth: 1, borderColor: T.border },
  hintText:   { color: T.muted, fontSize: 12, marginBottom: 2 },
});
