"use client";

export function getPasswordStrength(pwd: string) {
  if (!pwd) {
    return {
      score: 0,
      label: "",
      color: "#dee2e6",
      checks: { length: false, upper: false, lower: false, number: false, special: false },
    };
  }

  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
  };

  let points = 0;
  if (checks.length) points++;
  if (checks.upper && checks.lower) points++;
  if (checks.number) points++;
  if (checks.special) points++;
  if (pwd.length >= 10 && points >= 3) points++;

  let score = 1;
  let label = "Weak";
  let color = "#dc3545"; // Red

  if (!checks.length) {
    score = 1;
    label = "Too short (min 8 chars)";
    color = "#dc3545";
  } else if (points <= 2) {
    score = 1;
    label = "Weak";
    color = "#dc3545";
  } else if (points === 3) {
    score = 2;
    label = "Fair";
    color = "#fd7e14"; // Orange
  } else if (points === 4) {
    score = 3;
    label = "Good";
    color = "#0d6efd"; // Blue
  } else {
    score = 4;
    label = "Strong";
    color = "#198754"; // Green
  }

  return { score, label, color, checks };
}

export default function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);

  return (
    <div
      className="mt-2 mb-2 p-2 rounded-3 border"
      style={{ backgroundColor: "#fdfbf7", borderColor: "#ebdcc5" }}
    >
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="text-muted" style={{ fontSize: "0.72rem" }}>
          Password Strength:
        </span>
        <span
          className="fw-bold"
          style={{ fontSize: "0.72rem", color: strength.color }}
        >
          {strength.label}
        </span>
      </div>

      {/* 4-Segment Strength Meter from Weak to Strong */}
      <div className="d-flex gap-1 mb-2" style={{ height: "5px" }}>
        {[1, 2, 3, 4].map((seg) => (
          <div
            key={seg}
            className="flex-grow-1 rounded-pill"
            style={{
              backgroundColor: seg <= strength.score ? strength.color : "#e2e8f0",
              transition: "background-color 0.25s ease",
            }}
          />
        ))}
      </div>

      {/* Helper criteria checklist */}
      <div className="d-flex flex-wrap gap-2 text-muted" style={{ fontSize: "0.68rem" }}>
        <span className={`d-inline-flex align-items-center ${strength.checks.length ? "text-success fw-semibold" : ""}`}>
          <i className={`bi ${strength.checks.length ? "bi-check-circle-fill text-success" : "bi-circle"} me-1`} />
          8+ chars
        </span>
        <span className={`d-inline-flex align-items-center ${strength.checks.upper && strength.checks.lower ? "text-success fw-semibold" : ""}`}>
          <i className={`bi ${strength.checks.upper && strength.checks.lower ? "bi-check-circle-fill text-success" : "bi-circle"} me-1`} />
          Upper &amp; lowercase
        </span>
        <span className={`d-inline-flex align-items-center ${strength.checks.number ? "text-success fw-semibold" : ""}`}>
          <i className={`bi ${strength.checks.number ? "bi-check-circle-fill text-success" : "bi-circle"} me-1`} />
          Number
        </span>
        <span className={`d-inline-flex align-items-center ${strength.checks.special ? "text-success fw-semibold" : ""}`}>
          <i className={`bi ${strength.checks.special ? "bi-check-circle-fill text-success" : "bi-circle"} me-1`} />
          Symbol (!@#$)
        </span>
      </div>
    </div>
  );
}
