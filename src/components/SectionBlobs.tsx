interface SectionBlobsProps {
    greenBlobOffset: number;
    orangeBlobOffset: number;
}

function SectionBlobs({ greenBlobOffset, orangeBlobOffset }: SectionBlobsProps) {
    return (
        <>
            <div
                className="absolute left-0 top-[5%] z-0 hidden pointer-events-none brightness-[1.2] xl:block will-change-transform transition-transform duration-100 ease-out"
                style={{
                    transform: `translateY(${greenBlobOffset}px)`,
                }}
            >
                <img src="/color-bg-shape.png" alt="Green blob" className="w-full h-full" />
            </div>

            <div
                className="absolute right-[30px] top-[-155px] z-0 hidden pointer-events-none animate-[rounded_5s_linear_infinite] brightness-[1.2] xl:block will-change-transform transition-transform duration-100 ease-out"
                style={{
                    transform: `translateY(${orangeBlobOffset}px)`,
                }}
            >
                <img src="/color-bg-shape-2.png" alt="Orange blob" className="w-full h-full" />
            </div>
        </>
    );
}

export default SectionBlobs;
