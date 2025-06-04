// import React from "react";
import { useNavigate } from "react-router-dom";
import homeLogo from "../../assets/ustp thingS/Home.png";

type CommunityRulesProps = {
  onSettingsClick: () => void;
};

export default function CommunityRules({ onSettingsClick }: CommunityRulesProps) {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#fff" }}>
      {/* Header */}
      <div
        style={{
          background: "#fff",
          display: "flex",
          alignItems: "center",
          height: 72,
          paddingLeft: 55,
          paddingRight: 24,
          gap: 18,
          borderBottom: "1px solid #ccc",
          boxShadow: "0 2px 4px 0 rgba(0,0,0,0.04)",
        }}
      >
        <img
          src={homeLogo}
          alt="Home Icon"
          className="h-7 w-auto"
          style={{ cursor: "pointer" }}
          onClick={() => navigate('/dashboard')}
        />
        <div
          style={{
            width: 2,
            height: 36,
            background: "#F48C8C",
            marginLeft: 18,
            marginRight: 18,
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="text-3xl font-bold"
            style={{ color: "#F88379", opacity: 0.63, cursor: "pointer" }}
            onClick={onSettingsClick}
          >
            Settings
          </span>
          <span className="text-3xl font-bold" style={{ color: "#F88379" }}>
            &gt; <span style={{ fontWeight: 700 }}>Community Rules</span>
          </span>
        </div>
      </div>
      {/* Main content */}
      <div style={{ width: "100%", paddingLeft: 48, paddingRight: 48, paddingTop: 32, paddingBottom: 32 }}>
        <h1 className="text-3xl font-bold" style={{ color: "#F88379", textAlign: "center", marginBottom: 24 }}>
          Community Rules
        </h1>
        <p style={{ marginBottom: 32, textAlign: "center" }}>
          We want to build a friendly and positive community here at USTP Things! That's why we have come up with Community Rules as a guideline for all buyers and sellers in order to preserve this safe environment to shop and sell on-the-go. Go through this outline for the Do's and Dont's when using our mobile marketplace! By using USTP Things, you agree to our Terms of Service. We are committed to keeping our community safe with everybody's effort.
        </p>
        <h2 style={{ color: "#F88379", fontWeight: 700, textAlign: "center", marginBottom: 16, fontSize: 24, borderBottom: "2px solid #F88379", paddingBottom: 8 }}>
          The Do's
        </h2>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>1. Sell, not advertise</h3>
          <p style={{ marginBottom: 8 }}>
            USTP Things is designed as a venue to assist transactions between buyers and sellers – not a platform for advertisements. You should only list products that you are intending to sell on USTP Things.
          </p>
          <p style={{ marginBottom: 8 }}>Here are some examples of advertising:</p>
          <ul style={{ marginLeft: 24, marginBottom: 8 }}>
            <li>Adding a link on your product page that leads to a separate website.</li>
            <li>Any text in your product description and/or photos informing buyers to reach you via other platforms such as Whatsapp or Facebook. (We understand the need for buyers and sellers to communicate with one another. The Chat Now function in USTP Things provides an easy way for both parties to connect!)</li>
          </ul>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>2. How to make your listing shine</h3>
          <p>
            No buyer will be interested in a listing that has poor quality photos. Flaunt your photography skills and create some quality shots – check out USTP Things tips here. Aside from that, be honest! Give your product an accurate and detailed description. Nobody likes a nasty surprise when it comes to purchasing something. Being truthful will increase your chances of obtaining positive ratings and reviews from your buyers!
          </p>
        </div>
        <h2 style={{ color: "#F88379", fontWeight: 700, textAlign: "center", marginBottom: 16, fontSize: 24, borderBottom: "2px solid #F88379", paddingBottom: 8 }}>
          The Don'ts
        </h2>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>1. Infringing content & impersonation</h3>
          <p style={{ marginBottom: 8 }}>
            Any deceptive manner of impersonation is a serious offense in USTP Things. If you choose to use someone else's photo, respect their rights and give credit where it's due.
          </p>
          <p style={{ marginBottom: 8 }}>Here are some examples of infringing content & impersonation:</p>
          <ul style={{ marginLeft: 24, marginBottom: 8 }}>
            <li>Collecting and using others' personal data without their consent (i.e. contact details, photos...).</li>
            <li>Using someone's identity as your own for credibility purposes.</li>
          </ul>
          <p>
            Help us keep the USTP Things community strong! If you find any user impersonating you or someone else, please contact us here.
          </p>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>2. Counterfeit & imitation products</h3>
          <p>
            Only genuine products can be listed on USTP Things. Please be aware that counterfeit products are illegal and strictly prohibited. USTP Things reserves the right to report and delete any listing of a counterfeit nature.
          </p>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>3. Posting services</h3>
          <p>
            USTP Things does not allow users to list their services on the platform.
          </p>
        </div>
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>4. Return policy</h3>
          <p>
            Sellers are allowed to set their own return policy as long as it does not contradict with the existing version set by USTP Things.
          </p>
        </div>
      </div>
    </div>
  );
}
