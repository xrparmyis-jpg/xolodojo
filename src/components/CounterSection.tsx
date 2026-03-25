import Counter from './Counter';
import { motion } from 'framer-motion';

const counterData = [
    {
        icon: '/01.svg',
        end: 10001,
        label: 'Unique Xolo NFTs',
        delay: 0.3,
    },
    {
        icon: '/01.svg',
        end: 11,
        label: 'Distinct Traits',
        delay: 0.5,
    },
    {
        icon: '/01.svg',
        end: 333,
        label: 'Unique Traits',
        delay: 0.7,
    },
];

/** Replaces legacy `.section-padding` + `pb-0` from main.css (top padding only). */
const sectionShellClass =
    'pb-0';

function CounterSection() {
    return (
        <section className={sectionShellClass} aria-label="Collection statistics">
            <div className="mx-auto w-full max-w-7xl px-4 py-8 lg:py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 justify-items-center gap-8 lg:grid-cols-3 lg:justify-items-stretch lg:gap-12">
                    {counterData.map(({ icon, end, label, delay }) => (
                        <motion.div
                            key={label}
                            className="flex w-fit max-w-full flex-row items-center gap-[30px] lg:w-full"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay }}
                            viewport={{ once: true, amount: 0.5 }}
                        >
                            <div
                                className="flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-[200px_200px_0_200px] bg-[#b7e9f7] text-[#151518]"
                                aria-hidden
                            >
                                <img src={icon} alt="" className="h-14 w-14 object-contain" />
                            </div>
                            <div className="min-w-0 flex-1 border-l border-[#cfd0d4]/30 pl-[30px] max-[1199px]:border-l-0 max-[1199px]:pl-0">
                                <h2 className="mb-4 text-[70px] font-medium leading-none tracking-tight text-white max-[575px]:text-[50px]">
                                    <Counter end={end} duration={2000} className="tabular-nums" />
                                </h2>
                                <p className="text-2xl font-normal text-[#cdcdcd] max-[1199px]:text-xl">
                                    {label}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default CounterSection;
