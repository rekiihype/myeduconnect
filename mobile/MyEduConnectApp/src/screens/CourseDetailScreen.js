import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

const T = { bg: '#050505', card: '#0A0A0A', primary: '#FFFFFF', accent: '#888888', text: '#FFFFFF', muted: '#888888', border: '#222222' };
const EMOJIS = { Programming: '💻', 'Web Development': '🌐', Security: '🔒', Database: '🗄️', Mobile: '📱', 'AI/ML': '🤖' };

export default function CourseDetailScreen({ route, navigation, token }) {
  const { course: c } = route.params;

  return (
    <ScrollView style={s.container}>
      <View style={s.thumb}><Text style={s.emoji}>{EMOJIS[c.category] || '📚'}</Text></View>
      <View style={s.body}>
        <View style={s.badge}><Text style={s.badgeText}>{c.category}</Text></View>
        <Text style={s.title}>{c.title}</Text>
        <Text style={s.teacher}>By {c.teacher_name || 'Unknown Instructor'}</Text>
        <Text style={s.desc}>{c.description}</Text>
        <View style={s.pricRow}>
          <Text style={s.price}>RM {parseFloat(c.price).toFixed(2)}</Text>
          <TouchableOpacity style={s.enrollBtn} onPress={() => navigation.navigate('Payment', { course: c })}>
            <Text style={s.enrollText}>Enrol Now →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  thumb:     { height: 180, backgroundColor: '#1E1E3A', alignItems: 'center', justifyContent: 'center' },
  emoji:     { fontSize: 64 },
  body:      { padding: 20 },
  badge:     { alignSelf: 'flex-start', backgroundColor: 'transparent', borderWidth: 1, borderColor: T.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  badgeText: { color: T.primary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title:     { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 6 },
  teacher:   { fontSize: 14, color: T.muted, marginBottom: 16 },
  desc:      { fontSize: 15, color: T.text, lineHeight: 24, marginBottom: 24 },
  pricRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  price:     { fontSize: 24, fontWeight: '800', color: T.primary },
  enrollBtn: { backgroundColor: T.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  enrollText:{ color: '#fff', fontWeight: '700', fontSize: 16 },
});
