import GsapPageContent from '../components/GsapPageContent';
import GsapPageHeading from '../components/GsapPageHeading';
import TeamMemberSocialLinks, {
  type TeamMemberSocials,
} from '../components/TeamMemberSocialLinks';

interface TeamMember {
  name: string;
  email?: string;
  socials?: TeamMemberSocials;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Cryptonite',
    email: 'xrparmyis@gmail.com',
    socials: {
      twitter: 'XoloDojo',
      discord: 'XoloDojo',
      linkedin: '#',
      tiktok: 'XoloDojo',
      instagram: 'XoloDojo',
      telegram: 'XoloDojo',
    },
  },
  {
    name: 'RedShadow',
    email: 'redshadow@xolodojo.com',
    socials: {
      twitter: '#',
      discord: '#',
      linkedin: '#',
      tiktok: '#',
      instagram: '#',
      telegram: '#',
    },
  },
  {
    name: 'Code',
    email: 'code@xolodojo.com',
    socials: {
      twitter: '#',
      discord: '#',
      linkedin: '#',
      tiktok: '#',
      instagram: '#',
      telegram: '#',
    },
  },
];

function getTeamMember(name: string): TeamMember | undefined {
  return teamMembers.find(member => member.name === name);
}

function TeamMemberHeading({ name }: { name: string }) {
  const member = getTeamMember(name);

  return (
    <div className="mb-0 flex flex-wrap items-center justify-center gap-3 md:justify-start">
      <h3 className="text-2xl font-bold text-[#ffee00] md:text-3xl">{name}</h3>
      {member && (
        <TeamMemberSocialLinks
          name={member.name}
          email={member.email}
          socials={member.socials}
        />
      )}
    </div>
  );
}

function Team() {
  return (
    <div>
      <section className="relative bg-[url('/Pattern.png')] bg-cover bg-center bg-no-repeat pt-16 pb-4 md:pt-30 border-b border-[#36e9e424]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <GsapPageHeading
              eyebrow="Meet the XoloDojo Team"
              heading="A Sacred Legacy of"
              accent="Friendship, Grind, & Perseverance"
              iconType="star"
              iconCount={1}
              centered
            />
            <GsapPageContent as="p" className="mb-4">
              United by culture, art, and crypto, we're forging XoloDojo and
              Xglobe: a token-gated global community for trust, travel, skill-sharing,
              and real-world adventures. Together, we're not just minting NFTs —
              we're building a network of passionate individuals ready to connect,
              collaborate, and build the future.
            </GsapPageContent>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-8 lg:py-12 bg-(--bg)">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
           
            <GsapPageContent className="mt-4" delay={0.12}>
              <TeamMemberHeading name="Cryptonite" />
              <h4 className="text-lg text-center md:text-left md:text-xl font-semibold text-[#642ff8] mb-4">
                Founder & Visionary Explorer
              </h4>
              <div>
                <img
                  src="/team/XoloCryptonite.jpg"
                  alt="Cryptonite"
                  className="float-left mr-6 mb-3 mt-2 w-[220px] max-w-[50vw] rounded-md"
                />
                <p className="text-justify">
                  Cryptonite, Donovan S. Hall, is a battle-hardened degen from the golden Clubhouse days
                  of Ethereum. A nomadic, blockchain-agnostic digital pirate who's been sailing the Cryptocurrenseas since 2016, with footprints in 34 countries that have shaped a deep appreciation for travel, networking, diverse cultures, and meaningful connections. Cryptonite is a proud member of the XRP Army, and the creator laying the foundation on the XRPL for The XoloDojo Xoloitzquintli NFT Collection featuring Xglobe: a global, member-built dojo fusing the ancient mesoamerican reverence of the sacred Xoloitzquintli with the modern innovation of Web3.
                </p>
              </div>
            </GsapPageContent>

            <GsapPageContent className="mt-8" delay={0.2}>
              <TeamMemberHeading name="RedShadow" />
              <h4 className="text-lg text-center md:text-left md:text-xl font-semibold text-[#642ff8] mb-4">
                Artist & Cultural Alchemist
              </h4>
              <div>
                <img
                  src="/team/XoloRedShadow.jpg"
                  alt="RedShadow"
                  className="float-left mr-6 mb-3 mt-2 w-[220px] max-w-[50vw] rounded-md"
                />
                <p className="text-justify">
                  RedShadow, Daniyal Ahmad, is the visionary artist breathing life into The
                  Xoloitzquintli Collection. With a masterful eye for detail and
                  deep respect for Mesoamerican heritage, RedShadow crafts each
                  of the 10,001 unique Xoloitzquintli NFTs as sacred digital guardians —
                  blending timeless cultural symbolism with striking, evocative
                  designs that honor the Xoloitzquintli's role as a spiritual
                  companion and soul guide. Teaming with Cryptonite, RedShadow's
                  artistry forms the visual heart of XoloDojo and Xglobe,
                  inviting holders into a world where ancient legacy meets
                  modern community and real-world reciprocity.
                </p>
              </div>
            </GsapPageContent>

            <GsapPageContent className="mt-8" delay={0.28}>
              <TeamMemberHeading name="Code" />
              <h4 className="text-lg text-center md:text-left md:text-xl font-semibold text-[#642ff8] mb-4">
                Lead Builder & Degen Architect
              </h4>
              <div>
                <img
                  src="/team/XoloCode.jpg"
                  alt="Code"
                  className="float-left mr-6 mb-3 mt-2 w-[220px] max-w-[50vw] rounded-md"
                />
                <p className="text-justify">
                  Code, Todd A. Nagel, is a seasoned crypto trader with razor-sharp market
                  instincts and hands-on building experience. Fluid in React.js, and battle-tested in high-stakes web development, he's shipped
                  name-brand websites (under NDA) for top players in the space. Now building with the Xolo pack on XRPL, Code delivers the
                  technical backbone for the XoloDojo and Xglobe, turning visionary
                  ideas into seamless, secure, interactive experiences. From
                  smart community tools to immersive interfaces, he ensures the
                  Xglobe runs smoothly, the Xpin connects flawlessly, and the
                  pack thrives in Web3. Code's blend of technical and coding skills is crucial in building a resilient, vibrant community for XoloDojo's future. 
                </p>
              </div>
            </GsapPageContent>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Team;
