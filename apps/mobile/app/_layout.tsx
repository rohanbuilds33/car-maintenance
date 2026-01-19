// app/_layout.tsx
import { Stack } from "expo-router";
import { useEffect } from "react";
import { initDb } from "../src/db/db";

export default function RootLayout() {
  useEffect(() => {
    initDb();
  }, []);

  return <Stack />;
}
