import React, { useState, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";

export default function SetupPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    let score = 0;
    if (newPassword.length >= 8) score += 25;
    if (newPassword.length >= 12) score += 25;
    if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) score += 25;
    if (/\d/.test(newPassword)) score += 12;
    if (/[^a-zA-Z\d]/.test(newPassword)) score += 13;
    return {
      percentage: Math.min(score, 100),
      level: score < 40 ? "Lemah" : score < 70 ? "Sedang" : "Kuat",
      color:
        score < 40
          ? "bg-red-500"
          : score < 70
            ? "bg-yellow-500"
            : "bg-emerald-500",
      textColor:
        score < 40
          ? "text-red-600"
          : score < 70
            ? "text-yellow-600"
            : "text-emerald-600",
    };
  }, [newPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!token) {
      setError("Token tidak ditemukan. Link mungkin tidak valid.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Password dan konfirmasi password harus diisi.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/auth/setup-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: token,
            password: newPassword,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.message || "Gagal menyimpan password. Silakan coba lagi.",
        );
        setIsLoading(false);
        return;
      }

      setSuccess("✓ Password berhasil disimpan! Anda dapat login sekarang.");

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/auth/login");
      }, 2000);
    } catch (error) {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:pr-12">
        {/* Logo & Branding */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-base sm:text-lg font-black text-white">
                II
              </span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-gray-900">
                Inventaris Terpadu
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Sistem Manajemen Inventaris
              </p>
            </div>
          </div>
        </div>

        {/* Main Heading */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            Atur Password
          </h2>
          <p className="text-sm sm:text-base text-gray-500">
            Buat password yang aman untuk akun Anda
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-2xl sm:rounded-3xl flex items-start gap-2 sm:gap-3">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs sm:text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 sm:p-4 bg-emerald-50 border border-emerald-200 rounded-2xl sm:rounded-3xl flex items-start gap-2 sm:gap-3">
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-xs sm:text-sm text-emerald-700">{success}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Password Field */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5 uppercase tracking-wider">
              Password Baru
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Masukkan password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" fill="white" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <div className="mt-2 sm:mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs sm:text-sm font-medium text-gray-600">
                    Kekuatan Password:
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-bold ${passwordStrength.textColor}`}
                  >
                    {passwordStrength.level}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all`}
                    style={{ width: `${passwordStrength.percentage}%` }}
                  />
                </div>
                <ul className="text-xs text-gray-600 mt-2 space-y-1">
                  <li
                    className={
                      newPassword.length >= 8 ? "text-emerald-600" : ""
                    }
                  >
                    {newPassword.length >= 8 ? "✓" : "○"} Minimal 8 karakter
                  </li>
                  <li
                    className={
                      /[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
                        ? "text-emerald-600"
                        : ""
                    }
                  >
                    {/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)
                      ? "✓"
                      : "○"}{" "}
                    Huruf besar dan kecil
                  </li>
                  <li
                    className={/\d/.test(newPassword) ? "text-emerald-600" : ""}
                  >
                    {/\d/.test(newPassword) ? "✓" : "○"} Angka
                  </li>
                  <li
                    className={
                      /[^a-zA-Z\d]/.test(newPassword) ? "text-emerald-600" : ""
                    }
                  >
                    {/[^a-zA-Z\d]/.test(newPassword) ? "✓" : "○"} Karakter
                    spesial (@, #, $, dll)
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-gray-700 block mb-1.5 uppercase tracking-wider">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl sm:rounded-3xl px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Konfirmasi password"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirm ? (
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" fill="white" />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>

            {/* Confirm Match Indicator */}
            {confirmPassword && (
              <div className="mt-2">
                {newPassword === confirmPassword ? (
                  <p className="text-xs sm:text-sm text-emerald-600 flex items-center gap-1">
                    ✓ Password cocok
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm text-red-600 flex items-center gap-1">
                    ✗ Password tidak cocok
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 sm:py-3 px-4 rounded-2xl sm:rounded-3xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6 sm:mt-8"
          >
            {isLoading && (
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            {isLoading ? "Menyimpan..." : "Simpan Password"}
          </button>

          {/* Back to Login */}
          <div className="text-center mt-4 sm:mt-6">
            <p className="text-xs sm:text-sm text-gray-500">
              Sudah punya akun?{" "}
              <Link
                to="/auth/login"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Login di sini
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Right Side - Info Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 to-blue-800 flex-col justify-between p-8 rounded-3xl mr-6 my-6">
        {/* Top Content */}
        <div>
          <h3 className="text-2xl font-black text-white mb-3">
            Keamanan Terjamin
          </h3>
          <p className="text-blue-100 text-sm leading-relaxed mb-8">
            Password Anda akan dienkripsi dengan teknologi terkini untuk menjaga
            keamanan data Anda.
          </p>

          {/* Features List */}
          <div className="space-y-4">
            {[
              {
                icon: "🔒",
                title: "Enkripsi End-to-End",
                desc: "Data terenkripsi dengan standar industri",
              },
              {
                icon: "🛡️",
                title: "Proteksi Berlapis",
                desc: "Sistem keamanan berlapis untuk perlindungan maksimal",
              },
              {
                icon: "⚡",
                title: "Akses Instan",
                desc: "Login dengan mudah setelah menyimpan password",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-white font-semibold text-sm">
                    {item.title}
                  </p>
                  <p className="text-blue-100 text-xs">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Content */}
        <div className="border-t border-blue-400/30 pt-6">
          <p className="text-blue-100 text-xs leading-relaxed">
            Sistem Manajemen Inventori Terpadu • © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
