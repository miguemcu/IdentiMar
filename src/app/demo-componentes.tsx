import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import {
  ScreenHeader,
  Button,
  Card,
  Input,
  Badge,
  EstadoBadge,
} from '@/components/ui';
import type { EstadoObservacion } from '@/types';

export default function DemoComponentesScreen() {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [contador, setContador] = useState(0);

  const estados: EstadoObservacion[] = [
    'recibido',
    'procesando',
    'identificado',
    'no_concluyente',
    'pendiente_experto',
    'validado',
    'corregido',
  ];

  return (
    <View className="flex-1 bg-surface">
      <ScreenHeader
        title="Galería de Componentes"
        subtitle="Tokens del sistema Bentos Costero"
        onBack={() => router.back()}
        rightElement={
          <Badge label={`Clics: ${contador}`} variant="ocean" size="sm" />
        }
      />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. SECCIÓN: ESTADO BADGES */}
        <Text className="font-nunito-bold text-lg text-slate-deep mb-2">
          1. EstadoBadge (Estados del Contrato)
        </Text>
        <Card className="mb-5">
          <Text className="font-source text-xs text-slate-mid mb-3">
            Mapeo de los 7 valores de EstadoObservacion a texto y colores en español:
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {estados.map((est) => (
              <EstadoBadge key={est} estado={est} />
            ))}
          </View>
        </Card>

        {/* 2. SECCIÓN: BADGES GENÉRICOS */}
        <Text className="font-nunito-bold text-lg text-slate-deep mb-2">
          2. Badge Genérico
        </Text>
        <Card className="mb-5">
          <View className="flex-row flex-wrap gap-2">
            <Badge label="Ocean" variant="ocean" />
            <Badge label="Ocre" variant="ocre" />
            <Badge label="Éxito" variant="success" />
            <Badge label="Alerta" variant="warning" />
            <Badge label="Peligro" variant="danger" />
            <Badge label="Pizarra" variant="slate" />
          </View>
        </Card>

        {/* 3. SECCIÓN: BOTONES */}
        <Text className="font-nunito-bold text-lg text-slate-deep mb-2">
          3. Button (Variantes y Estados)
        </Text>
        <Card className="mb-5 gap-3">
          <Button
            title="Botón Principal (Ocean)"
            variant="primary"
            onPress={() => setContador((c) => c + 1)}
          />
          <Button
            title="Botón Secundario (Ocre)"
            variant="secondary"
            onPress={() => setContador((c) => c + 1)}
          />
          <Button
            title="Botón Delineado (Outline)"
            variant="outline"
            onPress={() => setContador((c) => c + 1)}
          />
          <Button
            title="Botón Fantasma (Ghost)"
            variant="ghost"
            onPress={() => setContador((c) => c + 1)}
          />
          <Button
            title="Botón de Peligro (Danger)"
            variant="danger"
            onPress={() => setContador((c) => c + 1)}
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button title="Cargando..." loading variant="primary" />
            </View>
            <View className="flex-1">
              <Button title="Deshabilitado" disabled variant="secondary" />
            </View>
          </View>
        </Card>

        {/* 4. SECCIÓN: CAMPOS DE TEXTO */}
        <Text className="font-nunito-bold text-lg text-slate-deep mb-2">
          4. Input (Campos de entrada)
        </Text>
        <Card className="mb-5">
          <Input
            label="Nombre común o notas"
            placeholder="Ej. Raya redonda observada en bajamar"
            value={texto}
            onChangeText={setTexto}
            helperText="Texto libre para describir el avistamiento."
          />
          <Input
            label="Campo con error"
            placeholder="Coordenada inválida"
            value="95.4321"
            error="La latitud debe estar comprendida entre -90 y 90."
          />
        </Card>

        {/* 5. SECCIÓN: TARJETA INTERACTIVA */}
        <Text className="font-nunito-bold text-lg text-slate-deep mb-2">
          5. Card (Contenedores)
        </Text>
        <Card
          onPress={() => setContador((c) => c + 1)}
          className="mb-5 bg-white border border-ocean/20"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="font-nunito-bold text-base text-slate-deep">
              Tarjeta Presionable (Toca aquí)
            </Text>
            <Badge label="Interactiva" variant="ocre" size="sm" />
          </View>
          <Text className="font-source text-sm text-slate-mid">
            Esta tarjeta responde a pulsaciones táctiles con feedback visual. Contador: {contador}.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}
