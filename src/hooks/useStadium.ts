// src/hooks/useStadium.ts
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { getDownloadURL, ref } from "firebase/storage";
import { useEffect, useState } from "react";

type Stadium = {
  id: string;
  teamId: string;
  name: string;
  capacity: number;
  ticketPrice: number;
  imagePath?: string;
  imageUrl?: string;
};

export function useStadium(teamId?: string) {
  const [stadium, setStadium] = useState<Stadium | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    const q = query(collection(db, "stadiums"), where("teamId", "==", teamId));
    const unsub = onSnapshot(q, async (snap) => {
      const d = snap.docs[0];
      if (!d) { setStadium(null); setLoading(false); return; }
      const { id: _ignore, ...rest } = d.data() as any;
      const s = { id: d.id, ...rest } as Stadium;
      let imageUrl = "/stadium-placeholder.jpg";
      if (s.imagePath) {
        try { imageUrl = await getDownloadURL(ref(storage, s.imagePath)); } catch {}
      }
      setStadium({ ...s, imageUrl });
      setLoading(false);
    });
    return () => unsub();
  }, [teamId]);

  return { stadium, loading };
}
