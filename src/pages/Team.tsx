import GsapPageContent from '../components/GsapPageContent';
import GsapPageHeading from '../components/GsapPageHeading';
import TeamMemberSocialLinks, {
  type TeamMemberSocials,
} from '../components/TeamMemberSocialLinks';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  email?: string;
  socials?: TeamMemberSocials;
}

const teamMembers: TeamMember[] = [
  {
    name: 'Cryptonite',
    role: 'Founder & Visionary Explorer',
    image: '/team/XoloCryptonite.jpg',
    email: 'xrparmyis@gmail.com',
    socials: {
      twitter: 'XoloDojo',
      discord: 'XoloDojo',
      linkedin: '#',
      tiktok: 'XoloDojo',
      instagram: 'XoloDojo',
      telegram: 'XoloDojo',
    },
    bio: `Cryptonite, Donovan S. Hall, is a battle-hardened degen from the golden Clubhouse days of Ethereum. A nomadic, blockchain-agnostic digital pirate who's been sailing the Cryptocurrenseas since 2016, with footprints in 34 countries that have shaped a deep appreciation for travel, networking, diverse cultures, and meaningful connections. Cryptonite is a proud member of the XRP Army, and the creator laying the foundation on the XRPL for The XoloDojo Xoloitzquintli NFT Collection featuring Xglobe: a global, member-built dojo fusing the ancient mesoamerican reverence of the sacred Xoloitzquintli with the modern innovation of Web3.`,
  },
  {
    name: 'RedShadow',
    role: 'Artist & Cultural Alchemist',
    image: '/team/XoloRedShadow.jpg',
    email: 'redshadow@xolodojo.com',
    socials: {
      twitter: '#',
      discord: '#',
      linkedin: '#',
      tiktok: '#',
      instagram: '#',
      telegram: '#',
    },
    bio: `RedShadow, Daniyal Ahmad, is the visionary artist breathing life into The Xoloitzquintli Collection. With a masterful eye for detail and deep respect for Mesoamerican heritage, RedShadow crafts each of the 10,001 unique Xoloitzquintli NFTs as sacred digital guardians — blending timeless cultural symbolism with striking, evocative designs that honor the Xoloitzquintli's role as a spiritual companion and soul guide. Teaming with Cryptonite, RedShadow's artistry forms the visual heart of XoloDojo and Xglobe, inviting holders into a world where ancient legacy meets modern community and real-world reciprocity.`,
  },
  {
    name: 'Code',
    role: 'Lead Builder & Degen Architect ',
    image: '/team/XoloCode.jpg',
    email: 'code@xolodojo.com',
    socials: {
      twitter: '#',
      discord: '#',
      linkedin: '#',
      tiktok: '#',
      instagram: '#',
      telegram: '#',
    },
    bio: `Todd, a.k.a. Code, is a seasoned crypto trader with razor-sharp market instincts and hands-on building experience. Fluid in React.js, and battle-tested in high-stakes web development, he's shipped name-brand websites (under NDA) for top players in the space. Now building with the Xolo pack on XRPL, Code delivers the technical backbone for the XoloDojo and Xglobe, turning visionary ideas into seamless, secure, interactive experiences. From smart community tools to immersive interfaces, he ensures the Xglobe runs smoothly, the Xpin connects flawlessly, and the pack thrives in Web3. Code's blend of technical and coding skills is crucial in building a resilient, vibrant community for XoloDojo's future.`,
  },
];

const memberDelays = [0.12, 0.2, 0.28];

function TeamMemberHeading({ member }: { member: TeamMember }) {
  return (
    <div className="mb-0 flex flex-wrap items-center justify-center gap-3 md:justify-start">
      <h3 className="text-2xl font-bold text-[#ffee00] md:text-3xl">
        {member.name}
      </h3>
      <TeamMemberSocialLinks
        name={member.name}
        email={member.email}
        socials={member.socials}
      />
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
              Xglobe: a token-gated global community for trust, travel,
              skill-sharing, and real-world adventures. Together, we're not just
              minting NFTs — we're building a network of passionate individuals
              ready to connect, collaborate, and build the future.
            </GsapPageContent>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-8 lg:py-12 bg-(--bg)">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {teamMembers.map((member, index) => (
              <GsapPageContent
                key={member.name}
                className="mb-8"
                delay={memberDelays[index] ?? 0.12}
              >
                <TeamMemberHeading member={member} />
                <h4 className="text-lg text-center md:text-left md:text-xl font-semibold text-[#642ff8] mb-4">
                  {member.role}
                </h4>
                <div className="flex flex-col items-center gap-4 md:flex-row md:items-start md:gap-6">
                  <img
                    src={member.image}
                    alt={member.name}
                    width={340}
                    height={340}
                    className="w-[340px] max-w-full shrink-0 rounded-md"
                  />
                  <p className="text-justify">{member.bio}</p>
                </div>
              </GsapPageContent>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Team;
