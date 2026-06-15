import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall } from '../config';

const T = { bg: '#050505', card: '#0A0A0A', primary: '#FFFFFF', accent: '#888888', text: '#FFFFFF', muted: '#888888', border: '#222222' };

export default function ProfileScreen({ token, user: initialUser }) {
  const [user, setUser]     = useState(initialUser);
  const [name, setName]     = useState('');
  const [bio, setBio]       = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const data = await apiCall('GET', '/users/profile', null, token);
      setUser(data);
      setName(data.name);
      setBio(data.bio || '');
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiCall('PUT', '/users/profile', { name, bio }, token);
      Alert.alert('Success', 'Profile updated!');
      loadProfile();
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.clear();
    Alert.alert('Logged out', 'See you next time!');
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={T.primary} size="large" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      <View style={s.avatarBox}>
        <View style={s.avatar}><Text style={s.avatarText}>{user?.name?.[0] || '?'}</Text></View>
        <Text style={s.name}>{user?.name}</Text>
        <View style={s.roleBadge}><Text style={s.roleText}>{user?.role}</Text></View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Edit Profile</Text>
        <TextInput style={s.input} placeholder="Full Name" placeholderTextColor={T.muted} value={name} onChangeText={setName} />
        <TextInput style={[s.input, { minHeight: 100, textAlignVertical: 'top' }]}
          placeholder="Bio (HTML is accepted)" placeholderTextColor={T.muted}
          value={bio} onChangeText={setBio} multiline />
        <TouchableOpacity style={[s.btn, saving && { opacity: 0.6 }]} onPress={saveProfile} disabled={saving}>
          <Text style={s.btnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Account Info</Text>
        <Text style={s.infoText}>Email: {user?.email}</Text>
        <Text style={s.infoText}>Role: {user?.role}</Text>
        <Text style={s.infoText}>Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</Text>
      </View>

      <TouchableOpacity style={[s.btn, { backgroundColor: '#EF4444', marginTop: 8 }]} onPress={logout}>
        <Text style={s.btnText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: T.bg },
  center:     { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  avatarBox:  { alignItems: 'center', marginBottom: 24 },
  avatar:     { width: 90, height: 90, borderRadius: 45, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '800' },
  name:       { fontSize: 22, fontWeight: '700', color: T.text, marginBottom: 6 },
  roleBadge:  { backgroundColor: 'transparent', borderWidth: 1, borderColor: T.primary, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 4 },
  roleText:   { color: T.primary, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  card:       { backgroundColor: T.card, borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: T.border },
  cardTitle:  { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 14 },
  input:      { backgroundColor: '#16213E', borderWidth: 1, borderColor: T.border, borderRadius: 10, padding: 14, color: T.text, marginBottom: 14, fontSize: 15 },
  btn:        { backgroundColor: T.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  btnText:    { color: '#fff', fontWeight: '700', fontSize: 16 },
  infoText:   { color: T.muted, fontSize: 14, marginBottom: 6 },
});
