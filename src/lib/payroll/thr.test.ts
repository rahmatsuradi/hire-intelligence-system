import { describe, expect, it } from "vitest";
import { computeMasaKerjaBulan, computeTHR } from "./thr";

describe("computeMasaKerjaBulan", () => {
  it("menghitung bulan penuh dari tanggal join sampai referensi", () => {
    expect(computeMasaKerjaBulan("2025-06-01", "2026-01-01")).toBe(7);
  });

  it("membulatkan ke bawah bila belum genap sebulan (join tanggal 15, referensi tanggal 1)", () => {
    expect(computeMasaKerjaBulan("2025-06-15", "2026-01-01")).toBe(6);
  });

  it("tepat 12 bulan untuk ulang tahun kerja pertama", () => {
    expect(computeMasaKerjaBulan("2025-01-01", "2026-01-01")).toBe(12);
  });

  it("tidak pernah negatif (referensi sebelum join)", () => {
    expect(computeMasaKerjaBulan("2026-06-01", "2026-01-01")).toBe(0);
  });
});

describe("computeTHR", () => {
  // Kasus diverifikasi via riset (Permenaker 6/2016 Ps. 3) + 2 verifier independen (hasil identik).
  it("THR prorata: upah 6jt, masa kerja 7 bulan -> Rp3.500.000", () => {
    expect(computeTHR(6_000_000, 7)).toBe(3_500_000);
  });

  it("THR penuh (1x upah) pada masa kerja tepat 12 bulan", () => {
    expect(computeTHR(5_000_000, 12)).toBe(5_000_000);
  });

  it("THR tetap 1x upah (di-cap) untuk masa kerja jauh di atas 12 bulan", () => {
    expect(computeTHR(5_000_000, 96)).toBe(5_000_000);
  });

  it("THR minimum pada tepat 1 bulan masa kerja", () => {
    expect(computeTHR(12_000_000, 1)).toBe(1_000_000); // 1/12 x 12jt
  });

  it("tidak berhak THR (0) untuk masa kerja di bawah 1 bulan", () => {
    expect(computeTHR(5_000_000, 0)).toBe(0);
  });
});
