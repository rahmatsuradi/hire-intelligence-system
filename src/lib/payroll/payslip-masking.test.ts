import { describe, expect, it } from "vitest";
import { maskBankAccount, maskNik, maskNpwp } from "./payslip-masking";

describe("maskNik", () => {
  it("mengungkap 4 depan + 4 belakang, mask 8 tengah", () => {
    expect(maskNik("3201010101900001")).toBe("3201********0001");
  });

  it("mengembalikan em-dash untuk null/kosong", () => {
    expect(maskNik(null)).toBe("—");
    expect(maskNik(undefined)).toBe("—");
    expect(maskNik("")).toBe("—");
  });

  it("menolak (tidak membocorkan) NIK dengan panjang tak wajar", () => {
    expect(maskNik("12345")).toBe("—");
  });
});

describe("maskNpwp", () => {
  it("mengungkap 2 digit pertama + 3 terakhir, mask sisanya, pertahankan separator", () => {
    expect(maskNpwp("09.111.222.3-011.000")).toBe("09.***.***.*-***.000");
  });

  it("mengembalikan em-dash untuk null (karyawan tanpa NPWP di seed)", () => {
    expect(maskNpwp(null)).toBe("—");
  });
});

describe("maskBankAccount", () => {
  it("hanya menampilkan 4 digit terakhir", () => {
    expect(maskBankAccount("1234567890")).toBe("******7890");
  });

  it("mengembalikan em-dash untuk null (seed tidak punya bank_account)", () => {
    expect(maskBankAccount(null)).toBe("—");
  });

  it("mengembalikan em-dash bila terlalu pendek untuk di-mask secara aman", () => {
    expect(maskBankAccount("12")).toBe("—");
  });
});
