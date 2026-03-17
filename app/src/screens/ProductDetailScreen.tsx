import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { fetchProduct } from '../services/products';
import type { Product } from '../types/product';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

export default function ProductDetailScreen({ route }: Props) {
  const { id } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct(id)
      .then(setProduct)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#078c7a" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text>Produto não encontrado.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {product.image_url ? (
        <Image source={{ uri: product.image_url }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.placeholderText}>📦</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.type}>{product.type}</Text>
        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.price}>{Number(product.price).toFixed(2)} €</Text>
        <Text style={styles.description}>
          {product.description || 'Sem descrição.'}
        </Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Comprar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#faf9f7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', aspectRatio: 1, backgroundColor: '#f5f5f5' },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: { fontSize: 64 },
  info: { padding: 20 },
  type: { fontSize: 14, color: '#666', marginBottom: 4 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  price: { fontSize: 20, fontWeight: '700', color: '#078c7a', marginBottom: 16 },
  description: { color: '#555', marginBottom: 24 },
  button: {
    backgroundColor: '#078c7a',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
