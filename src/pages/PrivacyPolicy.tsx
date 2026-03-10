import GsapPageSubHeading from "../components/GsapPageSubHeading";

function PrivacyPolicy() {

  return (
    <>
      <section
        className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]"
      >
      </section>
      <section className="relative overflow-hidden py-8 lg:py-12 bg-[var(--bg)]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto [&_p]:text-[#decee9] [&_ul]:text-[#decee9] [&_li]:text-[#decee9] [&_li>span]:text-[#decee9]">
            <GsapPageSubHeading heading="Privacy Policy" />
            <p className="text-center text-lg text-gray-400 mb-16">
              Last updated: March 9, 2026
            </p>

            <section className="mb-12">
              <h2 className="text-3xl font-semibold mb-6 text-cyan-300 border-b border-cyan-900/50 pb-4">
                1. Introduction
              </h2>
              <p className="mb-4 leading-relaxed">
                Welcome to The Xoloitzquintle Collection (the "Project", "we", "us", or "our"). We operate the website at https://vite-react-neon-beta-24.vercel.app/ (the "Site"), a beta landing page and interface for our collection of 10,001 unique NFTs on the XRP Ledger (XRPL).
              </p>
              <p className="leading-relaxed">
                This Privacy Policy explains what information we collect when you visit the Site or connect your wallet, how we use, share, and protect it, and your privacy rights. We are committed to transparency in this web3 space, where pseudonymity is core — but we still take privacy seriously.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-semibold mb-6 text-cyan-300 border-b border-cyan-900/50 pb-4">
                2. Information We Collect
              </h2>
              <p className="mb-4 leading-relaxed font-semibold">A. When You Connect Your Wallet</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Your public XRPL wallet address (r-address) — temporarily received to enable features such as checking mint eligibility, displaying holder status, or facilitating transactions (e.g., minting).</li>
                <li>Connection-related metadata: Approximate timestamp, browser/device information, and IP address (logged automatically by our hosting provider, Vercel).</li>
                <li>Any signed messages or transaction requests you approve (processed only for the immediate action; we do not store them long-term).</li>
              </ul>
              <p className="mb-4 leading-relaxed">
                <strong>We never request, collect, or have access to:</strong> private keys, seed phrases, passwords, or any sensitive wallet credentials.
              </p>

              <p className="mb-4 leading-relaxed font-semibold">B. Other Automatically Collected Data</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Standard web server logs (IP address, browser type/version, operating system, pages visited, timestamps) via Vercel hosting — used for security, performance, and debugging.</li>
                <li>No cookies, tracking pixels, third-party analytics (e.g., Google Analytics), or advertising trackers are in use on this beta site.</li>
              </ul>

              <p className="leading-relaxed mt-6">
                We do not run forms, email signups, or other personal data inputs on the current beta version.
              </p>

              <p className="leading-relaxed mt-6">
                <strong>Blockchain Data:</strong> All interactions with the XRPL (connects, mints, transfers) are public and permanently recorded on the ledger. Wallet addresses and transaction history are visible to anyone via XRPL explorers — this is inherent to public blockchains and not controlled by us.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-semibold mb-6 text-cyan-300 border-b border-cyan-900/50 pb-4">
                3. How We Use Your Information
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and improve Site functionality (e.g., wallet-based features, future holder utilities like networking or travel experiences).</li>
                <li>To detect and prevent abuse, security incidents, or technical problems.</li>
                <li>To comply with legal obligations, respond to valid requests, or protect our rights.</li>
              </ul>
              <p className="leading-relaxed mt-6">
                We do not sell, rent, or use your wallet address or any data for marketing purposes. Data is processed minimally and pseudonymously.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-semibold mb-6 text-cyan-300 border-b border-cyan-900/50 pb-4">
                4. Sharing & Third Parties
              </h2>
              <p className="leading-relaxed">
                We do not share your information with third parties for their own marketing. Limited sharing may occur:
              </p>
              <ul className="list-disc pl-6 mt-4 space-y-2">
                <li>With service providers (e.g., Vercel for hosting, XRPL nodes for blockchain interaction) under strict confidentiality.</li>
                <li>If required by law, court order, or to protect safety/rights.</li>
              </ul>
              <p className="leading-relaxed mt-6">
                Wallet connections often involve third-party tools (primarily Xaman wallet). Their privacy practices govern what they process — review the Xaman privacy statement for details. We link to external platforms like xrp.cafe for minting; their policies apply separately.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-semibold mb-6 text-cyan-300 border-b border-cyan-900/50 pb-4">
                5. Data Security
              </h2>
              <p className="leading-relaxed">
                We implement reasonable technical and organizational measures (HTTPS, secure hosting) to protect data we handle. However, no system is 100% secure — especially in web3, where user-side risks (phishing, device compromise) exist. Always verify connections and never share private keys.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-semibold mb-6 text-cyan-300 border-b border-cyan-900/50 pb-4">
                6. Your Rights & Choices
              </h2>
              <p className="leading-relaxed">
                You can disconnect your wallet at any time to stop further data processing on our end.
              </p>
              <p className="leading-relaxed mt-4">
                Due to the minimal and mostly pseudonymous nature of data (plus immutable blockchain records), rights like deletion may be limited. If applicable privacy laws (e.g., GDPR, CCPA) give you rights to access, correct, or object, contact us — we'll respond reasonably where feasible.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-semibold mb-6 text-cyan-300 border-b border-cyan-900/50 pb-4">
                7. Changes to This Policy
              </h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy as the beta evolves (e.g., new features). Changes will be posted here with a new "Last updated" date. Continued use of the Site after significant changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-3xl font-semibold mb-6 text-cyan-300 border-b border-cyan-900/50 pb-4">
                8. Contact Us
              </h2>
              <p className="leading-relaxed">
                For questions, concerns, or to exercise rights, reach out via our official channels (X/Twitter, Discord — add your actual links here when set up).
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

export default PrivacyPolicy;
