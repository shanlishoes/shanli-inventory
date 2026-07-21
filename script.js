let codeReader = null;

async function startCamera() {

    const reader = document.getElementById("reader");

    reader.innerHTML = "";

    codeReader = new ZXing.BrowserMultiFormatReader();

    try {

        const devices = await ZXing.BrowserCodeReader.listVideoInputDevices();

        if (devices.length == 0) {

            alert("هیچ دوربینی پیدا نشد.");

            return;

        }

        let cameraId = devices[0].deviceId;

        devices.forEach(function (d) {

            const name = d.label.toLowerCase();

            if (
                name.includes("back") ||
                name.includes("rear") ||
                name.includes("environment")
            ) {

                cameraId = d.deviceId;

            }

        });

        codeReader.decodeFromVideoDevice(

            cameraId,

            "reader",

            (result, err) => {

                if (result) {

                    document.getElementById("barcode").value = result.text;

                }

            }

        );

    } catch (e) {

        alert("خطا در باز کردن دوربین\n\n" + e);

    }

}

document.getElementById("startBtn").onclick = function () {

    document.getElementById("loginPage").style.display = "none";

    document.getElementById("scanPage").style.display = "block";

    document.getElementById("userLabel").innerText =
        document.getElementById("user").value;

    document.getElementById("branchLabel").innerText =
        document.getElementById("branch").value;

    startCamera();

};
