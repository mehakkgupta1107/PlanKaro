import { useState } from "react";
import { apiUrl } from "../api";

function Login({ onLogin, onCancel }) {
  const [isRegister, setIsRegister] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrorMessage("");
    setSubmitting(true);
    const url = apiUrl(`/api/auth/${isRegister ? "register" : "login"}`);

    const body = isRegister
      ? { name, email, password, role: "USER" }
      : { email, password };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      const responseText = await response.text();
      let data = {};
      try { data = responseText ? JSON.parse(responseText) : {}; } catch { data = {}; }

      if (!response.ok) {
        setErrorMessage(data.message || data.error || responseText || `Request failed (${response.status})`);
        return;
      }

      if (isRegister) {
        alert("Registration successful! Please login.");
        setIsRegister(false);
        setName("");
        setEmail("");
        setPassword("");
      } else {
        localStorage.setItem("PlanKaroUser", JSON.stringify(data));
        localStorage.removeItem("venuevistaUser");
        onLogin(data);
      }
    } catch (error) {
      console.error("Authentication request failed:", error);
      setErrorMessage("Cannot connect to the backend. Start the Spring Boot server on port 8080 and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-background">
        <div className="login-image"></div>
        <div className="login-image-overlay"></div>

        <div className="login-content">
          <div className="login-brand-block">
            <span>PLANKARO</span>
            <div></div>
            <p>EVENTS • EXPERIENCES • MEMORIES</p>
          </div>

          <div className="login-card">
            <div className="login-card-header">
              <p className="login-label">
                {isRegister ? "JOIN PLANKARO" : "WELCOME BACK"}
              </p>

              <h1>
                {isRegister ? "Create your account." : "Your next experience awaits."}
              </h1>

              <p className="login-description">
                {isRegister
                  ? "Create an account and start discovering unforgettable events."
                  : "Sign in to discover events, reserve your seats and manage your bookings."}
              </p>
            </div>

            {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}

            <form onSubmit={handleSubmit}>
              {isRegister && (
                <div className="login-field">
                  <label htmlFor="register-name">FULL NAME</label>
                  <input
                    id="register-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="login-field">
                <label htmlFor="login-email">EMAIL ADDRESS</label>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="login-password">PASSWORD</label>
                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button className="login-submit" type="submit" disabled={submitting}>
                {submitting ? "Please wait..." : (isRegister ? "Create Account" : "Sign In")}
                <span>→</span>
              </button>
            </form>

            <div className="login-switch">
              <span>
                {isRegister
                  ? "Already have an account?"
                  : "New to PlanKaro?"}
              </span>

              <button type="button" onClick={() => { setErrorMessage(""); setIsRegister(!isRegister); }}>
                {isRegister ? "Sign In" : "Create Account"}
              </button>
            </div>

            {onCancel && <button className="login-back" type="button" onClick={onCancel}>← Back to events</button>}

            <div className="login-security">
              <span>✓</span>
              Secure account & booking experience
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
