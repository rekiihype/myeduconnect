import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { apiCall } from '../config';

const T = { bg: '#050505', card: '#0A0A0A', primary: '#FFFFFF', success: '#10B981', warning: '#F59E0B', text: '#FFFFFF', muted: '#888888', border: '#222222' };
const EMOJIS = { Programming: '💻', 'Web Development': '🌐', Security: '🔒', Database: '🗄️', Mobile: '📱', 'AI/ML': '🤖' };

export default function EnrolmentScreen({ token, navigation }) {
  const [enrolments, setEnrolments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadEnrolments(); }, []);

  const loadEnrolments = async () => {
    try {
      const data = await apiCall('GET', '/enrolments', null, token);
      setEnrolments(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <View style={s.center}><ActivityIndicator color={T.primary} size="large" /></View>;

  if (enrolments.length === 0) return (
    <View style={s.center}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>📚</Text>
      <Text style={s.emptyTitle}>No courses yet</Text>
      <Text style={s.emptyText}>Browse and enrol in a course to get started</Text>
      <TouchableOpacity style={s.btn} onPress={() => navigation.navigate('Courses')}>
        <Text style={s.btnText}>Browse Courses</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      style={s.container}
      data={enrolments}
      keyExtractor={e => String(e.id)}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item: e }) => (
        <View style={s.card}>
          <View style={s.thumb}><Text style={s.emoji}>{EMOJIS[e.category] || '📚'}</Text></View>
          <View style={s.info}>
            <Text style={s.title} numberOfLines={2}>{e.course_title}</Text>
            <View style={s.row}>
              <View style={[s.badge, e.payment_status === 'completed' ? s.badgeGreen : s.badgeOrange]}>
                <Text style={s.badgeText}>{e.payment_status}</Text>
              </View>
              <Text style={s.eid}>ID #{e.id}</Text>
            </View>
          </View>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: T.bg },
  center:      { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyTitle:  { fontSize: 20, fontWeight: '700', color: T.text, marginBottom: 8 },
  emptyText:   { fontSize: 14, color: T.muted, marginBottom: 24, textAlign: 'center' },
  btn:         { backgroundColor: T.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  btnText:     { color: '#fff', fontWeight: '700' },
  card:        { backgroundColor: T.card, borderRadius: 14, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: T.border },
  thumb:       { width: 80, backgroundColor: '#1E1E3A', alignItems: 'center', justifyContent: 'center' },
  emoji:       { fontSize: 28 },
  info:        { flex: 1, padding: 14 },
  title:       { fontSize: 15, fontWeight: '700', color: T.text, marginBottom: 8 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeGreen:  { backgroundColor: 'transparent', borderWidth: 1, borderColor: T.success },
  badgeOrange: { backgroundColor: 'transparent', borderWidth: 1, borderColor: T.warning },
  badgeText:   { fontSize: 12, fontWeight: '600', color: T.success },
  eid:         { fontSize: 12, color: T.muted },
});
