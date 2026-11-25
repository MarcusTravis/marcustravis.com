import React, { useEffect, useRef, useState } from "react";

const EMAIL = "hello@marcustravis.com";
const TURNSTILE_SITE_KEY = "0x4AAAAAAF_p_ZpSADovc3GT";

export default function Contact() {
  const [status, setStatus] = useState("");
  const widgetRef = useRef(null);
  const widgetId = useRef(null);
  const cancelledRef = useRef(false);
  const loadStartedRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      if (window.turnstile && widgetId.current != null) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  function renderWidget() {
    if (cancelledRef.current || !window.turnstile || !widgetRef.current) return;
    if (widgetId.current != null) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      theme: "dark",
    });
  }

  function loadTurnstile() {
    if (loadStartedRef.current) {
      renderWidget();
      return;
    }
    loadStartedRef.current = true;

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const existing = document.querySelector("script[data-turnstile]");
    if (existing) {
      existing.addEventListener("load", renderWidget);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.dataset.turnstile = "true";
    script.onload = renderWidget;
    document.body.appendChild(script);
  }

  function resetTurnstile() {
    if (window.turnstile && widgetId.current != null) {
      window.turnstile.reset(widgetId.current);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const data = new FormData(form);
    const token =
      data.get("cf-turnstile-response") ||
      (window.turnstile && widgetId.current != null
        ? window.turnstile.getResponse(widgetId.current)
        : "");

    if (!token) {
      loadTurnstile();
      setStatus("NEED_CHECK");
      return;
    }

    setStatus("SENDING");

    fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: String(data.get("name") || "").trim(),
        email: String(data.get("email") || "").trim(),
        message: String(data.get("message") || "").trim(),
        token,
      }),
    })
      .then((response) => {
        if (response.ok) {
          form.reset();
          resetTurnstile();
          setStatus("SUCCESS");
        } else {
          resetTurnstile();
          setStatus("ERROR");
        }
      })
      .catch(() => {
        resetTurnstile();
        setStatus("ERROR");
      });
  }

  return (
    <section className="section" id="hire">
      <div className="wrap hire-grid">
        <div className="contact-copy">
          <h2>Work with me</h2>
          <p>
            I take on a small number of web projects on my own time, outside
            work hours. That includes a new site with contact intake, a
            chatbot or FAQ assistant, or workflow automation. Email me, use
            the form, or connect on LinkedIn.
          </p>
          <ul className="contact-list">
            <li>
              Email:{" "}
              <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </li>
            <li>
              GitHub:{" "}
              <a
                href="https://github.com/MarcusTravis"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/MarcusTravis
              </a>
            </li>
            <li>
              LinkedIn:{" "}
              <a
                href="https://www.linkedin.com/in/marcustravis"
                target="_blank"
                rel="noopener noreferrer"
              >
                linkedin.com/in/marcustravis
              </a>
            </li>
          </ul>
        </div>
        <form
          className="form"
          onSubmit={handleSubmit}
          onFocus={loadTurnstile}
          onPointerDown={loadTurnstile}
          method="POST"
        >
          <label>
            Name
            <input name="name" type="text" required autoComplete="name" />
          </label>
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Message
            <textarea
              name="message"
              required
              placeholder="Tell me about the website or AI setup you need, and how to reach you."
            />
          </label>
          <div className="turnstile" ref={widgetRef} />
          {status === "SUCCESS" ? (
            <p className="form-status success">
              Thanks — your message was sent.
            </p>
          ) : (
            <button className="btn btn-primary" type="submit" disabled={status === "SENDING"}>
              {status === "SENDING" ? "Sending…" : "Send message"}
            </button>
          )}
          {status === "NEED_CHECK" && (
            <p className="form-status error">
              Please complete the check below, then send again.
            </p>
          )}
          {status === "ERROR" && (
            <p className="form-status error">
              The form didn&apos;t send. Please email me at {EMAIL} instead.
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
