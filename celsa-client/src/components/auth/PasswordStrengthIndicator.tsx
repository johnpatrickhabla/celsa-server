"use client";

export function getPasswordStrength(pwd: string) {
  if (!pwd) {
    return {
      level: 0,
      label: "",
      color: "#dee2e6",
      percent: 0,
    };
  }

  const hasLetters = /[a-zA-Z]/.test(pwd);
  const hasNumbers = /[0-9]/.test(pwd);
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
  const varietyCount = (hasLetters ? 1 : 0) + (hasNumbers ? 1 : 0) + (hasSpecial ? 1 : 0);

  if (pwd.length < 6) {
    return {
      level: 1,
      label: "Weak",
      color: "#dc3545", // Red
      percent: 33,
    };
  }

  if (pwd.length >= 8 && (varietyCount >= 2 || pwd.length >= 10)) {
    return {
      level: 3,
      label: "Strong",
      color: "#198754", // Green
      percent: 100,
    };
  }

  return {
    level: 2,
    label: "Medium",
    color: "#fd7e14", // Orange
    percent: 66,
  };
}

export default function PasswordStrengthIndicator({ password }: { password: string }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);

  return (
    <div className="mt-1 mb-2">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <span className="text-muted" style={{ fontSize: "0.72rem" }}>
          Password strength:
        </span>
        <span
          className="fw-bold"
          style={{ fontSize: "0.72rem", color: strength.color }}
        >
          {strength.label}
        </span>
      </div>

      {/* Clean single continuous line meter from Weak to Strong */}
      <div
        className="rounded-pill overflow-hidden"
        style={{ height: "4px", backgroundColor: "#e9ecef" }}
      >
        <div
          style={{
            height: "100%",
            width: `${strength.percent}%`,
            backgroundColor: strength.color,
            transition: "width 0.25s ease, background-color 0.25s ease",
          }}
        />
      </div>
    </div>
  );
}
