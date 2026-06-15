import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { apiCall } from '../config';

const T = { bg: '#050505', card: '#0A0A0A', primary: '#FFFFFF', accent: '#888888', text: '#FFFFFF', muted: '#888888', border: '#222222' };
const EMOJIS = { Programming: '💻', 'Web Development': '🌐', Security: '🔒', Database: '🗄️', Mobile: '📱', 'AI/ML': '🤖' };

export default function CoursesScreen({ navigation, token }) {
  const [courses, setCourses] = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadCourses(); }, []);

  const loadCourses = async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/courses?search=${encodeURIComponent(q)}` : '/courses';
      const data = await apiCall('GET', url, null, token);
      setCourses(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  let searchTimer;
  const onSearch = (v) => {
    setSearch(v);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => loadCourses(v), 400);
  };

  const renderCourse = ({ item: c }) => (
    <TouchableOpacity style={s.card} onPress={() => navigation.navigate('CourseDetail', { course: c })}>
      <View style={s.thumb}><Text style={s.emoji}>{EMOJIS[c.category] || '📚'}</Text></View>
      <View style={s.info}>
        <Text style={s.category}>{c.category}</Text>
        <Text style={s.title} numberOfLines={2}>{c.title}</Text>
        <Text style={s.teacher}>by {c.teacher_name || 'Unknown'}</Text>
        <View style={s.footer}>
          <Text style={s.price}>RM {parseFloat(c.price).toFixed(2)}</Text>
          <View style={s.enrollBtn}><Text style={s.enrollText}>Enrol</Text></View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      <TextInput style={s.search} placeholder="🔍  Search courses..." placeholderTextColor={T.muted}
        value={search} onChangeText={onSearch} />
      {loading
        ? <ActivityIndicator color={T.primary} size="large" style={{ marginTop: 40 }} />
        : <FlatList data={courses} keyExtractor={c => String(c.id)} renderItem={renderCourse}
            contentContainerStyle={{ padding: 16 }} ItemSeparatorComponent={() => <View style={{ height: 12 }} />} />
      }
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  search:    { margin: 16, padding: 14, backgroundColor: T.card, borderRadius: 12, color: T.text, borderWidth: 1, borderColor: T.border, fontSize: 15 },
  card:      { backgroundColor: T.card, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: T.border, flexDirection: 'row' },
  thumb:     { width: 90, backgroundColor: '#1E1E3A', alignItems: 'center', justifyContent: 'center' },
  emoji:     { fontSize: 32 },
  info:      { flex: 1, padding: 14 },
  category:  { fontSize: 11, color: T.primary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  title:     { fontSize: 15, fontWeight: '700', color: T.text, marginBottom: 4 },
  teacher:   { fontSize: 12, color: T.muted, marginBottom: 8 },
  footer:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price:     { fontSize: 16, fontWeight: '800', color: T.primary },
  enrollBtn: { backgroundColor: T.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  enrollText:{ color: '#fff', fontWeight: '600', fontSize: 13 },
});
