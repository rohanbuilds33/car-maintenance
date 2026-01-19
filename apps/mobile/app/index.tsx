import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { MaintenanceKey } from "../src/domain/maintenance";
import { computeDueItems, type DueItem } from "../src/domain/schedule";

import {
  getCurrentMileage,
  getServiceRecords,
  initDb,
  logServiceNow,
  setCurrentMileage,
} from "../src/db/db";

export default function IndexScreen() {
  const [mileageInput, setMileageInput] = useState("");
  const [currentMileage, setCurrentMileageState] = useState<number | null>(null);
  const [items, setItems] = useState<DueItem[]>([]);

  async function refresh(mileage: number | null) {
    const m = mileage ?? 0;
    const records = getServiceRecords(); // typed now

    const computed = computeDueItems({
      currentMileage: m,
      todayISO: new Date().toISOString().slice(0, 10),
      records,
    });

    setItems(computed);
  }

  useEffect(() => {
    async function boot() {
      initDb();

      const mileage = getCurrentMileage();
      setCurrentMileageState(mileage);

      await refresh(mileage);
    }
    boot();
  }, []);

  async function saveMileage() {
    const miles = Number(mileageInput);
    if (Number.isNaN(miles)) return;

    setCurrentMileage(miles);
    setCurrentMileageState(miles);
    await refresh(miles);
  }

  async function logNow(key: MaintenanceKey) {
    if (currentMileage == null) return;
    logServiceNow(key, currentMileage);
    await refresh(currentMileage);
  }

  const mileageDisplay = useMemo(() => {
    if (currentMileage == null) return "Not set";
    return `${currentMileage.toLocaleString()} mi`;
  }, [currentMileage]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Maintenance Status</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Current odometer</Text>
          <Text style={styles.value}>{mileageDisplay}</Text>

          <Text style={[styles.label, { marginTop: 12 }]}>Update odometer</Text>
          <TextInput
            value={mileageInput}
            onChangeText={setMileageInput}
            keyboardType="numeric"
            placeholder="e.g. 12345"
            style={styles.input}
          />
          <View style={{ marginTop: 10 }}>
            <Button title="Save mileage" onPress={saveMileage} />
          </View>
        </View>

        {items.map((it) => (
          <View key={it.def.key} style={styles.card}>
            <Text style={styles.title}>{it.def.title}</Text>

            <Text>
              Status: <Text style={styles.bold}>{it.status}</Text>
            </Text>

            <Text>
              Miles remaining:{" "}
              {it.milesRemaining == null ? "-" : Math.max(it.milesRemaining, 0)}
            </Text>

            <Text>
              Days remaining:{" "}
              {it.daysRemaining == null ? "-" : Math.max(it.daysRemaining, 0)}
            </Text>

            {it.def.notes ? <Text style={styles.notes}>{it.def.notes}</Text> : null}

            <View style={{ marginTop: 10 }}>
              <Button title={`Log ${it.def.title} (Now)`} onPress={() => logNow(it.def.key)} />
            </View>
          </View>
        ))}

        {items.length === 0 ? (
          <Text style={{ marginTop: 20 }}>
            Nothing computed yet. Set mileage above.
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 16, paddingBottom: 40 },
  header: { fontSize: 28, fontWeight: "800", marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#e6e6e6",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  label: { color: "#555", fontWeight: "600" },
  value: { fontSize: 18, fontWeight: "700", marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  title: { fontSize: 18, fontWeight: "800", marginBottom: 8 },
  bold: { fontWeight: "800" },
  notes: { marginTop: 8, color: "#666" },
});
