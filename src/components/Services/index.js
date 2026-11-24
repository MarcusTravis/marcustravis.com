import React from "react";

const services = [
  {
    name: "AI-powered website and contact intake",
    forWho: "For a small business that needs a clear, fast site and a reliable way for inquiries to reach the right person.",
    includes: [
      "A simple, fast website that explains what you do",
      "A contact or intake form, with spam protection",
      "Inquiries delivered to your email or inbox",
      "Optional AI help drafting a first reply from your own information",
      "A short walkthrough so you can update the basics yourself",
    ],
  },
  {
    name: "Chatbot and FAQ assistant",
    forWho: "For a team that answers the same questions over and over, and wants a website assistant that knows when to hand off to a person.",
    includes: [
      "An assistant trained on your FAQs, services, and policies",
      "Clear limits, so it does not invent answers",
      "A path to email or a person when it is unsure",
      "Optional lead capture into your inbox or form workflow",
      "A written handover and a short test period after launch",
    ],
  },
  {
    name: "Workflow automation",
    forWho: "For a business that repeats the same follow-up, paperwork, or email tasks every week and wants those steps connected.",
    includes: [
      "A map of one process you already do by hand",
      "Automation built in Zapier or n8n, on your own accounts",
      "AI used only where text needs to be read or drafted",
      "A person in the loop for anything that goes to a customer, until you are comfortable",
      "Alerts if a run fails, plus a written handover",
    ],
  },
];

export default function Services() {
  return (
    <section className="section" id="services">
      <div className="wrap">
        <div className="section-head">
          <h2>AI setup for small businesses</h2>
          <p>
            I set up practical AI on evenings and weekends: a website with
            contact intake, a chatbot or FAQ assistant, or automation for the
            work that already repeats. I have shipped a dozen free, ad-free
            tool sites — including AI Model Chart and AI Reference Library —
            and I use a small team of AI agents in my own work.
          </p>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <article className="service-card" key={service.name}>
              <h3>{service.name}</h3>
              <p className="service-for">{service.forWho}</p>
              <p className="service-includes-label">What&apos;s included</p>
              <ul>
                {service.includes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <a className="visit" href="#hire">
                Work with me →
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
