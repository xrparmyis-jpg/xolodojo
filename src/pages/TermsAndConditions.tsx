import { Link } from 'react-router-dom';

import GsapPageContent from '../components/GsapPageContent';
import GsapPageSubHeading from '../components/GsapPageSubHeading';

function TermsAndConditions() {
  return (
    <>
      <section className="relative border-b border-[#36e9e424] bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30"></section>
      <section className="relative overflow-hidden bg-[var(--bg)] py-8 lg:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <GsapPageSubHeading heading="Terms & Conditions" />
            <GsapPageContent
              as="p"
              className="mb-16 text-center text-lg text-gray-400"
              delay={0}
            >
              Effective Date: July 11, 2026
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.06}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                Introduction
              </h2>
              <p className="mb-4 leading-relaxed">
                These Terms and Conditions (&quot;Terms&quot;) govern your
                access to and use of the XoloDojo website located at
                https://xolodojo.io (the &quot;Site&quot;), the Xglobe
                platform, Xpin features, and all related services
                (collectively, the &quot;Services&quot;) operated by Donovan S.
                Hall (&quot;XoloDojo,&quot; &quot;we,&quot; &quot;us,&quot; or
                &quot;our&quot;), based in Alaska, United States.
              </p>
              <p className="mb-4 leading-relaxed">
                By accessing or using our Services, you agree to be bound by
                these Terms. If you do not agree, do not use the Services.
              </p>
              <p className="leading-relaxed">
                Your use of the Services is also subject to our{' '}
                <Link
                  to="/privacy-policy"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link
                  to="/cookie-policy"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  Cookie Policy
                </Link>
                , which explain how we handle personal information, cookies, and
                similar technologies.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.12}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                1. Eligibility
              </h2>
              <p className="mb-4 leading-relaxed">
                You must be at least 18 years of age to use our Services. By
                using the Services, you represent and warrant that you meet this
                requirement and that your use of the Services complies with all
                applicable laws and regulations in your jurisdiction.
              </p>
              <p className="leading-relaxed">
                It is your sole responsibility to determine whether accessing or
                using XoloDojo&apos;s Services — including purchasing, holding,
                or interacting with NFTs on the XRP Ledger (XRPL) — is legal in
                your jurisdiction.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.18}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                2. The XoloDojo NFT Collection
              </h2>
              <p className="mb-4 leading-relaxed">
                XoloDojo offers a collection of 10,001 unique Xoloitzquintli
                NFTs minted on the XRP Ledger (&quot;Xolo NFTs&quot;). Each Xolo
                NFT is a digital collectible. Purchasing a Xolo NFT grants you:
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-6">
                <li>
                  Ownership of the unique digital artwork associated with that
                  NFT token.
                </li>
                <li>
                  Access to the token-gated Xglobe platform and Xpin features
                  for as long as you hold the NFT in your connected wallet.
                </li>
                <li>
                  The right to display your Xolo NFT for personal,
                  non-commercial use.
                </li>
              </ul>
              <p className="mb-4 leading-relaxed">
                Purchasing a Xolo NFT does not grant you intellectual property
                rights, copyright, or trademark rights over the artwork or the
                XoloDojo brand. All intellectual property remains the property
                of XoloDojo and its creators. Commercial use (merchandise,
                advertising, derivative works for profit) requires explicit
                written permission from XoloDojo.
              </p>
              <p className="leading-relaxed">
                All sales and mints are final, except where refunds are required
                by applicable law. Minting or purchasing may require a
                compatible wallet (e.g. Xaman) and sufficient XRP; network fees
                are your responsibility.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.24}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                3. Xglobe &amp; Xpin
              </h2>
              <p className="mb-4 leading-relaxed">
                Xglobe is a token-gated, interactive world map available
                exclusively to verified Xolo NFT holders. Access to Xglobe
                requires connecting a wallet holding at least one Xolo NFT.
                Users may also create an account using an email address.
              </p>
              <p className="mb-4 leading-relaxed">
                Xpin is your personal profile on Xglobe. By creating an Xpin,
                you agree to:
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-6">
                <li>Provide accurate information in your profile.</li>
                <li>Not impersonate any person or entity.</li>
                <li>
                  Not use your Xpin to promote illegal activity, spam, hate
                  speech, or harmful content.
                </li>
                <li>
                  Take full responsibility for the content you publish on your
                  Xpin.
                </li>
              </ul>
              <p className="leading-relaxed">
                XoloDojo reserves the right to remove any Xpin or suspend any
                user&apos;s access to Xglobe for violations of these Terms,
                without prior notice.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.3}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                4. Peer-to-Peer Interactions
              </h2>
              <p className="mb-4 leading-relaxed">
                All interactions between XoloDojo community members — including
                skill trades, exchanges, meetups, lodging swaps, and any other
                arrangements — are strictly peer-to-peer (P2P). XoloDojo acts
                solely as a platform facilitating connections and is not a party
                to any agreement, transaction, or arrangement made between
                users.
              </p>
              <p className="mb-4 leading-relaxed">
                XoloDojo is not responsible for:
              </p>
              <ul className="mb-6 list-disc space-y-2 pl-6">
                <li>The accuracy of any user&apos;s Xpin information.</li>
                <li>
                  The outcome of any P2P interaction, exchange, or transaction.
                </li>
                <li>
                  Any loss, damage, or dispute arising from interactions between
                  users.
                </li>
              </ul>
              <p className="leading-relaxed">
                All transactions made wallet-to-wallet on the XRPL are final and
                irreversible. XoloDojo has no ability to reverse, cancel, or
                mediate blockchain transactions.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.36}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                5. Prohibited Conduct
              </h2>
              <p className="mb-4 leading-relaxed">You agree not to:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Use the Services for any unlawful purpose or in violation of
                  any applicable laws.
                </li>
                <li>
                  Attempt to gain unauthorized access to any part of the
                  Services or another user&apos;s account.
                </li>
                <li>Harass, threaten, or harm other users.</li>
                <li>
                  Post or transmit any content that is defamatory, obscene,
                  fraudulent, or harmful.
                </li>
                <li>
                  Use automated bots, scrapers, or scripts to access or interact
                  with the Services.
                </li>
                <li>
                  Attempt to manipulate or disrupt the Xglobe platform or Xpin
                  functionality.
                </li>
                <li>
                  Misrepresent ownership of Xolo NFTs or affiliation with
                  XoloDojo.
                </li>
              </ul>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.42}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                6. Intellectual Property
              </h2>
              <p className="leading-relaxed">
                All content on the Site, including but not limited to text,
                graphics, logos, artwork, and software, is the property of
                XoloDojo or its licensors and is protected by applicable
                intellectual property laws. You may not reproduce, distribute,
                or create derivative works without express written permission
                from XoloDojo.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.48}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                7. NFT &amp; Blockchain Risks
              </h2>
              <p className="mb-4 leading-relaxed">
                You acknowledge and accept the following risks associated with
                NFTs and blockchain technology:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  The value of NFTs is volatile and may decrease to zero.
                  XoloDojo makes no representations regarding the future value
                  of Xolo NFTs.
                </li>
                <li>
                  Blockchain transactions are irreversible. Lost wallet access,
                  lost private keys, or erroneous transactions cannot be
                  recovered by XoloDojo.
                </li>
                <li>
                  The XRPL and associated wallets are third-party technologies
                  outside XoloDojo&apos;s control.
                </li>
                <li>
                  Regulatory changes may affect the legal status of NFTs in your
                  jurisdiction.
                </li>
              </ul>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.54}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                8. Disclaimer of Warranties
              </h2>
              <p className="leading-relaxed">
                The Services are provided on an &quot;as is&quot; and &quot;as
                available&quot; basis without warranties of any kind, either
                express or implied. XoloDojo does not warrant that the Services
                will be uninterrupted, error-free, or free of harmful
                components.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.6}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                9. Limitation of Liability
              </h2>
              <p className="leading-relaxed">
                To the fullest extent permitted by applicable law, XoloDojo and
                its team members shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising
                out of or related to your use of the Services, including but not
                limited to loss of NFTs, loss of funds, or loss of data.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.66}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                10. Governing Law
              </h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance
                with the laws of the State of Alaska, United States, without
                regard to its conflict of law principles. Any disputes arising
                under these Terms shall be subject to the exclusive jurisdiction
                of the courts located in Alaska.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.72}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                11. Changes to These Terms
              </h2>
              <p className="leading-relaxed">
                XoloDojo reserves the right to modify these Terms at any time.
                We will notify users of material changes by updating the
                effective date at the top of this page. Continued use of the
                Services after changes constitutes acceptance of the updated
                Terms.
              </p>
            </GsapPageContent>

            <GsapPageContent as="section" className="mb-12" delay={0.78}>
              <h2 className="mb-6 border-b border-cyan-900/50 pb-4 text-3xl font-semibold text-cyan-300">
                12. Contact
              </h2>
              <p className="leading-relaxed">
                For questions about these Terms, please contact us at:{' '}
                <a
                  href="mailto:contact@xolodojo.io"
                  className="font-semibold text-cyan-300 underline-offset-2 hover:text-[#b7e9f7] hover:underline"
                >
                  contact@xolodojo.io
                </a>
                .
              </p>
            </GsapPageContent>
          </div>
        </div>
      </section>
    </>
  );
}

export default TermsAndConditions;
