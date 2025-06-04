import { useState } from "react";
import Settings from "./Settings";
import AccountandSecurity from "./AccountandSecurity";
import MyProfile from "./MyProfile";
import CommunityRules from "./CommunityRules";

export default function SettingsContainer() {
  const [view, setView] = useState("settings");

  return (
    <>
      {view === "settings" && (
        <Settings
          onAccountSecurityClick={() => setView("account")}
          onCommunityRulesClick={() => setView("communityRules")}
        />
      )}
      {view === "account" && (
        <AccountandSecurity
          onSettingsClick={() => setView("settings")}
          onMyProfileClick={() => setView("profile")}
        />
      )}
      {view === "profile" && (
        <MyProfile 
          onSettingsClick={() => setView("settings")} 
          setView={setView}
        />
      )}
      {view === "communityRules" && (
        <CommunityRules onSettingsClick={() => setView("settings")} />
      )}
    </>
  );
}
