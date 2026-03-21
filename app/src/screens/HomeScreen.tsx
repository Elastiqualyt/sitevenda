import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Compre e venda com confiança</Text>
      <Text style={styles.subtitle}>
        Artigos digitais, artesanato e itens reutilizados.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Products')}
      >
        <Text style={styles.buttonText}>Explorar produtos</Text>
      </TouchableOpacity>
      <View style={styles.categories}>
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => navigation.navigate('Products', { type: 'digital' })}
        >
          <Text style={styles.categoryIcon}>📁</Text>
          <Text style={styles.categoryTitle}>Digitais</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => navigation.navigate('Products', { type: 'physical' })}
        >
          <Text style={styles.categoryIcon}>🎨</Text>
          <Text style={styles.categoryTitle}>Artesanato</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.categoryCard}
          onPress={() => navigation.navigate('Products', { type: 'reutilizados' })}
        >
          <Text style={styles.categoryIcon}>♻️</Text>
          <Text style={styles.categoryTitle}>Reutilizados</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#faf9f7',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#222',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#078c7a',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  categories: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
});
