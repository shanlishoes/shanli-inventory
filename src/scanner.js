import { BrowserMultiFormatReader } from "@zxing/browser";

let reader = null;

export async function startScanner(elementId, onScan) {

    reader = new BrowserMultiFormatReader();

    try {

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();

        if (devices.length === 0) {
            alert("دوربین پیدا نشد");
            return;
        }

        let camera = devices[0];

        devices.forEach(device => {

            const name = device.label.toLowerCase();

            if (
                name.includes("back") ||
                name.includes("rear") ||
                name.includes("environment")
            ) {
                camera = device;
            }

        });

        await reader.decodeFromConstraints(
            {
                video: {
                    deviceId: { exact: camera.deviceId },
                    facingMode: "environment",
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    focusMode: "continuous"
                }
            },
            elementId,
            (result) => {
                if (result) {
                    navigator.vibrate?.(80);
                    onScan(result.getText());
                }
            }
        );

    } catch (e) {

        console.error(e);
        alert("خطا در باز کردن دوربین");

    }

}

export function stopScanner() {

    if (reader) {
        reader.reset();
    }

}