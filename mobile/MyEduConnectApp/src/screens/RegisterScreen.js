import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../config';

const T = { bg: '#050505', card: '#0A0A0A', primary: '#FFFFFF', text: '#FFFFFF', muted: '#888888', border: '#222222' };

export default function RegisterScreen({ navigation, onLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [loading, setLoading] = useState(false);

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) return Alert.alert('Error', 'All fields required');
    setLoading(true);
    try {
      const data = await apiCall('POST', '/auth/register', form);
      await AsyncStorage.setItem('mec_token', data.token);
      await AsyncStorage.setItem('mec_user', JSON.stringify(data.user));
      onLogin(data.token, data.user);
    } catch (err) {
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.container}>
      <View style={s.card}>
        <Text style={s.title}>Create Account</Text>
        <Text style={s.subtitle}>Join thousands of learners today</Text>
        <TextInput style={s.input} placeholder="Full Name" placeholderTextColor={T.muted} value={form.name} onChangeText={set('name')} />
        <TextInput style={s.input} placeholder="Email Address" placeholderTextColor={T.muted} value={form.email} onChangeText={set('email')} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor={T.muted} value={form.password} onChangeText={set('password')} secureTextEntry />
        <View style={[s.input, { paddingVertical: 0 }]}>
          <Text style={{ color: T.muted, fontSize: 12, paddingTop: 8 }}>I am a...</Text>
          {/* Simple toggle since Picker requires extra setup */}
          <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 8 }}>
            {['student', 'teacher'].map(r => (
              <TouchableOpacity key={r} onPress={() => set('role')(r)}
                style={{ padding: 8, borderRadius: 8, backgroundColor: form.role === r ? T.primary : 'transparent', borderWidth: 1, borderColor: T.primary }}>
                <Text style={{ color: form.role === r ? '#fff' : T.primary, fontWeight: '600', textTransform: 'capitalize' }}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handleRegister} disabled={loading}>
          <Text style={s.btnText}>{loading ? 'Creating account...' : 'Create Account'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.switchText}>Already have an account? <Text style={{ color: T.primary, fontWeight: '600' }}>Sign in</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: T.bg, padding: 24, justifyContent: 'center' },
  card:      { backgroundColor: T.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: T.border },
  title:     { fontSize: 22, fontWeight: '700', color: T.text, marginBottom: 4 },
  subtitle:  { fontSize: 13, color: T.muted, marginBottom: 20 },
  input:     { backgroundColor: '#16213E', borderWidth: 1, borderColor: T.border, borderRadius: 10, padding: 14, color: T.text, marginBottom: 14, fontSize: 15 },
  btn:       { backgroundColor: T.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  switchText:{ textAlign: 'center', marginTop: 16, color: T.muted, fontSize: 13 },
});
