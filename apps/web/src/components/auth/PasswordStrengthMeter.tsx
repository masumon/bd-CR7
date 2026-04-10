"use client";

import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthMeter({
  password,
  showRequirements = true,
}: PasswordStrengthMeterProps) {
  // Password requirement checkers
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  // Calculate strength level
  const passedRequirements = Object.values(requirements).filter(Boolean).length;
  const strengthPercentage = (passedRequirements / 5) * 100;
  
  const strength =
    passedRequirements === 0
      ? "none"
      : passedRequirements <= 2
        ? "weak"
        : passedRequirements === 3
          ? "fair"
          : passedRequirements === 4
            ? "good"
            : "strong";

  const strengthColors = {
    none: { bar: "bg-gray-300", text: "text-gray-600" },
    weak: { bar: "bg-red-500", text: "text-red-600" },
    fair: { bar: "bg-orange-500", text: "text-orange-600" },
    good: { bar: "bg-yellow-500", text: "text-yellow-600" },
    strong: { bar: "bg-green-500", text: "text-green-600" },
  };

  const strengthLabels = {
    none: "No password",
    weak: "Weak",
    fair: "Fair",
    good: "Good",
    strong: "Strong",
  };

  return (
    <div className="space-y-2">
      <style>{`
        [data-strength-meter-id="${password.length}"] {
          width: ${strengthPercentage}%;
        }
      `}</style>
      {/* Strength Meter Bar */}
      {password && (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-medium text-muted-foreground">
              Password Strength
            </label>
            <span
              className={`text-xs font-semibold ${strengthColors[strength].text}`}
            >
              {strengthLabels[strength]}
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {/* Strength meter with dynamic width */}
            <div
              className={`strength-meter-bar h-full transition-all duration-300 ${strengthColors[strength].bar}`}
              aria-label={`Password strength: ${strengthLabels[strength]}`}
              data-strength-meter-id={password.length}
            />
          </div>
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2 pt-2">
          <p className="text-xs font-medium text-muted-foreground">
            Password must contain:
          </p>
          <ul className="space-y-1">
            {[
              {
                key: "minLength",
                label: "At least 8 characters",
                met: requirements.minLength,
              },
              {
                key: "hasUpperCase",
                label: "One uppercase letter (A-Z)",
                met: requirements.hasUpperCase,
              },
              {
                key: "hasLowerCase",
                label: "One lowercase letter (a-z)",
                met: requirements.hasLowerCase,
              },
              {
                key: "hasNumber",
                label: "One number (0-9)",
                met: requirements.hasNumber,
              },
              {
                key: "hasSpecialChar",
                label: "One special character (!@#$%^&*)",
                met: requirements.hasSpecialChar,
              },
            ].map(({ key, label, met }) => (
              <li
                key={key}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  met
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                }`}
              >
                {met ? (
                  <Check className="h-4 w-4 flex-shrink-0" />
                ) : (
                  <X className="h-4 w-4 flex-shrink-0" />
                )}
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
