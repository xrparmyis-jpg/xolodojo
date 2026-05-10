interface SectionParallaxBlobsProps {
    bgShapeOffset: number;
    colorBgOffset: number;
    colorBg2Offset: number;
}

const blobMotion =
    'will-change-transform transition-transform duration-100 ease-out';
/** Below `lg`, blobs read as overpowering behind body copy; keep full punch on large screens. */
const blobVisual =
    'pointer-events-none brightness-[0.56] saturate-[0.82] md:brightness-[0.68] md:saturate-[0.88] lg:brightness-[1.2] lg:saturate-100';

function SectionParallaxBlobs({
    bgShapeOffset,
    colorBgOffset,
    colorBg2Offset,
}: SectionParallaxBlobsProps) {
    return (
        <>
            <div
                className={`absolute inset-y-0 left-1/2 -z-10 ${blobVisual} ${blobMotion}`}
                style={{ transform: `translateX(-50%) translateY(${bgShapeOffset}px)` }}
            >
                <img src="/bg-shape.png" alt="shape-img" />
            </div>

            <div
                className={`absolute bottom-1/4 left-0 -z-10 ${blobVisual} ${blobMotion}`}
                style={{ transform: `translateY(${colorBgOffset}px)` }}
            >
                <img src="/color-bg-shape.png" alt="img" />
            </div>

            <div
                className={`absolute right-[-100px] top-[-12%] -z-10 ${blobVisual} ${blobMotion}`}
                style={{ transform: `translateY(${colorBg2Offset}px)` }}
            >
                <img src="/color-bg-shape-2.png" alt="img" />
            </div>
        </>
    );
}

export default SectionParallaxBlobs;
