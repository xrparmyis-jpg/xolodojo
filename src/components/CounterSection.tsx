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

function CounterSection() {
    return (
        <div className="counter-section section-padding pb-0">
            <div className="container">
                <div className="counter-wrapper flex justify-center grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
                    {counterData.map(({ icon, end, label, delay }) => (
                        <motion.div
                            key={label}
                            className="counter-items"
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay }}
                            viewport={{ once: true, amount: 0.5 }}
                        >
                            <div className="icon flex items-center justify-center">
                                <img src={icon} alt="img" />
                            </div>
                            <div className="content">
                                <h2 className='mb-4'>
                                    <Counter end={end} duration={2000} className="count" />
                                </h2>
                                <p>{label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default CounterSection;
