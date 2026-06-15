import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { apiCall } from '../config';

const T = { bg: '#050505', card: '#0A0A0A', primary: '#FFFFFF', accent: '#888888', text: '#FFFFFF', muted: '#888888', border: '#222222' };

export default function HomeScreen({ token, user, navigation }) {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    apiCall('GET', '/courses').then(data => setCourses(data.slice(0, 3))).catch(console.error);
  }, []);

  return (
    <ScrollView style={s.container}>
      <View style={s.hero}>
        <Text style={s.heroTitle}>Welcome back,</Text>
        <Text style={s.heroName}>{user?.name || 'Learner'} 👋</Text>
        <Text style={s.heroSub}>Continue your learning journey</Text>
        <TouchableOpacity style={s.heroBtn} onPress={() => navigation.navigate('Courses')}>
          <Text style={s.heroBtnText}>Browse All Courses →</Text>
        </TouchableOpacity>
      </View>

      <View style={s.stats}>
        {[['12K+', 'Students'], ['200+', 'Courses'], ['98%', 'Satisfaction']].map(([n, l]) => (
          <View key={l} style={s.stat}>
            <Text style={s.statNum}>{n}</Text>
            <Text style={s.statLbl}>{l}</Text>
          </View>
        ))}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Featured Courses</Text>
        {courses.map(c => (
          <TouchableOpacity key={c.id} style={s.courseRow} onPress={() => navigation.navigate('CourseDetail', { course: c })}>
            <View style={s.courseThumb}><Text style={{ fontSize: 24 }}>📚</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.courseTitle} numberOfLines={1}>{c.title}</Text>
              <Text style={s.courseMeta}>{c.category} · RM {parseFloat(c.price).toFixed(2)}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: T.bg },
  hero:        { padding: 24, paddingTop: 32, paddingBottom: 32, backgroundColor: '#1A1A2E' },
  heroTitle:   { fontSize: 16, color: T.muted },
  heroName:    { fontSize: 26, fontWeight: '800', color: T.text, marginBottom: 6 },
  heroSub:     { fontSize: 14, color: T.muted, marginBottom: 20 },
  heroBtn:     { backgroundColor: T.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  heroBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  stats:       { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: '#16213E', borderBottomWidth: 1, borderBottomColor: T.border },
  stat:        { alignItems: 'center' },
  statNum:     { fontSize: 22, fontWeight: '800', color: T.primary },
  statLbl:     { fontSize: 12, color: T.muted },
  section:     { padding: 20 },
  sectionTitle:{ fontSize: 18, fontWeight: '700', color: T.text, marginBottom: 16 },
  courseRow:   { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: T.card, borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  courseThumb: { width: 50, height: 50, backgroundColor: '#1E1E3A', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  courseTitle: { fontSize: 14, fontWeight: '700', color: T.text, marginBottom: 4 },
  courseMeta:  { fontSize: 12, color: T.muted },
});
