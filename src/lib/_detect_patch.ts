export function detectCluster(position: string, department: string): CompetencyCluster {
  const pos = position.toLowerCase();
  const dept = department.toLowerCase();

  // 1. Cek department dulu — lebih reliable dari position text
  const DEPT_MAP: Record<string, CompetencyCluster> = {
    hr: "hr",
    engineering: "tech",
    product: "tech",
    data: "tech",
    security: "tech",
    finance: "finance",
    legal: "finance",
    design: "business",
    sales: "business",
    operations: "business",
  };

  if (DEPT_MAP[dept]) return DEPT_MAP[dept];

  // 2. Cek position dengan keyword yang lebih spesifik
  const HR_POS = ["hr ", "human resource", "hrd", "hrga", "hrbp", "rekrutmen", "talent acquisition", "payroll", "compensation", "people"];
  const TECH_POS = ["engineer", "developer", "software", "backend", "frontend", "data scientist", "data analyst", "devops", "cloud", "security", "architect", "programmer", "qa ", "sre"];
  const FINANCE_POS = ["finance", "financial", "accounting", "accountant", "akuntan", "treasury", "tax", "audit", "controller", "cfo", "legal", "compliance", "risk manager", "actuary"];

  if (HR_POS.some(k => pos.includes(k))) return "hr";
  if (FINANCE_POS.some(k => pos.includes(k))) return "finance";
  if (TECH_POS.some(k => pos.includes(k))) return "tech";

  // 3. Default: business (MT, General, Operations, Sales, dll)
  return "business";
}