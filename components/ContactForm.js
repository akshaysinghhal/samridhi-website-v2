"use client";
import { useState } from "react";

export default function ContactForm() {
  const [f, setF] = useState({ name: "", phone: "", email: "", type: "", date: "", location: "", guests: "", message: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const lines = [
      "New enquiry from the website:",
      `Name: ${f.name}`, `Phone: ${f.phone}`, `Email: ${f.email}`,
      `Event type: ${f.type}`, `Date: ${f.date}`, `Location: ${f.location}`,
      `Guests: ${f.guests}`, `Details: ${f.message}`,
    ];
    window.open("https://wa.me/919602228846?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  };

  return (
    <form className="form-card" onSubmit={submit}>
      <h3>Get a Quote</h3>
      <div className="form-row">
        <div className="field"><label>Your Name *</label><input required value={f.name} onChange={set("name")} placeholder="Full name" /></div>
        <div className="field"><label>Mobile Number *</label><input required value={f.phone} onChange={set("phone")} placeholder="+91 …" /></div>
      </div>
      <div className="form-row">
        <div className="field"><label>Email</label><input type="email" value={f.email} onChange={set("email")} placeholder="you@example.com" /></div>
        <div className="field"><label>Event Type *</label>
          <select required value={f.type} onChange={set("type")}>
            <option value="">Select…</option>
            <option>Wedding</option><option>Sangeet / Social</option><option>Corporate Event</option>
            <option>Government Event</option><option>Celebrity / Artist Booking</option><option>Other</option>
          </select>
        </div>
      </div>
      <div className="form-row">
        <div className="field"><label>Event Date</label><input type="date" value={f.date} onChange={set("date")} /></div>
        <div className="field"><label>Location</label><input value={f.location} onChange={set("location")} placeholder="City / venue" /></div>
      </div>
      <div className="field"><label>Expected Guests</label><input value={f.guests} onChange={set("guests")} placeholder="e.g. 300" /></div>
      <div className="field"><label>Tell us about your event</label><textarea rows={4} value={f.message} onChange={set("message")} placeholder="What are you planning?" /></div>
      <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>Send via WhatsApp</button>
      <p style={{ fontSize: 12.5, color: "#7a6a7c", marginTop: 12 }}>Your enquiry opens in WhatsApp — just press send.</p>
    </form>
  );
}
