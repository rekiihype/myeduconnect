import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { apiCall } from '../config';

const T = { bg: '#050505', card: '#0A0A0A', primary: '#FFFFFF', accent: '#888888', text: '#FFFFFF', muted: '#888888', border: '#222222' };

export default function PaymentScreen({ route, navigation, token }) {
  const { course: c } = route.params;
  const [form, setForm] = useState({ cardNumber: '', cardholderName: '', expiryDate: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const handlePayment = async () => {
    if (!form.cardNumber || !form.cardholderName) return Alert.alert('Error', 'Card details required');
    setLoading(true);
    try {
      // DELIBERATE: Payment data sent over HTTP without TLS (V-12)
      // Wireshark will capture the full card number in plaintext
      await apiCall('POST', '/payment', {
        courseId: c.id,
        cardNumber: form.cardNumber.replace(/\s/g, ''),
        cardholderName: form.cardholderName,
        expiryDate: form.expiryDate,
        cvv: form.cvv
      }, token);
      Alert.alert('Success! 🎉', `You are now enrolled in ${c.title}`, [
        { text: 'OK', onPress: () => navigation.navigate('My Learning') }
      ]);
    } catch (err) {
      Alert.alert('Payment Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20 }}>
      {/* Card Preview */}
      <View style={s.cardPreview}>
        <Text style={s.cardNum}>{form.cardNumber || '•••• •••• •••• ••••'}</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
          <Text style={s.cardMeta}>{form.cardholderName || 'CARDHOLDER NAME'}</Text>
          <Text style={s.cardMeta}>{form.expiryDate || 'MM/YY'}</Text>
        </View>
      </View>

      <View style={s.courseInfo}>
        <Text style={s.courseTitle}>{c.title}</Text>
        <Text style={s.coursePrice}>RM {parseFloat(c.price).toFixed(2)}</Text>
      </View>

      <TextInput style={s.input} placeholder="Cardholder Name" placeholderTextColor={T.muted}
        value={form.cardholderName} onChangeText={set('cardholderName')} />
      <TextInput style={s.input} placeholder="Card Number (e.g. 4111 1111 1111 1111)" placeholderTextColor={T.muted}
        value={form.cardNumber} onChangeText={set('cardNumber')} keyboardType="numeric" maxLength={19} />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TextInput style={[s.input, { flex: 1 }]} placeholder="MM/YY" placeholderTextColor={T.muted}
          value={form.expiryDate} onChangeText={set('expiryDate')} keyboardType="numeric" maxLength={5} />
        <TextInput style={[s.input, { flex: 1 }]} placeholder="CVV" placeholderTextColor={T.muted}
          value={form.cvv} onChangeText={set('cvv')} keyboardType="numeric" maxLength={3} secureTextEntry />
      </View>

      <TouchableOpacity style={[s.btn, loading && { opacity: 0.6 }]} onPress={handlePayment} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'Processing...' : `Pay RM ${parseFloat(c.price).toFixed(2)}`}</Text>
      </TouchableOpacity>

      <Text style={s.warning}>⚠️ Demo environment — do not enter real card details</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: T.bg },
  cardPreview: { backgroundColor: T.primary, borderRadius: 16, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: T.border },
  cardNum:     { color: T.bg, fontSize: 20, letterSpacing: 4, fontFamily: 'monospace' },
  cardMeta:    { color: T.bg, fontSize: 13, opacity: 0.8 },
  courseInfo:  { backgroundColor: T.card, borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: T.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  courseTitle: { color: T.text, fontWeight: '700', fontSize: 15, flex: 1, marginRight: 12 },
  coursePrice: { color: T.primary, fontWeight: '800', fontSize: 18 },
  input:       { backgroundColor: T.card, borderWidth: 1, borderColor: T.border, borderRadius: 10, padding: 14, color: T.text, marginBottom: 14, fontSize: 15 },
  btn:         { backgroundColor: T.primary, padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 17 },
  warning:     { textAlign: 'center', color: T.muted, fontSize: 12, marginTop: 16 },
});
