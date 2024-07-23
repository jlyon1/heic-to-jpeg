import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { ImageMagick, initializeImageMagick, MagickFormat } from '@imagemagick/magick-wasm';

const Idx = () => {
    const [files, setFiles] = useState<File[]>([]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(Array.from(event.target.files));
        }
    };

    const handleClick = async () => {
        const images = await Promise.all(files.map(file => file.arrayBuffer()));
        const byteArrays = images.map(buffer => new Uint8Array(buffer));
        await test(byteArrays);  // Ensure we wait for the test function to complete
    };

    return (
        <React.StrictMode>
            <h1 className={"text-2xl text-black font-black"}>HEIC to JPEG Converter</h1>
            <div className="mb-3 w-96">
                <label
                    htmlFor="formFileMultiple"
                    className="mb-2 inline-block"
                >
                    Select Files to Convert
                </label>
                <input
                    className="pointer relative m-0 block w-full min-w-0 flex-auto rounded border border-solid border-neutral-300 bg-clip-padding px-3 py-[0.32rem] text-base font-normal file:-mx-3 file:-my-[0.32rem] file:overflow-hidden file:rounded-none file:border-0 file:border-solid file:border-inherit file:bg-neutral-100 file:px-3 file:py-[0.32rem] file:text-neutral-700 file:transition file:duration-150 file:ease-in-out file:[border-inline-end-width:1px] file:[margin-inline-end:0.75rem] hover:file:bg-neutral-200 focus:border-primary focus:text-neutral-700 focus:shadow-te-primary focus:outline-none dark:border-neutral-600 dark:text-neutral-200 dark:file:bg-neutral-700 dark:file:text-neutral-100 dark:focus:border-primary"
                    type="file"
                    accept={".heic"}
                    id="formFileMultiple"
                    multiple
                    onChange={handleFileChange}
                />
                <button className={"p-2 bg-blue-400 text-white rounded border hover:bg-blue-800"} onClick={handleClick}>Process Images</button>
            </div>
        </React.StrictMode>
    );
};

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);
root.render(<Idx />);

async function test(images: Uint8Array[]) {
    const wasmLocation = new URL('@imagemagick/magick-wasm/magick.wasm', import.meta.url).href;

    const wasmResponse = await fetch(wasmLocation);
    const wasmBytes = await wasmResponse.arrayBuffer();

    await initializeImageMagick(wasmBytes);

    // Use a loop to handle asynchronous read and write operations
    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        await new Promise<void>((resolve) => {
            ImageMagick.read(image, (magickImage) => {
                magickImage.write(MagickFormat.Jpeg, (jpegData) => {
                    const blob = new Blob([jpegData], { type: 'image/jpeg' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `image_${i + 1}.jpeg`;
                    a.click();
                    URL.revokeObjectURL(url);
                    console.log(`Processed image ${i + 1}`);
                    resolve();  // Resolve the promise once the image is processed
                });
            });
        });
    }
}
